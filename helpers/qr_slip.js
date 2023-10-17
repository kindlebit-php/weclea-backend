import dbConnection from "../config/db.js";
const qrcode = require('qrcode');

export const qr_slip = async (booking_id, res) => {
    try {
        const userIdQuery = `SELECT user_id, order_status FROM bookings WHERE id = ?`;
        dbConnection.query(userIdQuery, [booking_id], (error, data) => {
            if (error) {
                console.error("Error:", error);
                return; 
            }
            if (data && data.length > 0) { 
                const userId = data[0].user_id;
                const query = `
                SELECT bq.qr_code AS QR_code, b.order_id, b.date,
                CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip, ', ', ca.latitude, ', ', ca.longitude) AS address
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                JOIN booking_qr AS bq ON b.id = bq.booking_id
                WHERE b.user_id = ? AND b.id = ? `;

                dbConnection.query(query, [userId, booking_id], (error, data2) => {
                    if (error) {
                        console.error("Error:", error);
                        return; 
                    }
                    if (data2 && data2.length > 0) { 
                        const qr_code = data2[0].QR_code;
                        qrcode.toDataURL(qr_code, (err, qrCode) => {
                            if (err) {
                                console.error("Error generating QR code:", err);
                                return;
                            }
                            res.send(`
                            <html>
                            <body>
                                <p>Order ID: ${data2[0].order_id}</p>
                                <p>Date: ${data2[0].date}</p>
                                <p>Address: ${data2[0].address}</p>
                                <img src="${qrCode}" alt="QR Code">
                            </body>
                            </html>
                        `);
                        });
                       
                    }
                });
            }
        });

    } catch (error) {
        console.error("Error:", error);
    }
}
