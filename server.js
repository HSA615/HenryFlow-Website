require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'HSA615/InvenHelper';

// Supabase configuration
const SUPABASE_URL = 'https://ckvwqztiyznipaoducii.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdndxenRpeXpuaXBhb2R1Y2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2MDY5NCwiZXhwIjoyMDk5MzM2Njk0fQ.YYdXjMH7Mn1NpRpj-d9iG5lxXCmpQ_RlChCFdlvK21c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

if (!GITHUB_TOKEN) {
    console.warn('Warning: GITHUB_TOKEN is not set. GitHub API requests will fail.');
}

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// User signup endpoint
app.post('/api/signup', async (req, res) => {
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
});

// User login endpoint
app.post('/api/login', async (req, res) => {
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
});

app.get('/api/github-pushes', async (req, res) => {
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ message: 'Server is not configured with GITHUB_TOKEN.' });
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?sha=main&per_page=5`, {
            headers: {
                'User-Agent': 'HenryFlow-App',
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ message: 'GitHub API error', status: response.status, detail: text });
        }

        const commits = await response.json();
        const formattedCommits = commits.map(commit => ({
            message: commit.commit?.message || 'No commit message',
            sha: commit.sha,
            author: commit.commit?.author?.name || commit.author?.login || 'Unknown',
            date: commit.commit?.author?.date || commit.commit?.committer?.date || '',
            url: commit.html_url
        }));

        const pushEvents = [{
            actor: 'HSA615',
            branch: 'main',
            commitCount: formattedCommits.length,
            commits: formattedCommits,
            pushedAt: formattedCommits[0]?.date || new Date().toISOString()
        }];

        res.json({ repo: GITHUB_REPO, pushEvents });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`HenryFlow server running at http://localhost:${PORT}`);
});
