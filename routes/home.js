const express = require('express');

const router = express.Router();

const { getRedirectUri, getPublicBaseUrl } = require('../utils/config');
const REDIRECT_URI = getRedirectUri();
const PUBLIC_BASE = getPublicBaseUrl();

// GET /
router.get('/', (req, res) => {
    const authBlock = req.session.user
        ? `<p>Connecté : <strong>${req.session.user.display_name}</strong></p>`
        : `<a class="btn" href="/auth/twitch">Se connecter avec Twitch</a>`;

    res.type('html').send(`<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TwitchBail</title>
    <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,\"Helvetica Neue\",Arial,sans-serif;margin:0;padding:2rem;background:#0f1222;color:#e8e8f2;}
        .wrap{max-width:720px;margin:0 auto}
    h1{font-size:1.4rem;margin:0 0 1rem}
    h2{font-size:1.1rem;margin:1rem 0}
        .card{background:#1a1f3a;border:1px solid #2a2f55;border-radius:12px;padding:1.25rem}
        .btn{display:inline-block;background:#9146FF;color:#fff;text-decoration:none;padding:.7rem 1rem;border-radius:8px;font-weight:600}
        .muted{color:#b8b8d9}
    .grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
    .row{display:flex;gap:.5rem;align-items:center}
    input{background:#0f1222;border:1px solid #2a2f55;border-radius:8px;color:#e8e8f2;padding:.6rem .7rem}
    </style>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'"> 
    <!-- Note: if extensions inject scripts, you may see console warnings unrelated to this app. -->
    </head>
<body>
    <div class="wrap">
        <h1>TwitchBail</h1>
        <div class="grid">
            <div class="card">
                <h2>Authentification</h2>
                ${authBlock}
                <p class="muted">Callback configuré : <code>${REDIRECT_URI}</code></p>
            </div>
            <div class="card">
                <h2>Endpoints</h2>
                <ul>
                    <li><a href="/">GET /</a> — Accueil</li>
                    <li><a href="/auth/twitch">GET /auth/twitch</a> — Démarrer l'OAuth</li>
                    <li><a href="/healthz">GET /healthz</a> — Healthcheck</li>
                    <li>GET /streamer/:login — Informations utilisateur Twitch</li>
                </ul>
                <form class="row" method="get" action="/streamer">
                    <label for="login">Tester /streamer/:login</label>
                    <div class="row">
                        <input type="text" id="login" name="login" placeholder="twitchdev" required />
                        <button class="btn" type="submit">Rechercher</button>
                    </div>
                </form>
            </div>
            <div class="card">
                <h2>Récompenses (Channel Points)</h2>
                <p class="muted">Nécessite le scope <code>channel:read:redemptions</code>. <a href="/auth/twitch?scope=user:read:email channel:read:redemptions">Se connecter avec le scope requis</a></p>
                <form class="row" method="get" action="/rewards">
                    <label for="broadcaster_id">Tester /rewards</label>
                    <div class="row">
                        <input type="text" id="broadcaster_id" name="broadcaster_id" placeholder="ID du broadcaster" required />
                        <button class="btn" type="submit">Lister</button>
                    </div>
                </form>
                <p class="muted">Astuce: récupérez l'ID via <code>/streamer?login=nom</code> (champ <code>id</code> dans la réponse).</p>
            </div>
            <div class="card">
                <h2>EventSub Webhook</h2>
                <p>Callback: <code>${PUBLIC_BASE}/eventsub/webhook</code></p>
                <ul>
                    <li>Expose local via ngrok et configure la Transport Callback URL dans Twitch Dev Console.</li>
                    <li>Secret utilisé: <code>SESSION_SECRET</code> (peut être changé au besoin).</li>
                    <li>Type de contenu attendu: <code>application/json</code> avec signature HMAC vérifiée.</li>
                </ul>
                <form method="post" action="/eventsub/subscribe" class="row">
                    <label for="es_broadcaster_id">Créer subscription EventSub (redemptions)</label>
                    <div class="row">
                        <input type="text" id="es_broadcaster_id" name="broadcaster_id" placeholder="ID du broadcaster" required />
                        <button class="btn" type="submit">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </body>
</html>`);
});

module.exports = router;
