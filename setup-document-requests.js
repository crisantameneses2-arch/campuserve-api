const pool = require('./db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        number_of_copies INT NOT NULL DEFAULT 1,
        purpose VARCHAR(255) DEFAULT NULL,
        requested_date DATE NOT NULL,
        requested_time VARCHAR(30) NOT NULL,
        status ENUM('pending', 'processing', 'ready_to_pick_up', 'cancelled', 'completed') DEFAULT 'pending',
        claim_code VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('document_requests table created (or already exists).');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
})();