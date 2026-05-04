import { useState, useEffect } from 'react';
import { Users, BarChart2, RefreshCw, Loader2 } from 'lucide-react';
import { useLeads }      from '../hooks/useLeads.js';
import { setAgente, getStatsAgentes } from '../api/client.js';
import Kanban from '../components/Kanban.jsx';

const AGENTES = ['JC', 'Mari', 'Loreto'];

function VistaAdmin() {
    const hoy         = new Date().toISOString().slice(0, 10);
    const [fecha,     setFecha]   = useState(hoy);
    const [stats,     setStats]   = useState([]);
    const [cargando,  setCargando] = useState(false);

    async function cargar() {
        setCargando(true);
        try {
            const data = await getStatsAgentes(fecha);
            setStats(data);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => { cargar(); }, [fecha]);

    const agentes = [...new Set(stats.map(r => r.agente))];
    const tipos   = [...new Set(stats.map(r => r.tipo))];
    const tabla   = agentes.reduce((acc, a) => {
        acc[a] = tipos.reduce((t, tipo) => {
            const row = stats.find(r => r.agente === a && r.tipo === tipo);
            t[tipo]   = row ? Number(row.total) : 0;
            return t;
        }, {});
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 size={16}/> Rendimiento por agente
                </h2>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                    />
                    <button onClick={cargar} className="text-gray-400 hover:text-gray-600">
                        {cargando ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                    </button>
                </div>
            </div>

            {stats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin acciones registradas para esta fecha.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Agente</th>
                                {tipos.map(t => (
                                    <th key={t} className="text-center py-2 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                                        {t.replace(/_/g, ' ')}
                                    </th>
                                ))}
                                <th className="text-center py-2 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agentes.map(a => {
                                const fila  = tabla[a];
                                const total = Object.values(fila).reduce((s, v) => s + v, 0);
                                return (
                                    <tr key={a} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2.5 pr-4 font-medium text-gray-800">{a}</td>
                                        {tipos.map(t => (
                                            <td key={t} className="py-2.5 px-3 text-center text-gray-600">
                                                {fila[t] || '—'}
                                            </td>
                                        ))}
                                        <td className="py-2.5 px-3 text-center font-semibold text-indigo-600">{total}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const [agente,     setAgenteLocal] = useState('');
    const [vistaAdmin, setVistaAdmin]  = useState(false);
    const { columnas, cargando, error, refrescar } = useLeads(15000);

    function seleccionarAgente(a) {
        if (agente === a) { setAgenteLocal(''); return; }
        setAgenteLocal(a);
    }

    const totalAlertas = (columnas.ALERTA_3H?.length ?? 0) + (columnas.ALERTA_AM?.length ?? 0);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600 text-base tracking-tight">Body Elite</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500 font-medium">Copilot</span>
                </div>

                {totalAlertas > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full animate-pulse">
                        ⚡ {totalAlertas} alertas activas
                    </span>
                )}

                <div className="flex-1"/>

                <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400"/>
                    <span className="text-xs text-gray-500 font-medium">Agente:</span>
                    {AGENTES.map(a => (
                        <button
                            key={a}
                            onClick={() => seleccionarAgente(a)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                                agente === a
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                            }`}
                        >
                            {a}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setVistaAdmin(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        vistaAdmin
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                >
                    <BarChart2 size={13}/> Admin
                </button>

                <button
                    onClick={refrescar}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Refrescar"
                >
                    {cargando ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                </button>
            </header>

            {!agente && (
                <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center">
                    <p className="text-xs text-amber-700 font-medium">
                        ⚠️ Selecciona tu nombre como agente antes de ejecutar acciones
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-b border-red-200 px-5 py-2 text-center">
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}

            <main className="p-5 space-y-5">
                {vistaAdmin && <VistaAdmin/>}

                {cargando && !Object.values(columnas).flat().length ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-indigo-400"/>
                    </div>
                ) : (
                    <Kanban
                        columnas={columnas}
                        agente={agente}
                        onRefrescar={refrescar}
                    />
                )}
            </main>
        </div>
    );
}
