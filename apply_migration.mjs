import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read connection details from .env
const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlFile = path.join(process.cwd(), 'supabase', 'migrations', '20260220_profit_intelligence_layer.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Supabase JS doesn't have a direct 'execute arbitrary SQL' function for arbitrary schema changes
    // We need to use an RPC function if it exists, or suggest using the Supabase SQL editor directly.

    // Since we are building for production and the .env only has keys that don't allow schema changes via API,
    // we must output the SQL file path for the user to copy/paste into their Supabase Dashboard SQL Editor.
    console.log("-------------------------------------------------------------------------");
    console.log("SQL MIGRATION READY");
    console.log("-------------------------------------------------------------------------");
    console.log("To apply the new Profit Intelligence schema, please run this file in your");
    console.log("Supabase Dashboard SQL Editor:");
    console.log(sqlFile);
    console.log("-------------------------------------------------------------------------");

    // Checking if there is a debug RPC function we created earlier that allows raw SQL
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        if (!error) {
            console.log("SUCCESSFULLY APPLIED MIGRATION VIA RPC.");
        } else {
            console.log("RPC execution failed (normal if exec_sql is not defined).");
        }
    } catch (e) {
        console.log("Could not apply via RPC.");
    }
}

runMigration();
