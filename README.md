# Student Management System

A full-stack Student Management System built using React, Node.js, Express, and MySQL.

## Features
- Complete CRUD Operations (Add, View, Update, Delete students)
- Dynamic Search & Department Filtering
- Form validation and duplicate entry prevention
- Live statistics dashboard (Total Students, Active Enrolled, Average CGPA)
- Detailed Student Profile Modal view

## Tech Stack
- **Frontend:** React, Vite, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.0 (`mysql2`)

## Local Setup Instructions
1. Import `database/schema.sql` into MySQL Workbench.
2. In the `backend` directory:
   - Configure `.env` with your MySQL credentials.
   - Run `npm install` and `npm start`.
3. In the `frontend` directory:
   - Run `npm install` and `npm run dev`.
4. Open the displayed local server URL in your browser.
