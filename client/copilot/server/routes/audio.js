import { Router } from 'express';
import multer      from 'multer';
import fs          from 'fs';
import os          from 'os';
import { transcribir }                          from '../services/openai.js';
import { subirAudio, enviarAudio }              from '../services/whatsapp.js';
import { registrarAccion, setEstadoGestionHumana } from '../db.js';

const router  = Router();
const upload  = multer({ dest: os.tmpdir() });

router.post('/send', upload.single('audio'), async (req, res) => {
    const { telefono, leadId, agente } = req.body;

    if (!req.file)   return res.status(400).json({ error: 'Falta archivo de audio' });
    if (!telefono)   return res.status(400).json({ error: 'Falta telefono' });
    if (!agente)     return res.status(400).json({ error: 'Falta agente' });

    const filePath = req.file.path;

    try {
        const mediaId = await subirAudio(filePath, req.file.mimetype || 'audio/ogg; codecs=opus');
        await enviarAudio(telefono, mediaId);
        if (leadId) {
            await registrarAccion(leadId, agente, 'audio_enviado');
            await setEstadoGestionHumana(leadId);
        }
        res.json({ ok: true, mediaId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        fs.unlink(filePath, () => {});
    }
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo de audio' });
    const filePath = req.file.path;
    try {
        const texto = await transcribir(filePath);
        res.json({ texto });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        fs.unlink(filePath, () => {});
    }
});

export default router;
