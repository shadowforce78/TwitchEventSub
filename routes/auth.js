const express = require('express');
const axios = require('axios');

const router = express.Router();

// Twitch OAuth configuration from environment
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const { getRedirectUri } = require('../utils/config');
const REDIRECT_URI = getRedirectUri();

// GET /auth/twitch -> Redirect to Twitch OAuth
router.get('/twitch', (req, res) => {
    // Allow overriding scope via query (?scope=space+delimited)
    const scope = req.query.scope || 'user:read:email';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&force_verify=true`;
    res.redirect(url);
});

// GET /auth/twitch/callback -> OAuth callback
router.get('/twitch/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');

    try {
        // Exchange code for token
        const tokenResp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
            },
        });

    const accessToken = tokenResp.data.access_token;
    const refreshToken = tokenResp.data.refresh_token;

        // Fetch user info
        const userResp = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Client-Id': CLIENT_ID,
            },
        });

    // Store in session
    req.session.user = userResp.data.data[0];
    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;

    // Ensure session is persisted before redirecting to intended page
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    req.session.save(() => res.redirect(returnTo));
    } catch (err) {
        console.error(err);
        return res.redirect('/?auth_error=1');
    }
});

module.exports = router;
