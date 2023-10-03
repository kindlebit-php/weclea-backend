import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;

const dbConnect = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  multipleStatements: true,
  dateStrings: true,
});

// Connect to the database
dbConnect.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    throw err; // Terminate the application or handle the error as needed
  }
  console.log('Connected to the database');
});

// Handle unexpected errors
dbConnect.on('error', (err) => {
  console.error('Database Error:', err);
});

export default dbConnect;
