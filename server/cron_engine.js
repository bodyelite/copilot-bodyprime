import { getLeadsActivos, setEstadoCopilot } from './db.js';

const ZONA                   = 'America/Santiago';
const HORA_INICIO            = 9;
const HORA_CIERRE            = 20;
const HORA_CIERRE_PROACTIVO  = 20.5;
const MIN_VENTANA_24H        = 23 * 60;
const MIN_VENTANA_VENCIDA    = 24 * 60;
const MIN_DESCARTE_NUEVE_DIAS = 9 * 24 * 60;

function ahoraChile() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: ZONA }));
}

function horaDecimal(fecha) {
    return fecha.getHours() + fecha.getMinutes() / 60;
}

function esHorarioHabil(fecha) {
    const hora = horaDecimal(fecha);
    const dia  = fecha.getDay();
    return dia >= 1 && dia <= 5 && hora >= HORA_INICIO && hora < HORA_CIERRE;
}

function esHorarioProactivo(fecha) {
    const hora = horaDecimal(fecha);
    return hora >= HORA_INICIO && hora < HORA_CIERRE_PROACTIVO;
}

function minutosDesde(timestamp) {
    if (!timestamp) return Infinity;
    return (Date.now() - new Date(timestamp).getTime()) / 60000;
}

function ventanaExpiraFueraDeHorario(ultimoMensajeHora) {
    if (!ultimoMensajeHora) return false;
    const ultimo     = new Date(ultimoMensajeHora);
    const horaUltimo = ultimo.getHours() + ultimo.getMinutes() / 60;
    return horaUltimo >= HORA_CIERRE || horaUltimo < HORA_INICIO;
}

async function evaluarLead(lead) {
    const ahora          = ahoraChile();
    const minSilencio    = minutosDesde(lead.ultimo_mensaje_hora);
    const minEnEstado    = minutosDesde(lead.estado_updated_at);
    const estado         = lead.estado_dashboard ?? 'NUEVO';
    const telefono       = lead.telefono;
    const interacciones  = lead.cantidad_interacciones ?? 1;

    if (lead.postponed_until && new Date(lead.postponed_until) > new Date()) return;

    if (estado === 'INCUBACION_BOT' && minEnEstado >= MIN_DESCARTE_NUEVE_DIAS) {
        await setEstadoCopilot(telefono, 'CERRADO');
        console.log(`[CRON] Verdugo: cerrado por 9 días en incubación: ${telefono}`);
        return;
    }

    if (
        ventanaExpiraFueraDeHorario(lead.ultimo_mensaje_hora) &&
        minSilencio >= MIN_VENTANA_24H - 60 &&
        ahora.getHours() === HORA_CIERRE && ahora.getMinutes() < 5 &&
        estado === 'NUEVO'
    ) {
        await setEstadoCopilot(telefono, 'INCUBACION_BOT');
        console.log(`[CRON] Búho adelantado a las 20h: ${telefono}`);
        return;
    }

    if (minSilencio >= MIN_VENTANA_24H && minSilencio < MIN_VENTANA_VENCIDA) {
        if (!esHorarioProactivo(ahora)) return;
        await setEstadoCopilot(telefono, 'INCUBACION_BOT');
        console.log(`[CRON] Ventana 24h vencida: ${telefono}`);
        return;
    }

    if (estado === 'GESTION_HUMANA' && minSilencio > 180) {
        await setEstadoCopilot(telefono, 'INCUBACION_BOT');
        console.log(`[CRON] Incubación desde gestión humana: ${telefono}`);
        return;
    }

    if (['ALERTA_3H', 'ALERTA_AM'].includes(estado) && minEnEstado > 240) {
        await setEstadoCopilot(telefono, 'INCUBACION_BOT');
        console.log(`[CRON] Incubación desde alerta: ${telefono}`);
        return;
    }

    if (estado !== 'NUEVO') return;

    if (esHorarioHabil(ahora)) {
        const umbralAlerta = interacciones > 1 ? 120 : 180;
        if (minSilencio >= umbralAlerta) {
            await setEstadoCopilot(telefono, 'ALERTA_3H');
            console.log(`[CRON] Alerta 3H (${interacciones > 1 ? 'VIP' : 'normal'}): ${telefono}`);
            return;
        }
    }

    if (!esHorarioHabil(ahora) && minSilencio >= 180) {
        const esMañana = ahora.getHours() === 9 && ahora.getMinutes() < 5;
        if (esMañana) {
            await setEstadoCopilot(telefono, 'ALERTA_AM');
            console.log(`[CRON] Alerta AM: ${telefono}`);
        }
        return;
    }
}

export async function iniciarCronCopilot() {
    const { default: cron } = await import('node-cron');
    cron.schedule('*/5 * * * *', async () => {
        try {
            const leads = await getLeadsActivos();
            await Promise.all(leads.map(evaluarLead));
        } catch (e) {
            console.error('[CRON] Error:', e.message);
        }
    }, { timezone: ZONA });
    console.log('✅ Motor de Reglas (Cron) local iniciado.');
}
