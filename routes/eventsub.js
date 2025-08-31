const express = require('express');
const axios = require('axios');
const { getEventSubSecret, getEventSubCallbackUrl } = require('../utils/config');

const router = express.Router();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let _appToken;
let _appTokenExpiresAt = 0;

async function getAppAccessToken() {
    const now = Date.now();
    if (_appToken && now < _appTokenExpiresAt - 60_000) {
        return _appToken;
    }
    const resp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
        },
    });
    _appToken = resp.data.access_token;
    const expiresInMs = (resp.data.expires_in || 3600) * 1000;
    _appTokenExpiresAt = now + expiresInMs;
    return _appToken;
}

// Create a subscription for channel points redemption add events
router.post('/eventsub/subscribe', express.urlencoded({ extended: true }), async (req, res) => {
    const broadcaster_user_id = req.body.broadcaster_id || req.body.broadcaster_user_id;
    if (!broadcaster_user_id) return res.status(400).json({ error: 'Missing broadcaster_id' });

    try {
        const callback = getEventSubCallbackUrl();
        const secret = getEventSubSecret();
    const appToken = await getAppAccessToken();

        const resp = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
            type: 'channel.channel_points_custom_reward_redemption.add',
            version: '1',
            condition: { broadcaster_user_id },
            transport: {
                method: 'webhook',
                callback,
                secret,
            },
        }, {
            headers: {
        Authorization: `Bearer ${appToken}`,
                'Client-Id': CLIENT_ID,
                'Content-Type': 'application/json',
            },
        });

        res.json(resp.data);
    } catch (err) {
        console.error('EventSub subscribe error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to create subscription', details: err.response?.data || err.message });
    }
});

module.exports = router;
