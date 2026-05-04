import { upsertLead } from './db.js';

async function test() {
    console.log('🚀 Simulando entrada de mensaje para JC (PRUEBA REAL)...');
    
    // Simulamos que JC pregunta por la Lipo Express
    const id = await upsertLead(
        '56983302067', // Tu número de la captura
        'JC (PRUEBA REAL)', 
        'INTERESADO', 
        'CORPORAL'
    );
    
    if (id) {
        console.log('✅ Sistema: Lead reseteado y etiquetado como CORPORAL.');
        console.log('✅ El motor de reglas ya lo tiene en la mira.');
    }
    process.exit(0);
}
test();
