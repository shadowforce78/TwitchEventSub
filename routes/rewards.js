const express = require('express');
const axios = require('axios');

const router = express.Router();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;

async function fetchRewards(accessToken, broadcaster_id) {
    const resp = await axios.get('https://api.twitch.tv/helix/channel_points/custom_rewards', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': CLIENT_ID,
        },
        params: { broadcaster_id },
    });
    return resp.data;
}

// GET /rewards?broadcaster_id=123 - list custom channel point rewards (requires user token with scope channel:read:redemptions)
router.get('/rewards', async (req, res) => {
    const broadcaster_id = req.query.broadcaster_id;
    if (!broadcaster_id) return res.status(400).json({ error: 'Missing broadcaster_id' });
    const accessToken = req.session?.accessToken;
    if (!accessToken) {
        return res.status(401).json({
            error: 'Not authenticated',
            hint: "Connectez-vous via /auth/twitch avec le scope 'channel:read:redemptions'",
            login_url: '/auth/twitch?scope=user:read:email channel:read:redemptions',
        });
    }
    try {
        const data = await fetchRewards(accessToken, broadcaster_id);
        res.json(data);
    } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data || err.message;
        console.error('Erreur /rewards', message);
        // If missing scope, send user to re-auth with the right scope
        if (status === 401) {
            // Remember where to return after auth
            if (req.session) {
                req.session.returnTo = req.originalUrl;
                return req.session.save(() =>
                    res.redirect('/auth/twitch?scope=user:read:email channel:read:redemptions')
                );
            }
            return res.redirect('/auth/twitch?scope=user:read:email channel:read:redemptions');
        }
        res.status(status || 500).json({ error: 'Failed to fetch rewards', details: message });
    }
});

// GET /rewards/:broadcasterId - path param variant
router.get('/rewards/:broadcasterId', async (req, res) => {
    const broadcaster_id = req.params.broadcasterId;
    const accessToken = req.session?.accessToken;
    if (!accessToken) {
        return res.status(401).json({
            error: 'Not authenticated',
            hint: "Connectez-vous via /auth/twitch avec le scope 'channel:read:redemptions'",
            login_url: '/auth/twitch?scope=user:read:email channel:read:redemptions',
        });
    } 
    try {
        const data = await fetchRewards(accessToken, broadcaster_id);
        res.json(data);
    } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data || err.message;
        console.error('Erreur /rewards/:broadcasterId', message);
        if (status === 401) {
            if (req.session) {
                req.session.returnTo = req.originalUrl;
                return req.session.save(() =>
                    res.redirect('/auth/twitch?scope=user:read:email channel:read:redemptions')
                );
            }
            return res.redirect('/auth/twitch?scope=user:read:email channel:read:redemptions');
        }
        res.status(status || 500).json({ error: 'Failed to fetch rewards', details: message });
    }
});

module.exports = router;
