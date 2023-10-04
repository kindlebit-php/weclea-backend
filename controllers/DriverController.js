import dbConnection from "../config/db.js";
import { date, time } from "../helpers/date.js";

// Driver order api

export const get_orders = async (req, res) => {
  try {
    const userData = res.user;
    console.log(userData)
    const order = `SELECT id,order_id, date, time FROM bookings WHERE driver_id = ${userData[0].id}`;
    dbConnection.query(order, function (error, data) {
      if (error) throw error;
      res.json({
        status: true,
        message: "Data retrieved successfully!",
        data: data,
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

// Driver order detail
export const get_order_detail = async (req, res) => {
  try {
    const orderId = req.body.id;
    const userData = res.user;
    const driverId = userData[0].id;

    const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
    dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const userIds = userIdResult.map((row) => row.user_id);
      const query = `
                SELECT u.name, u.comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude, b.total_loads
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                WHERE b.order_id = ? AND b.user_id IN (?)`;

      dbConnection.query(query, [orderId, userIds], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        res.json({
          status: true,
          message: "Order details retrieved successfully!",
          data: data,
        });
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


export const pickup_loads = async (req, res) => {
  try {
    const userData = res.user;
    const driverId = userData[0].id;
    const qr_code = req.body.qr_code;

    const bookingDataQuery = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(bookingDataQuery, [qr_code], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (data.length > 0 && data[0].driver_pickup_status === 0) {
        const updateStatus = `UPDATE booking_qr SET driver_pickup_status = '1' WHERE id = ${data[0].id}`;

        dbConnection.query(updateStatus, function (updateerror, updateResult) {
          if (updateerror) {
            return res.json({ status: false, message: updateerror.message });
          }
          res.json({
            status: true,
            message: "Data retrieved and updated successfully!",
            booking_id: data[0].booking_id,
          });
        });
      } else {
        res.json({ status: false, message: "Invalid QR code" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const pickup_loads_detail = async (req, res) => {
  try {
    const booking_id = req.body.booking_id;
    const userData = res.user;
    const driverId = userData[0].id;
    const userId = `SELECT user_id FROM bookings WHERE id = ?`;

    dbConnection.query(userId, [booking_id], function (error, data) {
      if (error) {
        res.json({ status: false, message: error.message });
      } else {
        const userId = data[0].user_id;
        console.log(userId);
        const query = `
            SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE  b.user_id = ? AND b.id = ? `;

        dbConnection.query(query, [userId, booking_id], (error, data) => {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
          res.json({
            status: true,
            message: "Details retrieved successfully!",
            data: data,
          });
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_pickup_details = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const userData = res.user;
    const driverId = userData[0].id;

    const userId = `SELECT user_id FROM bookings WHERE id = ?`;

    dbConnection.query(userId, [booking_id], function (error, data) {
      console.log(data);
      if (error) {
        res.json({ status: false, message: error.message });
      } else {
        const userId = data[0].user_id;
        console.log(userId);
        const query = `
            SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE  b.user_id = ? AND b.id = ? `;

        dbConnection.query(query, [userId, booking_id], (error, data) => {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
          const currentTime = time();
          const currentDate = date();
          const update_Date_Time = `UPDATE booking_timing SET driver_pick_time = '${currentTime}' , driver_pick_date = '${currentDate}' WHERE booking_id
            = ${booking_id}`;

          dbConnection.query(
            update_Date_Time,
            function (updateTimeErr, updateTimeResult) {
              if (updateTimeErr) {
                return res.json({status: false, message: updateTimeErr.message});
              } else {
                const imageArray = [];
                req.files.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (req.files.length > 5) {
                  return res.json({status: false, message: "only 5 images are allowed"});
                }
                const pickupImagesJSON = JSON.stringify(imageArray);

                const update_pickupimages =
                  "UPDATE booking_images SET pickup_images = ? WHERE booking_id = ?";
                dbConnection.query(update_pickupimages, [pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
                    if (updateImagesErr) {
                      return res.json({ status: false,  message: updateImagesErr.message});
                    } else {
                      const responseData = { status: true, message: "Submitted successfully!",
                        data: { data, driver_pick_time: currentTime, driver_pick_date: currentDate, driver_pick_images: imageArray},
                      };
                      return res.json(responseData);
                    }
                  }
                );
              }
            }
          );
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};



export const laundry_NotFound = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const userData = res.user;
    const driverId = userData[0].id;

    const userIdQuery = `SELECT user_id FROM bookings WHERE id = ?`;

    dbConnection.query(userIdQuery, [booking_id], function (error, userIdData) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const userId = userIdData[0].user_id;
      const query = `
        SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude, b.total_loads
        FROM bookings AS b
        JOIN customer_address AS ca ON b.user_id = ca.user_id
        JOIN users AS u ON b.user_id = u.id
        WHERE b.user_id = ? AND b.id = ?`;

      dbConnection.query(query, [userId, booking_id], (error, bookingData) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }

        const currentTime = time();
        const currentDate = date();
        const update_Date_Time = `UPDATE booking_timing SET driver_pick_time = '${currentTime}' , driver_pick_date = '${currentDate}' WHERE booking_id = ${booking_id}`;

        dbConnection.query(
          update_Date_Time,
          function (updateTimeErr, updateTimeResult) {
            if (updateTimeErr) {
              return res.json({ status: false, message: updateTimeErr.message });
            } else {
              const imageArray = [];
              req.files.forEach((e, i) => {
                imageArray.push(e.path);
              });
              if (req.files.length > 5) {
                return res.json({ status: false, message: "only 5 images are allowed" });
              }
              const pickupImagesJSON = JSON.stringify(imageArray);

              const update_pickupimages = "UPDATE booking_images SET pickup_images = ? WHERE booking_id = ?";
              dbConnection.query(update_pickupimages, [pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
                if (updateImagesErr) {
                  return res.json({ status: false, message: updateImagesErr.message });
                } else {
                  const update_orderStatus = "UPDATE bookings SET order_status = '7' WHERE id = ?";
                  dbConnection.query(update_orderStatus, [booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
                    if (updateOrderStatusErr) {
                      return res.json({ status: false, message: updateOrderStatusErr.message });
                    } else {
                      const responseData = {status: true,message: "Submitted successfully!",
                        data: {bookingData,driver_pick_time: currentTime,driver_pick_date: currentDate,driver_pick_images: imageArray},
                      };
                      return res.json(responseData);
                    }
                  });
                }
              });
            }
          }
        );
      });
    });
  } catch (error) {
    console.log( error.message)
    return res.json({ status: false, message: error.message });
  }
};


// Driver drop order api

export const get_drop_orders = async (req, res) => {
  try {
    const userData = res.user;
    const order = `SELECT order_id FROM bookings WHERE order_status = '4' AND driver_id = ${userData[0].id}`;
    dbConnection.query(order, function (error, data) {
      if (error) throw error;
      res.json({
        status: true,
        message: "Data retrieved successfully!",
        data: data,
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


// Driver order detail
export const get_drop_order_detail = async (req, res) => {
  try {
    const orderId = req.body.id;
    const userData = res.user;
    const driverId = userData[0].id;
    const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
    dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const userIds = userIdResult.map((row) => row.user_id);
      const query = `
                SELECT u.name, u.comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                WHERE b.order_id = ? AND b.user_id IN (?)`;
      dbConnection.query(query, [orderId, userIds], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        res.json({
          status: true,
          message: "Order details retrieved successfully!",
          data: data,
        });
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const drop_loads = async (req, res) => {
  try {
    const userData = res.user;
    const driverId = userData[0].id;
    const qr_code = req.body.qr_code;
    const bookingDataQuery = "SELECT * FROM booking_qr WHERE qr_code = ?";

    dbConnection.query(bookingDataQuery, [qr_code], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (data.length > 0 && data[0].driver_drop_status === 0) {
        const updateStatusQuery = "UPDATE booking_qr SET driver_drop_status = '1' WHERE id = ?";
        const booking_id = data[0].booking_id;

        dbConnection.query(updateStatusQuery, [data[0].id], function (updateerror, updateResult) {
          if (updateerror) {
            return res.json({ status: false, message: updateerror.message });
          }

          const updateOrderStatusQuery = "UPDATE bookings SET order_status = '5' WHERE id = ?";
          dbConnection.query(updateOrderStatusQuery, [booking_id], function (updateError, updateResult) {
            if (updateError) {
              return res.json({ status: false, message: updateError.message });
            }

            res.json({
              status: true,
              message: "Data retrieved and updated successfully!",
              booking_id: booking_id,
            });
          });
        });
      } else {
        res.json({ status: false, message: "Invalid QR code" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};




export const drop_loads_detail = async (req, res) => {
  try {
    const booking_id = req.body.booking_id;
    const userData = res.user;
    const driverId = userData[0].id;
    const userId = `SELECT user_id FROM bookings WHERE id = ?`;

    dbConnection.query(userId, [booking_id], function (error, data) {
      if (error) {
        res.json({ status: false, message: error.message });
      } else {
        const userId = data[0].user_id;
        console.log(userId);
        const query = `
            SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE  b.user_id = ? AND b.id = ? `;

        dbConnection.query(query, [userId, booking_id], (error, data) => {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
          res.json({ status: true, message: "Details retrieved successfully!", data: data });
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


export const submit_drop_details = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const userData = res.user;
    const driverId = userData[0].id;

    const userIdQuery = `SELECT user_id, order_status FROM bookings WHERE id = ?`;

    dbConnection.query(userIdQuery, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data.length === 0) {
        return res.json({ status: false, message: "Booking not found" });
      } else {
        const userId = data[0].user_id;
        const order_status = data[0].order_status;

        // Check if order_status is not equal to 5
        if (order_status !== 5) {
          return res.json({ status: false, message: "Invalid order status" });
        }

        const query = `
          SELECT u.name, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
          FROM bookings AS b
          JOIN customer_address AS ca ON b.user_id = ca.user_id
          JOIN users AS u ON b.user_id = u.id
          WHERE b.user_id = ? AND b.id = ? `;

        dbConnection.query(query, [userId, booking_id], (error, data) => {
          if (error) {
            return res.json({ status: false, message: error.message });
          }

          const currentTime = time();
          const currentDate = date();
          const update_Date_Time = `UPDATE booking_timing SET deliever_time = '${currentTime}' , deliever_date = '${currentDate}' WHERE booking_id = ${booking_id}`;

          dbConnection.query(update_Date_Time, function (updateTimeErr, updateTimeResult) {
            if (updateTimeErr) {
              return res.json({ status: false, message: updateTimeErr.message });
            } else {
              const imageArray = [];
              req.files.forEach((e, i) => {
                imageArray.push(e.path);
              });
              if (req.files.length > 5) {
                return res.json({ status: false, message: "Only 5 images are allowed" });
              }
              const dropImagesJSON = JSON.stringify(imageArray);

              const update_dropimages = "UPDATE booking_images SET drop_image = ? WHERE booking_id = ?";
              dbConnection.query(update_dropimages, [dropImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
                if (updateImagesErr) {
                  return res.json({ status: false, message: updateImagesErr.message });
                } else {
                  if (updateImagesResult) {
                    const updateStatus = `UPDATE bookings SET order_status = '6' WHERE id = ${booking_id}`;

                    dbConnection.query(updateStatus, function (updateerror, updateResult) {
                      if (updateerror) {
                        return res.json({ status: false, message: updateerror.message });
                      } else {
                        const responseData = {
                          status: true,
                          message: "Submitted successfully!",
                          data: { data, deliever_time: currentTime, deliever_date: currentDate, drop_images: imageArray },
                        };
                        return res.json(responseData);
                      }
                    });
                  }
                }
              });
            }
          });
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


export const order_histroy=async(req,res)=>{
  try {
    const userData = res.user;
    const driverId = userData[0].id;

    const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
    dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      const userIds = userIdResult.map((row) => row.user_id);
      const query = `
      SELECT
        u.mobile,
        CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip) AS address,
        b.user_id AS Customer_Id,
        b.order_id,
        CONCAT(b.date, ' ', b.time) AS PickUp_date_time
      FROM bookings AS b
      JOIN customer_address AS ca ON b.user_id = ca.user_id
      JOIN users AS u ON b.user_id = u.id
      WHERE b.order_status = '6' AND b.driver_id = ? AND b.user_id IN (?)
        ORDER BY PickUp_date_time DESC`;
      
      dbConnection.query(query, [driverId, userIds], (error, data) => {
        console.log(userIds,driverId , data)
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        res.json({ status: true, message: "Order details retrieved successfully!", data: data});
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
}


export const order_histroy_byOrderId=async(req,res)=>{
  try {
    const userData = res.user;
    const driverId = userData[0].id;
    const orderId = req.body.orderId;

    const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
    dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      const userIds = userIdResult.map((row) => row.user_id);
      const query = `
      SELECT
        u.mobile,
        CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip) AS address,
        b.user_id AS Customer_Id,
        b.order_id,
        CONCAT(b.date, ' ', b.time) AS PickUp_date_time
      FROM bookings AS b
      JOIN customer_address AS ca ON b.user_id = ca.user_id
      JOIN users AS u ON b.user_id = u.id
      WHERE b.order_status = '6' AND b.order_id = ? AND b.driver_id = ? AND b.user_id IN (?)`;
      
      dbConnection.query(query, [orderId, driverId, userIds], (error, data) => {
        console.log(userIds,driverId , data)
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        res.json({ status: true, message: "Order details retrieved successfully!", data: data});
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
}


export const profile = async (req, res) => {
  const userData = res.user;
  const id = userData[0].id;

  try {
    const userIdData = `SELECT profile_image, name, email, mobile FROM users WHERE id = ${id}`;
    dbConnection.query(userIdData, async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      res.json({ status: true, data: userIdResult }); 
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};
export default {
  get_orders,
  get_order_detail,
  pickup_loads,
  pickup_loads_detail,
  submit_pickup_details,
  laundry_NotFound,
  get_drop_orders,
  get_drop_order_detail,
  drop_loads,
  drop_loads_detail,
  submit_drop_details,
  order_histroy,
  order_histroy_byOrderId,
  profile
};