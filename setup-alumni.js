const pool = require('./db');

(async () => {
  try {
    // Pre-loaded official alumni records (for auto-matching)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alumni_records (
        alumni_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        course VARCHAR(100),
        year_graduated INT
      )
    `);
    console.log('alumni_records table created (or already exists).');

    // Alumni accounts requesting access
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alumni_verifications (
        verification_id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        document_url VARCHAR(500) DEFAULT NULL,
        status ENUM('auto_verified', 'pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewed_by_staff_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL DEFAULT NULL
      )
    `);
    console.log('alumni_verifications table created (or already exists).');

    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
})();