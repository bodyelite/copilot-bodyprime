import { pool } from './db.js';

async function simular() {
    try {
        // Primero limpiamos para que no choque con datos viejos
        await pool.query('DELETE FROM leads WHERE telefono LIKE \'+569000%\'');
        
        // Insertamos casos claros para el Kanban
        await pool.query(`
            INSERT INTO leads (nombre, telefono, estado_dashboard, ultimo_mensaje_hora) 
            VALUES 
            ('Paciente Alerta 3H', '+56900000001', 'ALERTA_3H', NOW() - INTERVAL '4 hours'),
            ('Paciente Alerta AM', '+56900000002', 'ALERTA_AM', NOW() - INTERVAL '12 hours'),
            ('Paciente Incubación', '+56900000003', 'INCUBACION_BOT', NOW() - INTERVAL '24 hours')
        `);
        console.log('✅ 3 Pacientes inyectados con éxito');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}
simular();
