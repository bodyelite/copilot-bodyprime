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

CREATE INDEX IF NOT EXISTS idx_leads_estado      ON leads(estado_dashboard);
CREATE INDEX IF NOT EXISTS idx_leads_ultimo_msg  ON leads(ultimo_mensaje_hora);
CREATE INDEX IF NOT EXISTS idx_mensajes_lead_id  ON mensajes(lead_id);
CREATE INDEX IF NOT EXISTS idx_acciones_agente   ON acciones(agente, created_at);
