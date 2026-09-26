const pool = require('./db');

(async () => {
  try {
    await pool.query(`
      INSERT INTO users (institutional_email, student_id, full_name, role)
      VALUES 
        ('24LN0888_ms@Psu.edu.ph', '24LN0888', 'Test Student', 'student'),
        ('admin_test@Psu.edu.ph', 'ADM0001', 'Test Admin', 'admin')
    `);
    console.log('Test accounts inserted.');
    process.exit(0);
  } catch (err) {
    console.error('Insert failed:', err.message);
    process.exit(1);
  }
})();