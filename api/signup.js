const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ckvwqztiyznipaoducii.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdndxenRpeXpuaXBhb2R1Y2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2MDY5NCwiZXhwIjoyMDk5MzM2Njk0fQ.YYdXjMH7Mn1NpRpj-d9iG5lxXCmpQ_RlChCFdlvK21c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fullname, email, password, confirmPassword, marketingOptIn } = req.body;

        if (!fullname || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if email already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Check user error:', checkError);
            return res.status(400).json({ error: 'Database error: ' + checkError.message });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Insert new user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email,
                fullname,
                password,
                marketing_opt_in: marketingOptIn === 'on' || marketingOptIn === true
            }])
            .select();

        if (error) {
            console.error('Signup insert error:', error);
            return res.status(400).json({ error: 'Database error: ' + error.message });
        }

        res.json({ success: true, message: 'Account created successfully. You can now sign in.', email });
    } catch (error) {
        console.error('Signup catch error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
