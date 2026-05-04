import { pool } from './db.js';

async function simularSeguros() {
    try {
        // Limpiamos la mesa
        await pool.query('DELETE FROM leads WHERE telefono LIKE \'+569%\'');
        
        // Inyectamos 7 días de historial seguro
        await pool.query(`
            INSERT INTO leads (nombre, telefono, estado_dashboard, ultimo_mensaje_hora) 
            VALUES 
            ('JC (PRUEBA REAL)', '+56983302067', 'ALERTA_3H', NOW() - INTERVAL '3 hours'),
            ('Marisol (Prueba)', '+56900000001', 'ALERTA_AM', NOW() - INTERVAL '14 hours'),
            ('Georgina (Prueba)', '+56900000002', 'INCUBACION_BOT', NOW() - INTERVAL '2 days'),
            ('Nino (Prueba)', '+56900000003', 'ALERTA_AM', NOW() - INTERVAL '16 hours'),
            ('Marcela (Prueba)', '+56900000004', 'INCUBACION_BOT', NOW() - INTERVAL '4 days'),
            ('Carmen (Prueba)', '+56900000005', 'INCUBACION_BOT', NOW() - INTERVAL '5 days'),
            ('Gladys (Prueba)', '+56900000006', 'POSPUESTO', NOW() - INTERVAL '1 hours'),
            ('Sandra (Prueba)', '+56900000007', 'RESUCITADO', NOW() - INTERVAL '30 minutes'),
            ('Pamela (Prueba)', '+56900000008', 'INCUBACION_BOT', NOW() - INTERVAL '6 days'),
            ('Ana Maria (Prueba)', '+56900000009', 'ALERTA_3H', NOW() - INTERVAL '4 hours')
        `);
        console.log('✅ Tablero de 7 días inyectado de forma SEGURA. Tu tarjeta está en Alerta 3H.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}
simularSeguros();
