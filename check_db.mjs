import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1].replace(/["'\r]/g, '');
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1].replace(/["'\r]/g, '');

const supabase = createClient(url, key);

async function main() {
    const dealerId = 'ddf171c7-47fe-4c84-8662-b023140ae3c4';

    console.log("Checking dealer_profiles...");
    let { data: profile, error: err1 } = await supabase
        .from('dealer_profiles')
        .select('city_id, dealership_name, cities(name, state)')
        .eq('id', dealerId);
    console.log(profile, err1);

    console.log("\nChecking profiles...");
    let { data: prof2, error: err2 } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', dealerId);
    console.log(prof2, err2);

    console.log("\nChecking dealer_accounts...");
    let { data: acc, error: err3 } = await supabase
        .from('dealer_accounts')
        .select('city_id, dealership_name, state, cities:city_id(name, state)')
        .eq('id', dealerId);
    console.log(acc, err3);
}

main().catch(console.error);
