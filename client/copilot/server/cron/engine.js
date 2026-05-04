import cron from 'node-cron';
import { getLeads, setEstado } from '../db.js';

const ZONA = 'America/Santiago';

function ahoraChile() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: ZONA }));
}

function esHorarioHabil(fecha) {
    const hora = fecha.getHours();
    const dia  = fecha.getDay();
    return dia >= 1 && dia <= 5 && hora >= 9 && hora < 19;
}

function minutosDesde(timestamp) {
    if (!timestamp) return Infinity;
    const ahora  = Date.now();
    const pasado = new Date(timestamp).getTime();
    return (ahora - pasado) / 60000;
}

async function evaluar(lead) {
    const ahora       = ahoraChile();
    const minSilencio = minutosDesde(lead.ultimo_mensaje_hora);
    const estado      = lead.estado_dashboard ?? 'NUEVO';

    if (!lead.ultimo_mensaje_hora) return;
    if (lead.postponed_until && new Date(lead.postponed_until) > new Date()) return;

    if (estado === 'INCUBACION_BOT' && minSilencio < 5) {
        await setEstado(lead.id, 'RESUCITADO');
        console.log(`[cron] RESUCITADO → lead ${lead.id}`);
        return;
    }

    if (estado === 'ALERTA_3H' && minSilencio > 240) {
        await setEstado(lead.id, 'INCUBACION_BOT');
        console.log(`[cron] INCUBACION_BOT → lead ${lead.id} (${Math.round(minSilencio)} min silencio)`);
        return;
    }

    const horaActual = ahora.getHours();
    const minActual  = ahora.getMinutes();
    if (
        !esHorarioHabil(new Date(lead.ultimo_mensaje_hora)) &&
        horaActual === 9 && minActual < 5 &&
        !['ALERTA_AM', 'ALERTA_3H', 'INCUBACION_BOT', 'RESUCITADO', 'CERRADO'].includes(estado)
    ) {
        await setEstado(lead.id, 'ALERTA_AM');
        console.log(`[cron] ALERTA_AM → lead ${lead.id}`);
        return;
    }

    if (
        esHorarioHabil(ahora) &&
        minSilencio >= 180 &&
        !['ALERTA_3H', 'ALERTA_AM', 'INCUBACION_BOT', 'RESUCITADO', 'CERRADO', 'POSPUESTO'].includes(estado)
    ) {
        await setEstado(lead.id, 'ALERTA_3H');
        console.log(`[cron] ALERTA_3H → lead ${lead.id} (${Math.round(minSilencio)} min silencio)`);
        return;
    }
}

export function iniciarCron() {
    cron.schedule('*/5 * * * *', async () => {
        console.log('[cron] ciclo iniciado', new Date().toISOString());
        try {
            const leads = await getLeads();
            await Promise.all(leads.map(evaluar));
        } catch (e) {
            console.error('[cron] error en ciclo:', e.message);
        }
        console.log('[cron] ciclo terminado');
    }, { timezone: ZONA });

    console.log('[cron] motor iniciado — cada 5 minutos');
}
