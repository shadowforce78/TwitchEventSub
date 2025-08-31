const express = require('express');

const router = express.Router();

// GET /healthz
router.get('/healthz', (_req, res) => {
    res.json({ ok: true, up: true });
});

module.exports = router;
