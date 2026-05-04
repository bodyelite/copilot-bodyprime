import { useState, useEffect, useCallback } from 'react';
import { getLeads } from '../api/client.js';

const ESTADOS_KANBAN = ['ALERTA_3H', 'ALERTA_AM', 'INCUBACION_BOT', 'RESUCITADO', 'POSPUESTO'];

export function useLeads(intervaloMs = 15000) {
    const [leads,    setLeads]    = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);

    const cargar = useCallback(async () => {
        try {
            const data = await getLeads();
            setLeads(data);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const timer = setInterval(cargar, intervaloMs);
        return () => clearInterval(timer);
    }, [cargar, intervaloMs]);

    const columnas = ESTADOS_KANBAN.reduce((acc, est) => {
        acc[est] = leads.filter(l => l.estado_dashboard === est);
        return acc;
    }, {});

    return { leads, columnas, cargando, error, refrescar: cargar };
}
