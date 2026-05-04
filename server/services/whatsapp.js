import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function subirAudio(filePath) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'audio/ogg; codecs=opus');
    const resp = await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/media`, form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${TOKEN}` }
    });
    return resp.data.id;
}

export async function enviarAudio(telefono, mediaId) {
    await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'audio',
        audio: { id: mediaId }
    }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}

export async function enviarTexto(telefono, texto) {
    await axios.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: { body: texto }
    }, { headers: { Authorization: `Bearer ${TOKEN}` } });
}
