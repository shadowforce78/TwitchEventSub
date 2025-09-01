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
    usersTable: process.env.DB_TABLE_USER || 'user',
    passTable: process.env.DB_TABLE_PASS || 'pass',
  };
}

// Upsert into `user` (username, id_twitch) with UNIQUE on id_twitch
async function upsertUser({ username, id_twitch }) {
  const { usersTable } = getTableNames();
  const pool = getPool();
  const sql = `INSERT INTO \`${usersTable}\` (username, id_twitch)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE username = VALUES(username)`;
  await pool.execute(sql, [username, id_twitch]);
}

// Set valide=1 in `pass` for given id_twitch; update if exists, else insert
async function setPassValid({ id_twitch, valide = 1 }) {
  const { passTable } = getTableNames();
  const pool = getPool();
  const [res] = await pool.execute(
    `UPDATE \`${passTable}\` SET valide = ? WHERE id_twitch = ?`,
    [valide, id_twitch]
  );
  // @ts-ignore mysql2 returns ResultSetHeader
  if (!res || !res.affectedRows) {
    await pool.execute(
      `INSERT INTO \`${passTable}\` (id_twitch, valide) VALUES (?, ?)`,
      [id_twitch, valide]
    );
  }
}

module.exports = {
  getPool,
  upsertUser,
  setPassValid,
};
