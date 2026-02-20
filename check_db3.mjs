import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="(.*)"/)?.[1];
const key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)?.[1];

const cityId = '25513986-8fa2-43a6-86ac-1d9b69552f3d';

async function check() {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    const r = await fetch(`${url}/rest/v1/cities?id=eq.${cityId}`, { headers });
    console.log("city details:", await r.json());
}

check().catch(console.error);
