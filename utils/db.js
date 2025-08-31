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

async function insertUserRedemption({ user_name, user_id }) {
  // Insert into `user` table: columns user (varchar), id_twitch (int), date (date)
  const pool = getPool();
  const sql = 'INSERT INTO `user` (user, id_twitch, date) VALUES (?, ?, CURDATE())';
  await pool.execute(sql, [user_name, user_id]);
}

module.exports = {
  getPool,
  insertUserRedemption,
};
