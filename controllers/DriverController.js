import dbConnection from'../config/db.js';
import { date, time } from '../helpers/date.js';

// Driver order api

export const get_orders = async (req, res) =>
 {
    try
     {
        const userData = res.user;
        const order = `SELECT id,order_id, date, time FROM bookings WHERE driver_id = ${userData[0].id}`;
        dbConnection.query(order, function (error, data) {
            if (error) throw error;
            res.json({ 'status': true, 'message': 'Data retrieved successfully!', 'data': data });
        });
    } 
    catch (error)
     {
        res.json({ 'status': false, 'message': error.message });
    }
}


// Driver order detail
export const get_order_detail = async (req, res) => {
    try {
        const orderId = req.query.id;
        const userData = res.user;
        const driverId = userData[0].id;

        const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
        dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
            if (error) {
                return res.json({ 'status': false, "message": error.message });
            }

            const userIds = userIdResult.map(row => row.user_id);
            const query = `
                SELECT u.name, u.comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude, b.total_loads
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                WHERE b.order_id = ? AND b.user_id IN (?)`; 

            dbConnection.query(query, [orderId, userIds], (error, data) => {
                if (error) {
                    return res.json({ 'status': false, "message": error.message });
                }
                res.json({ 'status': true, "message": "Order details retrieved successfully!", 'data': data });
            });
        });
    } catch (error) {
        res.json({ 'status': false, "message": error.message });
    }
}

export const pickup_loads = async (req, res) => {
    try {
      const userData = res.user;
      const driverId = userData[0].id;
      const qr_code = req.body.qr_code;
  
      const bookingDataQuery = 'SELECT * FROM booking_qr WHERE qr_code = ?';
      dbConnection.query(bookingDataQuery, [qr_code], function (error, data) {
        if (error) {
          return res.json({ 'status': false, "message": error.message });
        }

        if (data.length > 0 && data[0].driver_pickup_status === 0) {
          const updateStatus = `UPDATE booking_qr SET driver_pickup_status = '1' WHERE id = ${data[0].id}`;
          
          dbConnection.query(updateStatus, function (updateerror, updateResult) {
            if (updateerror) {
              return res.json({ 'status': false, 'message': updateerror.message });
            }
              res.json({ 'status': true, 'message': 'Data retrieved and updated successfully!', booking_id:data[0].booking_id });
          });
        } else {
          res.json({ 'status': false, 'message': 'Invalid QR code'});
        }
      });
    } catch (error) {
      res.json({ 'status': false, 'message': error.message });
    }
  };
  
  export const pickup_loads_detail = async (req, res) => {
    try {
      const booking_id = req.query.booking_id;
      const userData = res.user;
      const driverId = userData[0].id;
      const userId = `SELECT user_id FROM bookings WHERE id = ?`;
  
      dbConnection.query(userId, [booking_id], function (error, data) {
        if (error) {
          res.json({ 'status': false, 'message': error.message });
        } else {
          const userId = data[0].user_id;
          console.log(userId)
          const query = `
            SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE  b.user_id = ? AND b.id = ? `;
  
          dbConnection.query(query, [userId,booking_id], (error, data) => {
            if (error) {
              return res.json({ 'status': false, "message": error.message });
            }
            res.json({ 'status': true, "message": "Details retrieved successfully!", 'data': data });
          });
        }
      });
    } catch (error) {
      res.json({ 'status': false, 'message': error.message });
    }
  }
  
  export const submit_pickup_details=async(req,res)=>{
    try {
      const {booking_id} = req.body;
      const userData = res.user;
      const driverId = userData[0].id;
      const userId = `SELECT user_id FROM bookings WHERE id = ?`;
  
      dbConnection.query(userId, [booking_id], function (error, data) {
        if (error) {
          res.json({ 'status': false, 'message': error.message });
        } else {
          const userId = data[0].user_id;
          console.log(userId)
          const query = `
            SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE  b.user_id = ? AND b.id = ? `;
  
          dbConnection.query(query, [userId,booking_id], (error, data) => {
            if (error) {
              return res.json({ 'status': false, "message": error.message });
            }
            const currentTime=time();
            const currentDate=date();
            const update_Date_Time = `UPDATE booking_timing SET driver_pick_time = '${currentTime}' , driver_pick_date = '${currentDate}' WHERE booking_id
            = ${booking_id}`;
  
            dbConnection.query(update_Date_Time, function (updateTimeErr, updateTimeResult) {
               if (updateTimeErr) {
                 return res.json({ 'status': false, 'message': updateTimeErr.message });
               }
  })

  const imageArray = [];
req.files.forEach((e, i) => {
  imageArray.push(e.path);
});
if (req.files.length > 5) {
  return res.json({ 'status': false, "message": "only 5 images are allowed" });
}

const update_pickupimages = 'UPDATE booking_images SET pickup_images = ? WHERE booking_id = ?';
dbConnection.query(update_pickupimages, [imageArray, booking_id], function (updateImagesErr, updateImagesResult) {
   if (updateImagesErr) {
     return res.json({ 'status': false, 'message': updateImagesErr.message });
   }
});
const responseData = {
  'status': true,
  "message": "Details retrieved and updated successfully!",
  'data': {
   data,
    driver_pick_time: currentTime,
    driver_pick_date: currentDate
  }
};

return res.json(responseData);
          });
        }
      });


    
    } catch (error) {
      res.json({ 'status': false, 'message': error.message });
    }
  }

export default{
    get_orders,
    get_order_detail,
    pickup_loads,
    pickup_loads_detail,
    submit_pickup_details
};