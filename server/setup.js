import { pool } from './db.js';

const sql = `
CREATE TABLE IF NOT EXISTS leads (
    id                  SERIAL PRIMARY KEY,
    nombre              TEXT,
    telefono            TEXT NOT NULL UNIQUE,
    ultimo_mensaje_hora TIMESTAMPTZ,
    cantidad_interacciones INTEGER DEFAULT 0,
    estado_dashboard    TEXT DEFAULT 'NUEVO',
    estado_updated_at   TIMESTAMPTZ DEFAULT NOW(),
    agente              TEXT,
    postponed_until     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajes (
    id         SERIAL PRIMARY KEY,
    lead_id    INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    rol        TEXT NOT NULL CHECK (rol IN ('user','assistant')),
    contenido  TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acciones (
    id         SERIAL PRIMARY KEY,
    lead_id    INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    agente     TEXT NOT NULL,
    tipo       TEXT NOT NULL,
    detalle    TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function init() {
    try {
        await pool.query(sql);
        console.log('✅ Tablas inyectadas en Render con éxito TOTAL');
    } catch(e) {
        console.error('❌ Error inyectando tablas:', e.message);
    }
    process.exit(0);
}
init();
