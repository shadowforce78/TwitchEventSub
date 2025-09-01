const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

const { getEventSubSecret } = require('../utils/config');
const SECRET = getEventSubSecret();

// Simple GET handler for browser checks
router.get('/eventsub/webhook', (_req, res) => {
    res.type('text').send('Twitch EventSub webhook is up. Use POST with signature headers for real callbacks.');
});

// Webhook EventSub
// Use raw body to verify Twitch signatures
router.post('/eventsub/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const msgId = req.headers['twitch-eventsub-message-id'];
    const timestamp = req.headers['twitch-eventsub-message-timestamp'];
    const msgType = req.headers['twitch-eventsub-message-type'];
    const signature = req.headers['twitch-eventsub-message-signature'];
    const body = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');

    // Vérification HMAC
    const computedSig = 'sha256=' + crypto.createHmac('sha256', SECRET)
        .update(msgId + timestamp + body)
        .digest('hex');

    if (signature !== computedSig) {
        return res.status(403).send('Invalid signature');
    }

    // Parse JSON only after signature verification
    let payload;
    try {
        payload = JSON.parse(body || '{}');
    } catch (_e) {
        return res.status(400).send('Invalid JSON');
    }

    // Twitch vérifie le webhook
    if (msgType === 'webhook_callback_verification') {
        return res.status(200).send(payload.challenge);
    }

    // Notification EventSub
    if (msgType === 'notification') {
        const event = payload.event;

        // Vérifier si c'est bien la reward que tu veux
        if (event.reward && event.reward.id === '3c31d05e-6669-4d9d-8d08-b33b2ac5a41f') {
            console.log(`Nouvelle redemption !`);
            console.log(`User: ${event.user_name} (${event.user_id})`);
            console.log(`Reward: ${event.reward.title}`);
            console.log(`Cost: ${event.reward.cost} points`);

            try {
                const { upsertUserValidation, upsertUsernameMapping } = require('../utils/db');
                const id_twitch = Number(event.user_id);
                const username = event.user_name;
                upsertUserValidation({ id_twitch, valide: 1 })
                    .catch((e) => console.error('DB validation upsert error (async):', e.message));
                upsertUsernameMapping({ username, id_twitch })
                    .catch((e) => console.error('DB username upsert error (async):', e.message));
            } catch (e) {
                console.error('DB upsert error:', e.message);
            }
        }
    }

    res.status(200).end();
});

module.exports = router;
