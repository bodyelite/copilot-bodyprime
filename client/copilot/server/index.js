import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import { iniciarCron } from './cron/engine.js';
import leadsRouter from './routes/leads.js';
import audioRouter from './routes/audio.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/leads', leadsRouter);
app.use('/api/audio', audioRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`[copilot] servidor en http://localhost:${PORT}`);
    iniciarCron();
});
