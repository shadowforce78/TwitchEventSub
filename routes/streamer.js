const express = require('express');
const axios = require('axios');

const router = express.Router();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

// GET /streamer/:login - fetch user info by path param
router.get('/streamer/:login', async (req, res) => {
    const login = req.params.login;
    try {
        // Get app access token
        const tokenResp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials',
            },
        });

        const appAccessToken = tokenResp.data.access_token;

        // Fetch user information
        const userResp = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${appAccessToken}`,
                'Client-Id': CLIENT_ID,
            },
            params: { login },
        });

        const user = userResp.data.data?.[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Erreur /streamer/:login', err.response?.data || err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /streamer?login=foo - fetch user info by query for convenience
router.get('/streamer', async (req, res) => {
    const login = req.query.login;
    if (!login) return res.status(400).json({ error: 'Missing login query param' });
    try {
        const tokenResp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials',
            },
        });
        const appAccessToken = tokenResp.data.access_token;
        const userResp = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${appAccessToken}`,
                'Client-Id': CLIENT_ID,
            },
            params: { login },
        });
        const user = userResp.data.data?.[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Erreur /streamer?login', err.response?.data || err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

module.exports = router;
