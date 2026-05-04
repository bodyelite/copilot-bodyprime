import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { transcribir } from '../services/openai.js';
import { subirAudio, enviarAudio } from '../services/whatsapp.js';
import { registrarAccion } from '../db.js';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

router.post('/send', upload.single('audio'), async (req, res) => {
    const { telefono, leadId, agente } = req.body;
    if (!req.file || !telefono || !agente) return res.status(400).json({ error: 'Faltan datos' });
    try {
        const mediaId = await subirAudio(req.file.path);
        await enviarAudio(telefono, mediaId);
        if (leadId) await registrarAccion(leadId, agente, 'audio_enviado');
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { fs.unlink(req.file.path, () => {}); }
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta audio' });
    try {
        const texto = await transcribir(req.file.path);
        res.json({ texto });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { fs.unlink(req.file.path, () => {}); }
});

export default router;
