import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1].replace(/["'\r]/g, '');
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1].replace(/["'\r]/g, '');

fetch(`${url}/rest/v1/cities?select=*`, {
    headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
    }
})
    .then(res => res.json())
    .then(data => {
        console.log("Cities:", data.slice(0, 3));
        console.log("Type of city ID:", typeof data[0]?.id);
    })
    .catch(console.error);

fetch(`${url}/rest/v1/dealer_accounts?select=city_id,dealership_name&limit=3`, {
    headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
    }
})
    .then(res => res.json())
    .then(data => {
        console.log("Dealer Accounts:", data);
        console.log("Type of city_id:", typeof data[0]?.city_id);
    })
    .catch(console.error);
