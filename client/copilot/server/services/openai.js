import OpenAI from 'openai';
import fs     from 'fs';
import path   from 'path';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribir(filePath) {
    const stream = fs.createReadStream(filePath);
    const resp   = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file:  stream,
        language: 'es',
    });
    return resp.text;
}

export async function generarCopilot(nombreLead, historial) {
    const transcripcion = historial
        .map(m => `${m.rol === 'user' ? nombreLead : 'Agente'}: ${m.contenido}`)
        .join('\n');

    const systemPrompt = `Eres un copiloto de ventas experto en clínicas estéticas.
Se te da el historial de conversación con un lead. Devuelve EXACTAMENTE este JSON y nada más:
{
  "resumen": "<2 líneas: cuál es el interés o la objeción principal>",
  "guion": "<mensaje corto, persuasivo y en tono cercano, listo para que el agente lo envíe>"
}`;

    const resp = await openai.chat.completions.create({
        model:       'gpt-4o',
        temperature: 0.4,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Lead: ${nombreLead}\n\n${transcripcion}` },
        ],
    });

    const raw = resp.choices[0].message.content.trim();
    try {
        return JSON.parse(raw.replace(/```json|```/g, ''));
    } catch {
        return { resumen: raw, guion: '' };
    }
}
