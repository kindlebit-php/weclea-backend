import mysql from 'mysql2/promise'; // Import from 'mysql2/promise'

import dotenv from "dotenv";
dotenv.config();
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
<<<<<<< HEAD

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
=======
console.log('db_host', DB_HOST);

async function db_connect() {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      multipleStatements: true,
      dateStrings: true
    });
>>>>>>> 015a8c972e04958743fbd034e76ba661ca07068c

    console.log('Connection Established Successfully');

    // Return the connection for use in your application
    return connection;
  } catch (err) {
    console.error('Connection Failed!', err);
    throw err; // Rethrow the error to handle it elsewhere in your code
  }
}

export default db_connect;
