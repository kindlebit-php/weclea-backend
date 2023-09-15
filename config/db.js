import mysql from 'mysql'; // Import from 'mysql2/promise'

import dotenv from "dotenv";
dotenv.config();
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;

const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  multipleStatements: true,
  dateStrings: true,
});

try {
  connection.connect();
  console.log('Database Connection Established Successfully');
} catch (error) {
  console.error('Database Connection Failed!', error);
}

// Handle unexpected errors
connection.on('error', (err) => {
  console.error('Database Error:', err);
});

export default connection;