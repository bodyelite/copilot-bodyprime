import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
    console.error('[db] error inesperado en cliente idle:', err.message);
});

export async function getLeads() {
    const { rows } = await pool.query(`
        SELECT
            id,
            nombre,
            telefono,
            ultimo_mensaje_hora,
            cantidad_interacciones,
            estado_dashboard,
            agente,
            postponed_until,
            created_at
        FROM leads
        ORDER BY ultimo_mensaje_hora DESC NULLS LAST
    `);
    return rows;
}

export async function getLeadById(id) {
    const { rows } = await pool.query(
        'SELECT * FROM leads WHERE id = $1',
        [id]
    );
    return rows[0] ?? null;
}

export async function setEstado(id, estado) {
    await pool.query(
        'UPDATE leads SET estado_dashboard = $1, estado_updated_at = NOW() WHERE id = $2',
        [estado, id]
    );
}

export async function setAgente(id, agente) {
    await pool.query(
        'UPDATE leads SET agente = $1 WHERE id = $2',
        [agente, id]
    );
}

export async function postponeLead(id, minutos = 60) {
    await pool.query(
        `UPDATE leads
         SET postponed_until = NOW() + ($1 || ' minutes')::interval,
             estado_dashboard = 'POSPUESTO'
         WHERE id = $2`,
        [minutos, id]
    );
}

export async function registrarAccion(leadId, agente, tipo, detalle = '') {
    await pool.query(
        `INSERT INTO acciones (lead_id, agente, tipo, detalle, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [leadId, agente, tipo, detalle]
    );
}

export async function getStatsAgentes(fecha) {
    const { rows } = await pool.query(`
        SELECT
            agente,
            tipo,
            COUNT(*) AS total
        FROM acciones
        WHERE DATE(created_at) = $1
        GROUP BY agente, tipo
        ORDER BY agente, tipo
    `, [fecha]);
    return rows;
}

export async function getHistorial(leadId, limite = 20) {
    const { rows } = await pool.query(`
        SELECT rol, contenido, created_at
        FROM mensajes
        WHERE lead_id = $1
        ORDER BY created_at DESC
        LIMIT $2
    `, [leadId, limite]);
    return rows.reverse();
}
