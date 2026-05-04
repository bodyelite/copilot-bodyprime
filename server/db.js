import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => console.error('[db] error:', err.message));

export async function upsertLead(telefono, nombre, estadoActual, interesActual = 'NO_DEFINIDO') {
    const estadoCopilot = mapearEstado(estadoActual);
    const interes = validarInteres(interesActual);
    const query = `
        INSERT INTO leads (telefono, nombre, estado_dashboard, interes_actual, ultimo_mensaje_hora, cantidad_interacciones)
        VALUES ($1, $2, $3, $4, NOW(), 1)
        ON CONFLICT (telefono)
        DO UPDATE SET
            ultimo_mensaje_hora    = NOW(),
            cantidad_interacciones = leads.cantidad_interacciones + 1,
            nombre                 = COALESCE($2, leads.nombre),
            interes_actual         = $4,
            estado_dashboard       = CASE
                WHEN leads.estado_dashboard IN ('ALERTA_3H', 'ALERTA_AM', 'INCUBACION_BOT')
                THEN 'NUEVO'
                ELSE $3
            END
        RETURNING id;
    `;
    const { rows } = await pool.query(query, [telefono, nombre, estadoCopilot, interes]);
    return rows[0].id;
}

export async function getLeads() {
    const { rows } = await pool.query('SELECT * FROM leads ORDER BY ultimo_mensaje_hora DESC NULLS LAST');
    return rows;
}

export async function getLeadById(id) {
    const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    return rows[0] ?? null;
}

export async function setEstado(id, estado) {
    await pool.query('UPDATE leads SET estado_dashboard = $1, estado_updated_at = NOW() WHERE id = $2', [estado, id]);
}

export async function setEstadoCopilot(telefono, estado) {
    await pool.query('UPDATE leads SET estado_dashboard = $1, estado_updated_at = NOW() WHERE telefono = $2', [estado, telefono]);
}

export async function getLeadsActivos() {
    const { rows } = await pool.query(`
        SELECT id, telefono, nombre, estado_dashboard, interes_actual,
               ultimo_mensaje_hora, postponed_until, estado_updated_at,
               cantidad_interacciones
        FROM leads
        WHERE estado_dashboard NOT IN ('CERRADO', 'AGENDADO')
        ORDER BY ultimo_mensaje_hora ASC NULLS LAST
    `);
    return rows;
}

export async function registrarMensaje(leadId, rol, contenido) {
    await pool.query(
        `INSERT INTO mensajes (lead_id, rol, contenido, created_at) VALUES ($1, $2, $3, NOW())`,
        [leadId, rol, contenido]
    );
}

export async function setAgente(id, agente) {
    await pool.query('UPDATE leads SET agente = $1 WHERE id = $2', [agente, id]);
}

export async function postponeLead(id, minutos = 60) {
    await pool.query(
        `UPDATE leads SET postponed_until = NOW() + ($1 || ' minutes')::interval, estado_dashboard = 'POSPUESTO' WHERE id = $2`,
        [minutos, id]
    );
}

export async function registrarAccion(leadId, agente, tipo, detalle = '') {
    await pool.query(
        `INSERT INTO acciones (lead_id, agente, tipo, detalle, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [leadId, agente, tipo, detalle]
    );
}

export async function getStatsAgentes() {
    const { rows } = await pool.query(`
        SELECT agente, COUNT(*) as cantidad
        FROM leads
        WHERE agente IS NOT NULL
        GROUP BY agente
    `);
    return rows;
}

function mapearEstado(tagZara) {
    const mapa = {
        'NUEVO': 'NUEVO', 'INTERESADO': 'NUEVO', 'HOT': 'NUEVO', 'GESTIÓN': 'NUEVO',
        'AGENDADO': 'AGENDADO', 'NO ASISTIDOS': 'INCUBACION_BOT',
        'ABANDONADOS': 'INCUBACION_BOT', 'DESCARTADO': 'CERRADO',
    };
    return mapa[tagZara] ?? 'NUEVO';
}

function validarInteres(interes) {
    const validos = ['FACIAL', 'CORPORAL', 'GIFTCARD', 'NO_DEFINIDO'];
    return validos.includes(interes) ? interes : 'NO_DEFINIDO';
}

export async function setEstadoGestionHumana(leadId) {
    await pool.query(
        `UPDATE leads
         SET estado_dashboard = 'GESTION_HUMANA',
             estado_updated_at = NOW()
         WHERE id = $1
           AND estado_dashboard NOT IN ('CERRADO', 'AGENDADO', 'POSPUESTO')`,
        [leadId]
    );
}
