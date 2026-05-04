import { upsertLead, pool } from './db.js';

async function fix() {
    const telefonoExacto = '+56983302067'; // Con el + como está en tu pantalla
    console.log(`🚀 Forzando reseteo para ${telefonoExacto}...`);
    
    // Al pasarle 'INTERESADO', el db.js lo mapea a 'NUEVO' 
    // Y al estar en 'INCUBACION_BOT', el CASE lo devuelve a 'NUEVO'
    const id = await upsertLead(
        telefonoExacto, 
        'JC (PRUEBA REAL)', 
        'INTERESADO', 
        'CORPORAL'
    );
    
    if (id) {
        console.log('✅ ¡Éxito! El lead fue detectado, actualizado a CORPORAL y reseteado a NUEVO.');
        console.log('👀 Ahora refresca tu navegador. Debería desaparecer de Incubación.');
    } else {
        console.log('❌ No se pudo actualizar.');
    }
    process.exit(0);
}
fix();
