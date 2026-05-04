import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

export const getLeads        = ()                        => api.get('/leads').then(r => r.data);
export const getLeadById     = (id)                      => api.get(`/leads/${id}`).then(r => r.data);
export const setAgente       = (id, agente)              => api.post(`/leads/${id}/agente`, { agente }).then(r => r.data);
export const setEstado       = (id, estado, agente)      => api.post(`/leads/${id}/estado`, { estado, agente }).then(r => r.data);
export const posponer        = (id, agente, minutos=60)  => api.post(`/leads/${id}/posponer`, { agente, minutos }).then(r => r.data);
export const getCopilot      = (id)                      => api.get(`/leads/${id}/copilot`).then(r => r.data);
export const getStatsAgentes = (fecha)                   => api.get(`/leads/stats/agentes`, { params: { fecha } }).then(r => r.data);

export const sendAudio = (blob, telefono, leadId, agente) => {
    const form = new FormData();
    form.append('audio',    blob, 'nota.ogg');
    form.append('telefono', telefono);
    form.append('leadId',   leadId);
    form.append('agente',   agente);
    return api.post('/audio/send', form).then(r => r.data);
};

export const transcribeAudio = (blob) => {
    const form = new FormData();
    form.append('audio', blob, 'audio.ogg');
    return api.post('/audio/transcribe', form).then(r => r.data);
};
