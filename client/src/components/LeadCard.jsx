import { useState } from 'react';
import { Clock, Zap, Bot, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { posponer, getCopilot } from '../api/client.js';
import AudioRecorder from './AudioRecorder.jsx';

const ESTADO_ESTILOS = {
    ALERTA_3H:     'border-l-amber-400  bg-amber-50',
    ALERTA_AM:     'border-l-blue-400   bg-blue-50',
    INCUBACION_BOT:'border-l-purple-400 bg-purple-50',
    RESUCITADO:    'border-l-green-400  bg-green-50',
    POSPUESTO:     'border-l-gray-300   bg-gray-50',
};

const ESTADO_BADGE = {
    ALERTA_3H:     'bg-amber-100 text-amber-800',
    ALERTA_AM:     'bg-blue-100  text-blue-800',
    INCUBACION_BOT:'bg-purple-100 text-purple-800',
    RESUCITADO:    'bg-green-100 text-green-800',
    POSPUESTO:     'bg-gray-100  text-gray-600',
};

function tiempoDesde(ts) {
    if (!ts) return '—';
    const min = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (min < 60)   return `${min}m`;
    if (min < 1440) return `${Math.round(min/60)}h`;
    return `${Math.round(min/1440)}d`;
}

export default function LeadCard({ lead, agente, onRefrescar }) {
    const [expandido,     setExpandido]     = useState(false);
    const [copilot,       setCopilot]       = useState(null);
    const [cargandoCop,   setCargandoCop]   = useState(false);
    const [posponiendo,   setPosponiendo]   = useState(false);
    const [transcripcion, setTranscripcion] = useState('');

    async function cargarCopilot() {
        if (copilot) { setExpandido(e => !e); return; }
        setCargandoCop(true);
        setExpandido(true);
        try {
            const data = await getCopilot(lead.id);
            setCopilot(data);
        } catch {
            setCopilot({ resumen: 'Error al cargar el copiloto.', guion: '' });
        } finally {
            setCargandoCop(false);
        }
    }

    async function handlePosponer() {
        if (!agente) return alert('Selecciona un agente primero');
        setPosponiendo(true);
        try {
            await posponer(lead.id, agente, 60);
            onRefrescar();
        } finally {
            setPosponiendo(false);
        }
    }

    const estiloCard  = ESTADO_ESTILOS[lead.estado_dashboard] ?? 'border-l-gray-300 bg-white';
    const estiloBadge = ESTADO_BADGE[lead.estado_dashboard]   ?? 'bg-gray-100 text-gray-600';

    return (
        <div className={`border border-gray-200 border-l-4 rounded-xl shadow-sm transition-shadow hover:shadow-md ${estiloCard}`}>
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{lead.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500">{lead.telefono}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${estiloBadge}`}>
                        {lead.estado_dashboard}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock size={11}/> {tiempoDesde(lead.ultimo_mensaje_hora)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Zap size={11}/> {lead.cantidad_interacciones ?? 0} msgs
                    </span>
                    {lead.agente && (
                        <span className="ml-auto font-medium text-indigo-600">{lead.agente}</span>
                    )}
                </div>
            </div>

            <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
                <button
                    onClick={handlePosponer}
                    disabled={posponiendo}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded-lg text-gray-600 transition-colors disabled:opacity-50"
                >
                    {posponiendo ? <Loader2 size={11} className="animate-spin"/> : <Clock size={11}/>}
                    Posponer 1h
                </button>

                <button
                    onClick={cargarCopilot}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Bot size={11}/>
                    Copiloto
                    {expandido ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                </button>

                <button
                    onClick={onRefrescar}
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    title="Refrescar"
                >
                    <RefreshCw size={12}/>
                </button>
            </div>

            {expandido && (
                <div className="border-t border-gray-100 px-3 py-2.5 bg-white/70 rounded-b-xl space-y-2">
                    {cargandoCop ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Loader2 size={13} className="animate-spin"/> Analizando historial…
                        </div>
                    ) : copilot ? (
                        <>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Resumen del caso</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{copilot.resumen}</p>
                            </div>
                            {copilot.guion && (
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Guion sugerido</p>
                                    <p className="text-xs text-indigo-800 bg-indigo-50 rounded-lg px-2.5 py-2 leading-relaxed border border-indigo-100">
                                        {copilot.guion}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : null}

                    {transcripcion && (
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Transcripción</p>
                            <p className="text-xs text-gray-600 italic">{transcripcion}</p>
                        </div>
                    )}

                    <div className="pt-1 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nota de voz</p>
                        <AudioRecorder
                            lead={lead}
                            agente={agente}
                            onTranscripcion={t => setTranscripcion(t)}
                            onEnviado={onRefrescar}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
