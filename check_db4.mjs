import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="(.*)"/)?.[1];
const key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)?.[1];

async function check() {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    const r = await fetch(`${url}/rest/v1/cities?name=eq.Chennai`, { headers });
    console.log("all chennais:", await r.json());
}

check().catch(console.error);
