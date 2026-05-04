import { Router } from 'express';
import { getLeads, getStatsAgentes, postponeLead, registrarAccion } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try { res.json(await getLeads()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/posponer', async (req, res) => {
    try {
        await postponeLead(req.params.id, req.body.minutos);
        await registrarAccion(req.params.id, req.body.agente, 'posponer');
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats/agentes', async (req, res) => {
    try { res.json(await getStatsAgentes(req.query.fecha)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
