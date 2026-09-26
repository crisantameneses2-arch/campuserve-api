const pool = require('./db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Connected! Test query result:', rows[0].result);
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
})();