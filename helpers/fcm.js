import FCM from 'fcm-node';
import dbConnection from "../config/db.js";
import dotenv from 'dotenv';
dotenv.config();
//const fcm = new FCM(process.env.FCM_SERVER_KEY);
export const fcm_notification = async (title, body,user_id, type) => {
  try {

    // Insert notification data into MySQL
    const insertion = `INSERT INTO notifications (title, body, user_id, type) VALUES (?, ?, ?, ?)`;
    const values = [title, body, user_id, type];
    dbConnection.query(insertion, values, (error, results) => {
        if (error) {
            console.error(error);
        } else {
            console.log("Insertion successful");
        }
    });
    

    // const message = {
    //   // This may vary according to the message type (single recipient, multicast, topic, etc.)
    //   to: token,
    //   collapse_key: token,
    //   notification: {
    //     title: title,
    //     body: body,
    //   },
    // };

    // Send FCM notification
    // fcm.send(message, function (err, response) {
    //   if (err) {
    //     console.log("Something has gone wrong!", err);
    //   } else {
    //     console.log("Successfully sent with response: ", response);
    //   }
    // });
  } catch (error) {
    console.error("Error:", error);
  }
};
