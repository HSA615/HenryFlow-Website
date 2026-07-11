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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Query database for user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Login query error:', error);
            return res.status(400).json({ error: 'Database error: ' + error.message });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({
            success: true,
            message: 'Signed in successfully',
            user: {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                marketingOptIn: user.marketing_opt_in
            }
        });
    } catch (error) {
        console.error('Login catch error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
