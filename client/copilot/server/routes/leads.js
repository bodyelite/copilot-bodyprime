import { Router } from 'express';
import {
    getLeads, getLeadById,
    setAgente, postponeLead,
    registrarAccion, getStatsAgentes,
    getHistorial, setEstado,
} from '../db.js';
import { generarCopilot } from '../services/openai.js';

const router = Router();

router.get('/', async (_req, res) => {
    try {
        const leads = await getLeads();
        res.json(leads);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const lead = await getLeadById(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
        res.json(lead);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/agente', async (req, res) => {
    const { agente } = req.body;
    if (!agente) return res.status(400).json({ error: 'Falta agente' });
    try {
        await setAgente(req.params.id, agente);
        await registrarAccion(req.params.id, agente, 'asignacion');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/estado', async (req, res) => {
    const { estado, agente } = req.body;
    if (!estado || !agente) return res.status(400).json({ error: 'Faltan campos' });
    try {
        await setEstado(req.params.id, estado);
        await registrarAccion(req.params.id, agente, 'cambio_estado', estado);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/posponer', async (req, res) => {
    const { agente, minutos = 60 } = req.body;
    if (!agente) return res.status(400).json({ error: 'Falta agente' });
    try {
        await postponeLead(req.params.id, minutos);
        await registrarAccion(req.params.id, agente, 'posponer', `${minutos} min`);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id/copilot', async (req, res) => {
    try {
        const lead     = await getLeadById(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
        const historial = await getHistorial(lead.id);
        if (!historial.length) return res.json({ resumen: 'Sin historial de mensajes.', guion: '' });
        const resultado = await generarCopilot(lead.nombre, historial);
        res.json(resultado);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/stats/agentes', async (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
    try {
        const stats = await getStatsAgentes(fecha);
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
