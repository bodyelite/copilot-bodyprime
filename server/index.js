import { iniciarCronCopilot } from './cron_engine.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { iniciarCron } from './cron/engine.js';
import leadsRouter from './routes/leads.js';
import audioRouter from './routes/audio.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/audio', audioRouter);

app.listen(4000, () => {
    console.log('[copilot] servidor en http://localhost:4000');
    iniciarCron();
});

iniciarCronCopilot();
