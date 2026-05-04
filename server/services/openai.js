import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribir(filePath) {
    const stream = fs.createReadStream(filePath);
    const resp = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: stream,
        language: 'es',
    });
    return resp.text;
}

export async function generarCopilot(nombreLead, historial) {
    // Simulamos respuesta rápida para que no se caiga el sistema
    return { resumen: "Lead interesado.", guion: "¡Hola! ¿Cómo podemos ayudarte?" };
}
