import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { sendAudio, transcribeAudio } from '../api/client.js';

export default function AudioRecorder({ lead, agente, onTranscripcion, onEnviado }) {
    const [estado,      setEstado]      = useState('idle');
    const [segundos,    setSegundos]    = useState(0);
    const [error,       setError]       = useState('');
    const [blobLocal,   setBlobLocal]   = useState(null);

    const mediaRef    = useRef(null);
    const chunksRef   = useRef([]);
    const timerRef    = useRef(null);

    useEffect(() => () => {
        clearInterval(timerRef.current);
        mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
    }, []);

    async function iniciarGrabacion() {
        setError('');
        setBlobLocal(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr     = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            chunksRef.current = [];
            mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
                setBlobLocal(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mr.start(200);
            mediaRef.current = mr;
            setSegundos(0);
            timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
            setEstado('grabando');
        } catch {
            setError('Permiso de micrófono denegado');
        }
    }

    function detenerGrabacion() {
        clearInterval(timerRef.current);
        mediaRef.current?.stop();
        setEstado('idle');
    }

    async function enviarNota() {
        if (!blobLocal) return;
        if (!agente) { setError('Selecciona un agente primero'); return; }
        setEstado('procesando');
        try {
            await sendAudio(blobLocal, lead.telefono, lead.id, agente);
            setBlobLocal(null);
            onEnviado?.();
        } catch (e) {
            setError('Error al enviar: ' + e.message);
        } finally {
            setEstado('idle');
        }
    }

    async function transcribir() {
        if (!blobLocal) return;
        setEstado('procesando');
        try {
            const { texto } = await transcribeAudio(blobLocal);
            onTranscripcion?.(texto);
        } catch (e) {
            setError('Error al transcribir: ' + e.message);
        } finally {
            setEstado('idle');
        }
    }

    const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {estado === 'idle' && !blobLocal && (
                    <button
                        onClick={iniciarGrabacion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Mic size={14}/> Grabar nota
                    </button>
                )}

                {estado === 'grabando' && (
                    <button
                        onClick={detenerGrabacion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg animate-pulse"
                    >
                        <Square size={14}/> {fmt(segundos)}
                    </button>
                )}

                {estado === 'procesando' && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Loader2 size={13} className="animate-spin"/> Procesando…
                    </span>
                )}

                {blobLocal && estado === 'idle' && (
                    <>
                        <audio controls src={URL.createObjectURL(blobLocal)} className="h-8 flex-1"/>
                        <button
                            onClick={enviarNota}
                            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg"
                        >
                            <Send size={13}/> Enviar
                        </button>
                        <button
                            onClick={transcribir}
                            className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                        >
                            Transcribir
                        </button>
                        <button
                            onClick={() => setBlobLocal(null)}
                            className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg"
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
