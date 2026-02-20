import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="(.*)"/)?.[1];
const key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)?.[1];

const dealerId = 'ddf171c7-47fe-4c84-8662-b023140ae3c4';

async function check() {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    const r1 = await fetch(`${url}/rest/v1/dealer_profiles?id=eq.${dealerId}&select=city_id,dealership_name`, { headers });
    console.log("dealer_profiles:", await r1.json());

    const r2 = await fetch(`${url}/rest/v1/dealer_accounts?id=eq.${dealerId}&select=city_id,dealership_name`, { headers });
    console.log("dealer_accounts:", await r2.json());
}

check().catch(console.error);
