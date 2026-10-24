const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auspify_student_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Input Validation Helper
function validateStudentPayload(data) {
  const errors = [];
  const { roll_number, full_name, email, phone, department, semester, cgpa, status } = data;

  if (!roll_number || String(roll_number).trim().length < 3) {
    errors.push('Roll Number is required (minimum 3 characters).');
  }
  if (!full_name || String(full_name).trim().length < 2) {
    errors.push('Full Name is required (minimum 2 characters).');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.push('A valid Email Address is required.');
  }
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone || !phoneRegex.test(String(phone).trim())) {
    errors.push('Phone number must contain 10 to 15 digits.');
  }
  if (!department || String(department).trim().length === 0) {
    errors.push('Department is required.');
  }
  const semNum = Number(semester);
  if (!Number.isInteger(semNum) || semNum < 1 || semNum > 8) {
    errors.push('Semester must be an integer between 1 and 8.');
  }
  const cgpaNum = Number(cgpa);
  if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
    errors.push('CGPA must be a number between 0.00 and 10.00.');
  }
  const validStatuses = ['Active', 'Inactive', 'Graduated'];
  if (status && !validStatuses.includes(status)) {
    errors.push('Status must be Active, Inactive, or Graduated.');
  }

  return errors;
}

// 1. Health Check Route
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Server and Database are connected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed.', error: error.message });
  }
});

// 2. GET All Students (with optional search and department filter)
app.get('/api/students', async (req, res) => {
  try {
    const { search = '', department = '' } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search.trim()) {
      query += ' AND (full_name LIKE ? OR roll_number LIKE ? OR email LIKE ?)';
      const wildcard = `%${search.trim()}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (department.trim()) {
      query += ' AND department = ?';
      params.push(department.trim());
    }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student records.' });
  }
});

// 3. GET Single Student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching single student:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching student.' });
  }
});

// 4. POST Create New Student
app.post('/api/students', async (req, res) => {
  try {
    const validationErrors = validateStudentPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }

    const { roll_number, full_name, email, phone, department, semester, cgpa, status = 'Active' } = req.body;

    const [result] = await pool.query(
      `INSERT INTO students (roll_number, full_name, email, phone, department, semester, cgpa, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roll_number.trim().toUpperCase(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department.trim(),
        Number(semester),
        Number(cgpa),
        status
      ]
    );

    const [createdStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      data: createdStudent[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A student with this Roll Number or Email already exists.'
      });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Failed to create student record.' });
  }
});

// 5. PUT Update Existing Student
app.put('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const validationErrors = validateStudentPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }

    const { roll_number, full_name, email, phone, department, semester, cgpa, status } = req.body;

    await pool.query(
      `UPDATE students
       SET roll_number = ?, full_name = ?, email = ?, phone = ?, department = ?, semester = ?, cgpa = ?, status = ?
       WHERE id = ?`,
      [
        roll_number.trim().toUpperCase(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department.trim(),
        Number(semester),
        Number(cgpa),
        status || 'Active',
        studentId
      ]
    );

    const [updatedStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    res.json({
      success: true,
      message: 'Student record updated successfully.',
      data: updatedStudent[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Another student already uses this Roll Number or Email.'
      });
    }
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student record.' });
  }
});

// 6. DELETE Student Record
app.delete('/api/students/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }
    res.json({ success: true, message: 'Student record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student record.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});