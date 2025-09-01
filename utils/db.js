const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
    const rejectUna = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      ssl: sslEnabled ? { rejectUnauthorized: rejectUna } : undefined,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

function getTableNames() {
  return {
    validationsTable: process.env.DB_TABLE_VALIDATIONS || 'user',
    usernamesTable: process.env.DB_TABLE_USERNAMES || 'usernames',
  };
}

async function upsertUserValidation({ id_twitch, valide = 1 }) {
  const { validationsTable } = getTableNames();
  const pool = getPool();
  // Requires UNIQUE/PRIMARY KEY on id_twitch for ON DUPLICATE to work best
  const sql = `INSERT INTO \`${validationsTable}\` (id_twitch, valide)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE valide = VALUES(valide)`;
  await pool.execute(sql, [id_twitch, valide]);
}

async function upsertUsernameMapping({ username, id_twitch }) {
  const { usernamesTable } = getTableNames();
  const pool = getPool();
  // If you have UNIQUE on id_twitch, this keeps latest username
  const sql = `INSERT INTO \`${usernamesTable}\` (username, id_twitch)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE username = VALUES(username)`;
  await pool.execute(sql, [username, id_twitch]);
}

module.exports = {
  getPool,
  upsertUserValidation,
  upsertUsernameMapping,
};
