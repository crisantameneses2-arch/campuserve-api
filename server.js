const express = require("express");
const cors = require("cors");
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('./cloudinary');
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("CampuServe Backend is running!");
});

app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM test_ping');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE institutional_email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Account not found' });
    }

    const user = users[0];

    if (user.is_first_login) {
      return res.status(200).json({
        firstLogin: true,
        message: 'No password set. Please create one.',
        email: user.institutional_email
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.institutional_email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      fullName: user.full_name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/set-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hash = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.query(
      'UPDATE users SET password_hash = ?, is_first_login = FALSE WHERE institutional_email = ?',
      [hash, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Password set successfully. You can now log in.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

app.post('/api/alumni/verify-upload', upload.single('document'), async (req, res) => {
  const { accountId, studentId, fullName } = req.body;

  try {
    const [matches] = await pool.query(
      'SELECT * FROM alumni_records WHERE student_id = ? AND full_name = ?',
      [studentId, fullName]
    );

    let status = matches.length > 0 ? 'auto_verified' : 'pending';
    let documentUrl = null;

    if (status === 'pending') {
      if (!req.file) {
        return res.status(400).json({ error: 'No matching record found. Please upload a supporting document.' });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'alumni_verifications' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      documentUrl = result.secure_url;
    }

    await pool.query(
      `INSERT INTO alumni_verifications (account_id, student_id, full_name, document_url, status)
       VALUES (?, ?, ?, ?, ?)`,
      [accountId, studentId, fullName, documentUrl, status]
    );

    res.json({
      message: status === 'auto_verified' 
        ? 'Verified automatically! You can log in now.' 
        : 'Submitted for manual review.',
      status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.get('/api/alumni/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM alumni_verifications WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
});

app.post('/api/alumni/review/:id', async (req, res) => {
  const { id } = req.params;
  const { decision, staffId } = req.body;

  try {
    await pool.query(
      `UPDATE alumni_verifications 
       SET status = ?, reviewed_by_staff_id = ?, reviewed_at = NOW() 
       WHERE verification_id = ?`,
      [decision, staffId, id]
    );
    res.json({ message: `Verification ${decision}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});