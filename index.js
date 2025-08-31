require('dotenv').config();
const express = require('express');
const session = require('express-session');

const app = express();

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// Simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Mount routers
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/home'));
app.use('/', require('./routes/health'));
app.use('/', require('./routes/streamer'));
app.use('/', require('./routes/rewards'));
app.use('/', require('./routes/webhook'));
app.use('/', require('./routes/eventsub'));

const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
