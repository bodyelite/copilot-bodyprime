import LeadCard from './LeadCard.jsx';

const COLUMNAS_CONFIG = [
    { id: 'ALERTA_3H',      label: '🔥 Alerta 3h',     descripcion: 'Silencio > 3h en horario hábil'  },
    { id: 'ALERTA_AM',      label: '🌅 Alerta AM',      descripcion: 'Silencio nocturno — retomar hoy' },
    { id: 'INCUBACION_BOT', label: '🤖 Incubación bot', descripcion: 'Sin respuesta > 4h tras alerta'  },
    { id: 'RESUCITADO',     label: '✨ Resucitados',    descripcion: 'Reactivados desde incubación'    },
    { id: 'POSPUESTO',      label: '⏸ Pospuestos',      descripcion: 'Alerta pospuesta 1h'             },
];

export default function Kanban({ columnas, agente, onRefrescar }) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[70vh]">
            {COLUMNAS_CONFIG.map(col => {
                const leadsRaw = columnas[col.id] ?? [];
                const leads = col.id === 'ALERTA_3H'
                    ? [...leadsRaw].sort((a, b) => (b.cantidad_interacciones > 1 ? 1 : 0) - (a.cantidad_interacciones > 1 ? 1 : 0))
                    : leadsRaw;

                return (
                    <div
                        key={col.id}
                        className="flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-2xl border border-gray-200"
                    >
                        <div className="px-3 pt-3 pb-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-gray-800">{col.label}</h3>
                                <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {leads.length}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{col.descripcion}</p>
                        </div>

                        <div className="flex flex-col gap-2 px-2 pb-3 flex-1 overflow-y-auto">
                            {leads.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-xs text-gray-300 italic">Sin leads</p>
                                </div>
                            ) : (
                                leads.map(lead => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        agente={agente}
                                        onRefrescar={onRefrescar}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
