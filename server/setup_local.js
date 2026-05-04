import { pool } from './db.js';
import fs from 'fs';

async function setup() {
    try {
        await pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS interes_actual VARCHAR(50) DEFAULT 'NO_DEFINIDO'");
        console.log('✅ Base de datos lista: Columna interes_actual agregada.');

        const indexPath = '/Users/juancarloscontreras/copilot/server/index.js';
        let indexContent = fs.readFileSync(indexPath, 'utf-8');
        
        if (!indexContent.includes('iniciarCronCopilot')) {
            indexContent = `import { iniciarCronCopilot } from './cron_engine.js';\n` + indexContent;
            indexContent += `\niniciarCronCopilot();\n`;
            fs.writeFileSync(indexPath, indexContent);
            console.log('✅ index.js actualizado para arrancar el cron automáticamente.');
        }
    } catch (e) {
        console.error('❌ Error en el setup:', e.message);
    }
    process.exit(0);
}
setup();
