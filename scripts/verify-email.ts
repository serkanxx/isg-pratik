import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data, error } = await supabase
        .from('User')
        .update({ emailVerified: new Date().toISOString() })
        .eq('email', 'serkanxx@gmail.com')
        .select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Email verified for serkanxx@gmail.com');
    console.log('Result:', data);
}

main();
