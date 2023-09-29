import FCM from 'fcm-node';
import dbConnection from "../config/db.js";
import dotenv from 'dotenv';
dotenv.config();
const fcm = new FCM(process.env.FCM_SERVER_KEY);
export const fcm_notification = async (token, title, body, user_id) => {
  try {

    // Insert notification data into MySQL
    const query = `INSERT INTO notifications (title, body, user_id, date)
      VALUES (?, ?, ?, ?)`;
    const values = [title, body, user_id, new Date().toJSON().slice(0, 10)];
    await dbConnection.execute(query, values);
    dbConnection.release();

    const message = {
      // This may vary according to the message type (single recipient, multicast, topic, etc.)
      to: token,
      collapse_key: token,
      notification: {
        title: title,
        body: body,
      },
    };

    // Send FCM notification
    fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!", err);
      } else {
        console.log("Successfully sent with response: ", response);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
};
