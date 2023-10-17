import dbConnection from "../config/db.js";
export const qr_slip=async(booking_id)=>{
    try {
        const userIdQuery = `SELECT user_id, order_status FROM bookings WHERE id = ?`;
        dbConnection.query(userIdQuery, [booking_id],(error, data)=>{
            const userId = data[0].user_id;
            if(data){
                const query = `
                SELECT bq.qr_code,b.order_id,b.date,
                CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip, ', ',ca.latitude, ', ', ca.longitude) AS address,
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                JOIN booking_qr AS bq ON b.id = bq.booking_id
                WHERE b.user_id = ? AND b.id = ? `;
      
              dbConnection.query(query, [userId, booking_id], (error, data2)=>{}) 
            }
        });
       
       
    } catch (error) {
        console.error("Error:", error);
    }
}