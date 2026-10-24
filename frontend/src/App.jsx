import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/students';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

const INITIAL_FORM = {
  roll_number: '',
  full_name: '',
  email: '',
  phone: '',
  department: 'Computer Science & Engineering',
  semester: 1,
  cgpa: '',
  status: 'Active'
};

export default function App() {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setStudents(result.data);
      } else {
        showFeedback('error', result.message || 'Failed to load students.');
      }
    } catch (err) {
      showFeedback('error', 'Cannot connect to backend server on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, departmentFilter]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          semester: Number(formData.semester),
          cgpa: Number(formData.cgpa)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showFeedback('error', result.message || 'Operation failed.');
        return;
      }

      showFeedback('success', result.message);
      resetForm();
      fetchStudents();
    } catch (error) {
      showFeedback('error', 'Network error while saving student record.');
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      roll_number: student.roll_number,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      department: student.department,
      semester: student.semester,
      cgpa: student.cgpa,
      status: student.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the record for "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        showFeedback('success', result.message);
        if (selectedStudent?.id === id) setSelectedStudent(null);
        fetchStudents();
      } else {
        showFeedback('error', result.message || 'Delete failed.');
      }
    } catch (error) {
      showFeedback('error', 'Error communicating with server.');
    }
  };

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === 'Active').length;
  const avgCgpa =
    totalStudents > 0
      ? (students.reduce((sum, s) => sum + Number(s.cgpa), 0) / totalStudents).toFixed(2)
      : '0.00';

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Student Management System</h1>
          <p>Create, view, update, and manage academic student records efficiently.</p>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total Students</span>
            <strong className="stat-value">{totalStudents}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Enrolled</span>
            <strong className="stat-value">{activeCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average CGPA</span>
            <strong className="stat-value">{avgCgpa}</strong>
          </div>
        </div>
      </header>

      {feedback.message && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="alert-close">
            ×
          </button>
        </div>
      )}

      <main className="main-grid">
        <section className="card form-section">
          <h2>{editingId ? 'Update Student Record' : 'Add New Student'}</h2>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label htmlFor="roll_number">Roll Number *</label>
              <input
                id="roll_number"
                name="roll_number"
                type="text"
                placeholder="e.g., CSE2025005"
                value={formData.roll_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="e.g., Vikram Aditya"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="student@example.edu"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (10–15 digits) *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                pattern="[0-9]{10,15}"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="semester">Semester (1–8) *</label>
                <input
                  id="semester"
                  name="semester"
                  type="number"
                  min="1"
                  max="8"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cgpa">CGPA (0–10) *</label>
                <input
                  id="cgpa"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="8.50"
                  value={formData.cgpa}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Enrollment Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Add Student'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card table-section">
          <div className="table-header-bar">
            <h2>Student Directory</h2>
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search by name, roll no, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">Loading student records...</p>
          ) : students.length === 0 ? (
            <p className="empty-state">No student records found matching your criteria.</p>
          ) : (
            <div className="table-responsive">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Sem</th>
                    <th>CGPA</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="mono">{student.roll_number}</td>
                      <td>
                        <strong>{student.full_name}</strong>
                        <div className="sub-text">{student.email}</div>
                      </td>
                      <td>{student.department}</td>
                      <td>Sem {student.semester}</td>
                      <td>
                        <span className="cgpa-pill">{Number(student.cgpa).toFixed(2)}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${student.status.toLowerCase()}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="btn-sm btn-view"
                        >
                          View
                        </button>
                        <button onClick={() => handleEdit(student)} className="btn-sm btn-edit">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.full_name)}
                          className="btn-sm btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile Details</h3>
              <button onClick={() => setSelectedStudent(null)} className="modal-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span>Roll Number:</span>
                <strong>{selectedStudent.roll_number}</strong>
              </div>
              <div className="detail-row">
                <span>Full Name:</span>
                <strong>{selectedStudent.full_name}</strong>
              </div>
              <div className="detail-row">
                <span>Email Address:</span>
                <strong>{selectedStudent.email}</strong>
              </div>
              <div className="detail-row">
                <span>Phone Number:</span>
                <strong>{selectedStudent.phone}</strong>
              </div>
              <div className="detail-row">
                <span>Department:</span>
                <strong>{selectedStudent.department}</strong>
              </div>
              <div className="detail-row">
                <span>Current Semester:</span>
                <strong>Semester {selectedStudent.semester}</strong>
              </div>
              <div className="detail-row">
                <span>CGPA:</span>
                <strong>{Number(selectedStudent.cgpa).toFixed(2)} / 10.00</strong>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <strong>{selectedStudent.status}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  handleEdit(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="btn btn-primary"
              >
                Edit This Record
              </button>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}