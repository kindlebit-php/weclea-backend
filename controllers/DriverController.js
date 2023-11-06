import dbConnection from "../config/db.js";
import { date, time } from "../helpers/date.js";
import { fcm_notification } from "../helpers/fcm.js";
import dateFormat from "date-and-time";

// Driver order api

export const get_orders = async (req, res) => {
  try {
    const userData = res.user;
    var datetime = new Date();
    const {type} = req.body;

  const currentDate = dateFormat.format(datetime,'YYYY-MM-DD'); 
   
    if(type == 1){
    var order = "select * from (select bookings.id,bookings.order_id,bookings.date,bookings.time, SQRT(POW(69.1 * ('"+userData[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+userData[0].longitude+"') * COS('"+userData[0].latitude+"' / 57.3)), 2)) AS distance FROM bookings left join customer_address on bookings.user_id = customer_address.user_id where bookings.order_status != '7' and bookings.order_status != '8' and bookings.order_status != '6' and bookings.order_status != '4' and bookings.order_status != '5' and bookings.order_type != '3' and bookings.date = '"+currentDate+"' and driver_id ='"+userData[0].id+"' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance desc;";

    }else{
    var order = "select * from (select bookings.id,bookings.order_id,bookings.date,bookings.time, SQRT(POW(69.1 * ('"+userData[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+userData[0].longitude+"') * COS('"+userData[0].latitude+"' / 57.3)), 2)) AS distance FROM bookings left join customer_address on bookings.user_id = customer_address.user_id where bookings.order_status != '7' and bookings.order_status != '8' and bookings.order_status != '6' and bookings.order_status != '4' and bookings.order_status != '5' and bookings.order_type = '3' and bookings.date = '"+currentDate+"' and driver_id ='"+userData[0].id+"' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance desc;";

    }
    console.log('order',order)
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
 
// Driver order api

export const get_dry_clean_orders = async (req, res) => {
  try { 
    const userData = res.user;
    var datetime = new Date();
    const currentDate = dateFormat.format(datetime, "YYYY-MM-DD");
    // const order = `SELECT id,order_id, date, time FROM bookings WHERE cron_status = 1 AND date >= '${currentDate}' AND driver_id = ${userData[0].id}`;
    var order =
      "select * from (select bookings.id,bookings.order_id,bookings.date,bookings.time, SQRT(POW(69.1 * ('30.7320' - latitude), 2) + POW(69.1 * ((longitude - '76.7726') * COS('30.7320' / 57.3)), 2)) AS distance FROM bookings left join customer_address on bookings.user_id = customer_address.user_id where bookings.order_status != '7' and bookings.order_status != '6' and bookings.order_status != '4' and bookings.order_status != '5' and bookings.order_type = '3' and bookings.date = '" +
      currentDate +
      "' and driver_id ='" +
      userData[0].id +
      "' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance desc;";
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
    const orderId = req.body.orderId;
    const userData = res.user;
    const driverId = userData[0].id;

    const userIdQuery = `
            SELECT user_id FROM bookings AS b1
            left JOIN users AS u ON u.id = b1.driver_id
            WHERE u.id = ?`;
    dbConnection.query(userIdQuery, [driverId], async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      const userIds = userIdResult.map((row) => row.user_id);
      const query = `
                SELECT u.name,u.profile_image,u.mobile, bin.pickup_instruction AS comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude, b.id AS booking_id, b.total_loads
                FROM bookings AS b
                left JOIN customer_address AS ca ON b.user_id = ca.user_id
                left JOIN users AS u ON b.user_id = u.id
                left JOIN booking_instructions AS bin ON b.user_id = bin.user_id
                WHERE b.order_id = ? AND b.user_id IN (?)`;
console.log('queryorderList',query)
      dbConnection.query(query, [orderId, userIds], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length === 0) {
          return res.json({ status: false, message: "data Not found" });
        }

        const {
          name,
          profile_image,
          mobile,
          address,
          appartment,
          city,
          state,
          zip,
          comment,
          latitude,
          longitude,
          booking_id,
          total_loads,
        } = data[0];
        const resData = {
          name,
          profile_image: `${profile_image === "null" ? "" : profile_image}`,
          mobile,
          comment:`${comment == null || comment == undefined ? "There are no instructions from the customer" : comment}`,
          address,
          appartment,
          city,
          state,
          zip,
          latitude,
          longitude,
          booking_id,
          total_loads,
        };
        res.json({
          status: true,
          message: "Order details retrieved successfully!",
          data: resData,
        });
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const print_All_QrCode = async (req, res) => {
  try {
    const userData = res.user;
    const booking_id = req.body.booking_id;
    const data = `SELECT id AS qr_codeID, qr_code,driver_pickup_status FROM booking_qr WHERE booking_id = ${booking_id}`;
    dbConnection.query(data, function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else {
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i].driver_pickup_status === 1) {
            count++;
          }
        }
        return res.json({
          status: true,
          message: "Data retrieved successfully!",
          load_scanned: count,
          data: data,
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const print_All_Drop_QrCode = async (req, res) => {
  try {
    const userData = res.user;
    const booking_id = req.body.booking_id;

          const data = `SELECT id AS qr_codeID, qr_code,driver_drop_status FROM booking_qr WHERE folder_pack_status = 1 AND booking_id  = ${booking_id}`;
    dbConnection.query(data, function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else {
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i].driver_drop_status === 1) {
            count++;
          }
        }
        res.json({
          status: true,
          message: "Data retrieved successfully!",
          load_scanned: count,
          data: data,
        });
      }
    });

  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const pickup_loads = async (req, res) => {
  try {
    const userData = res.user;
    const driverId = userData[0].id;
    const { qr_code, qr_codeID } = req.body;

    const bookingDataQuery =
      "SELECT * FROM booking_qr WHERE qr_code = ? AND id = ?";
    dbConnection.query(
      bookingDataQuery,
      [qr_code, qr_codeID],
      function (error, data) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }

        if (data.length > 0 && data[0].driver_pickup_status === 0) {
          const updateStatus = `UPDATE booking_qr SET driver_pickup_status = '1' WHERE id = ${data[0].id}`;

          dbConnection.query(
            updateStatus,
            function (updateerror, updateResult) {
              if (updateerror) {
                return res.json({
                  status: false,
                  message: updateerror.message,
                });
              }
              const result = {
                booking_id: data[0].booking_id,
                qrCode_id: data[0].id,
                driver_pickup_status: 1,
              };
              res.json({
                status: true,
                message: "Data retrieved and updated successfully!",
                data: result,
              });
            }
          );
        } else {
          res.json({ status: false, message: "Invalid QR code" });
        }
      }
    );
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
        const query = `
            SELECT u.name,bin.pickup_instruction AS comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            JOIN booking_instructions AS bin ON b.user_id = bin.user_id
            WHERE  b.user_id = ? AND b.id = ? `;

        dbConnection.query(query, [userId, booking_id], (error, data) => {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
          res.json({
            status: true,
            message: "Details retrieved successfully!",
            data: data[0],
          });
        });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_pickup_details = async (req, res) => {
  console.log("filelog", req.files);

  try {
    const { booking_id } = req.body;
    const userData = res.user;
    const driverId = userData[0].id;
    const userId = `SELECT user_id,order_type FROM bookings WHERE id = ?`;

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
          if(order_type == 3){

          const update_Date_Time = `UPDATE dry_clean_booking_timing SET customer_pick_time = '${currentTime}' , customer_pick_date = '${currentDate}' WHERE booking_id = ${booking_id}`;
        }else{
          const update_Date_Time = `UPDATE booking_timing SET driver_pick_time = '${currentTime}' , driver_pick_date = '${currentDate}' WHERE booking_id = ${booking_id}`;

        }
          const result = data[0];
          dbConnection.query(
            update_Date_Time,
            function (updateTimeErr, updateTimeResult) {
              if (updateTimeErr) {
                return res.json({
                  status: false,
                  message: updateTimeErr.message,
                });
              } else {
                const imageArray = [];
                req.files.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (req.files.length > 5) {
                  return res.json({
                    status: false,
                    message: "only 5 images are allowed",
                  });
                }
                const pickupImagesJSON = imageArray.join(", ");
                if(order_type == 3){
                   const update_pickupimages =
                  "UPDATE dry_clean_booking_images SET pickup_images = ? WHERE booking_id = ?";
                }else{
                   const update_pickupimages =
                  "UPDATE booking_images SET pickup_images = ? WHERE booking_id = ?";
                }
               
                dbConnection.query(
                  update_pickupimages,
                  [pickupImagesJSON, booking_id],
                  function (updateImagesErr, updateImagesResult) {
                    if (updateImagesErr) {
                      return res.json({
                        status: false,
                        message: updateImagesErr.message,
                      });
                    } else {
                      const update_orderStatus =
                        "UPDATE bookings SET order_status = '8' WHERE id = ?";
                      dbConnection.query(
                        update_orderStatus,
                        [booking_id],
                        function (updateStatusErr, updateStatusResult) {
                          if (updateStatusErr) {
                            return res.json({
                              status: false,
                              message: updateStatusErr.message,
                            });
                          } else {
                            const title = "Loads pickup";
                            const body = "Your loads pickup successfully";
                            fcm_notification(title, body, userId, "Pickup");
                            const responseData = {
                              status: true,
                              message: "Submitted successfully!",
                            };

                            return res.json(responseData);
                          }
                        }
                      );
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
        const result = bookingData[0];
        dbConnection.query(
          update_Date_Time,
          function (updateTimeErr, updateTimeResult) {
            if (updateTimeErr) {
              return res.json({
                status: false,
                message: updateTimeErr.message,
              });
            } else {
              const imageArray = [];
              req.files.forEach((e, i) => {
                imageArray.push(e.path);
              });
              if (req.files.length > 5) {
                return res.json({
                  status: false,
                  message: "only 5 images are allowed",
                });
              }
              const pickupImagesJSON = imageArray.join(", ");

              const update_pickupimages =
                "UPDATE booking_images SET pickup_images = ? WHERE booking_id = ?";
              dbConnection.query(
                update_pickupimages,
                [pickupImagesJSON, booking_id],
                function (updateImagesErr, updateImagesResult) {
                  if (updateImagesErr) {
                    return res.json({
                      status: false,
                      message: updateImagesErr.message,
                    });
                  } else {
                    const update_orderStatus =
                      "UPDATE bookings SET order_status = '7' WHERE id = ?";
                    dbConnection.query(
                      update_orderStatus,
                      [booking_id],
                      function (updateOrderStatusErr, updateOrderStatusResult) {
                        if (updateOrderStatusErr) {
                          return res.json({
                            status: false,
                            message: updateOrderStatusErr.message,
                          });
                        } else {
                          const responseData = {
                            status: true,
                            message: "Submitted successfully!",
                            data: {
                              name: result.name,
                              address: result.address,
                              appartment: result.appartment,
                              city: result.city,
                              state: result.state,
                              zip: result.zip,
                              latitude: result.latitude,
                              longitude: result.longitude,
                              driver_pick_time: currentTime,
                              driver_pick_date: currentDate,
                              driver_pick_images: imageArray,
                            },
                          };
                          return res.json(responseData);
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ status: false, message: error.message });
  }
};

// Driver drop order api

export const get_drop_orders = async (req, res) => {
  try {
    const userData = res.user;
    const { type } = req.body;
    // console.log('hi')
    if(type == 1){
    var order = "select * from (select bookings.order_id, SQRT(POW(69.1 * ('"+userData[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+userData[0].longitude+"') * COS('"+userData[0].latitude+"' / 57.3)), 2)) AS distance FROM bookings left join customer_drop_address on bookings.user_id = customer_drop_address.user_id where bookings.order_status = '4' and driver_id ='"+userData[0].id+"' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance asc;";

    }else{
    var order = "select * from (select bookings.order_id, SQRT(POW(69.1 * ('"+userData[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+userData[0].longitude+"') * COS('"+userData[0].latitude+"' / 57.3)), 2)) AS distance FROM bookings left join customer_drop_address on bookings.user_id = customer_drop_address.user_id where bookings.order_status = '4' and driver_id ='"+userData[0].id+"' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance asc;";

    }
    console.log('order_type',order)
    dbConnection.query(order, function (error, data) {
      console.log('kailashtest',data)
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

// Driver drop order api

export const get_dry_clean_drop_orders = async (req, res) => {
  try {
    const userData = res.user;
    var datetime = new Date();
    const currentDate = dateFormat.format(datetime, "YYYY-MM-DD");
    // const order = `SELECT order_id FROM bookings WHERE order_status = '4' AND driver_id = ${userData[0].id}`;
    var order =
      "select * from (select bookings.order_id, SQRT(POW(69.1 * ('30.7320' - latitude), 2) + POW(69.1 * ((longitude - '76.7726') * COS('30.7320' / 57.3)), 2)) AS distance FROM bookings left join customer_address on bookings.user_id = customer_address.user_id where bookings.order_status = '4' and bookings.order_type = '3' and bookings.date = '" +
      currentDate +
      "' and driver_id ='" +
      userData[0].id +
      "' and cron_status = 1 ORDER BY distance) as vt where vt.distance < 50 order by distance asc;";
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
    const orderId = req.body.orderId;
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
      console.log(orderId, userIds);
      const query = `
                SELECT u.name,u.profile_image, u.comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude,b.id AS booking_id
                FROM bookings AS b
                JOIN customer_address AS ca ON b.user_id = ca.user_id
                JOIN users AS u ON b.user_id = u.id
                WHERE b.order_id = ? AND b.user_id IN (?)`;
      dbConnection.query(query, [orderId, userIds], (error, data) => {
        console.log(data, "skfjuhk");
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length === 0) {
          return res.json({ status: false, message: "data Not found" });
        }

        const {
          name,
          profile_image,
          comment,
          address,
          appartment,
          city,
          state,
          zip,
          latitude,
          longitude,
          booking_id,
          total_loads,
        } = data[0];
        const resData = {
          name,
          profile_image: `${profile_image === "null" ? "" : profile_image}`,
          comment:`${comment == null || comment == undefined ? "There are no instructions from the customer" : comment}`,
          address,
          appartment,
          city,
          state,
          zip,
          latitude,
          longitude,
          booking_id,
          total_loads,
        };
        res.json({
          status: true,
          message: "Order details retrieved successfully!",
          data: resData,
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
    const { qr_code, qr_codeID } = req.body;
    const bookingDataQuery =
      "SELECT * FROM booking_qr WHERE qr_code = ? AND id = ?";

    dbConnection.query(
      bookingDataQuery,
      [qr_code, qr_codeID],
      function (error, data) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }

        if (data.length > 0 && data[0].driver_drop_status === 0) {
          const updateStatusQuery =
            "UPDATE booking_qr SET driver_drop_status = '1' WHERE id = ?";
          const booking_id = data[0].booking_id;

          dbConnection.query(
            updateStatusQuery,
            [data[0].id],
            function (updateerror, updateResult) {
              if (updateerror) {
                return res.json({
                  status: false,
                  message: updateerror.message,
                });
              }

               res.json({
                    status: true,
                    message: "Data retrieved and updated successfully!",
                    booking_id: booking_id,
                    qrCode_id: data[0].id,
                });

              // const updateOrderStatusQuery =
              //   "UPDATE bookings SET order_status = '6' WHERE id = ?";
              //   console.log('updateOrderStatusQuery',updateOrderStatusQuery)
              // dbConnection.query(
              //   updateOrderStatusQuery,
              //   [booking_id],
              //   function (updateError, updateResult) {
              //     console.log('updateResult',updateResult)
              //     if (updateError) {
              //       return res.json({
              //         status: false,
              //         message: updateError.message,
              //       });
              //     }

                 
              //   }
              // );
            }
          );
        } else {
          res.json({ status: false, message: "Invalid QR code" });
        }
      }
    );
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
          res.json({
            status: true,
            message: "Details retrieved successfully!",
            data: data[0],
          });
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
        return res.json({ status: flse, message: "Booking not found" });
      } else {
        const userId = data[0].user_id;
        const order_status = data[0].order_status;

        // Check if order_status is not equal to 5
        // if (order_status < 5) {
        //   return res.json({ status: false, message: "Invalid order status" });
        // }

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
          const result = data[0];
          dbConnection.query(
            update_Date_Time,
            function (updateTimeErr, updateTimeResult) {
              if (updateTimeErr) {
                return res.json({
                  status: false,
                  message: updateTimeErr.message,
                });
              } else {
                const imageArray = [];
                req.files.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (req.files.length > 5) {
                  return res.json({
                    status: false,
                    message: "only 5 images are allowed",
                  });
                }
                const dropImagesJSON = imageArray.join(", ");

                const update_dropimages =
                  "UPDATE booking_images SET drop_image = ? WHERE booking_id = ?";
                dbConnection.query(
                  update_dropimages,
                  [dropImagesJSON, booking_id],
                  function (updateImagesErr, updateImagesResult) {
                    if (updateImagesErr) {
                      return res.json({
                        status: false,
                        message: updateImagesErr.message,
                      });
                    } else {
                      if (updateImagesResult) {
                        const updateStatus = `UPDATE bookings SET order_status = '6' WHERE id = ${booking_id}`;

                        dbConnection.query(
                          updateStatus,
                          function (updateerror, updateResult) {
                            if (updateerror) {
                              return res.json({
                                status: false,
                                message: updateerror.message,
                              });
                            } else {
                              const responseData = {
                                status: true,
                                message: "Submitted successfully!",
                                data: {
                                  name: result.name,
                                  address: result.address,
                                  appartment: result.appartment,
                                  city: result.city,
                                  state: result.state,
                                  zip: result.zip,
                                  latitude: result.latitude,
                                  longitude: result.longitude,
                                  deliever_time: currentTime,
                                  deliever_date: currentDate,
                                  drop_images: imageArray,
                                },
                              };
                              const title = "Loads drop";
                              const body = "Your loads drop successfully";
                              fcm_notification(title, body, userId, "DROP");
                              return res.json(responseData);
                            }
                          }
                        );
                      }
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

export const order_histroy = async (req, res) => {
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
      SELECT u.mobile,
        CONCAT(ca.address, ', ', ca.appartment, ', ', ca.city, ', ', ca.state, ', ', ca.zip) AS address,
        b.user_id AS Customer_Id,
        b.order_id,
        b.date AS DATE,
        CONCAT(b.date, ' ', b.time) AS PickUp_date_time
      FROM bookings AS b
      JOIN customer_address AS ca ON b.user_id = ca.user_id
      JOIN users AS u ON b.user_id = u.id
      WHERE b.order_status = '6' AND b.driver_id = ? AND b.user_id IN (?) ORDER BY DATE DESC`;
      dbConnection.query(query, [driverId, userIds], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }

        const groupedData = {};
        data.forEach((row) => {
          const date = row.DATE;
          if (!groupedData[date]) {
            groupedData[date] = [];
          }
          groupedData[date].push({
            mobile: row.mobile,
            address: row.address,
            Customer_Id: row.Customer_Id,
            order_id: row.order_id,
            PickUp_date_time: row.PickUp_date_time,
          });
        });

        // Create the response format
        const resultData = {
          status: true,
          message: "Order details retrieved successfully!",
          data: Object.entries(groupedData).map(([date, orders]) => ({
            Date: date,
            orders: orders,
          })),
        };

        res.json(resultData);
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const order_histroy_byOrderId = async (req, res) => {
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
        b.date AS DATE,
        CONCAT(b.date, ' ', b.time) AS PickUp_date_time
      FROM bookings AS b
      JOIN customer_address AS ca ON b.user_id = ca.user_id
      JOIN users AS u ON b.user_id = u.id
      WHERE b.order_status = '6' AND b.order_id = ? AND b.driver_id = ? AND b.user_id IN (?)`;

      dbConnection.query(query, [orderId, driverId, userIds], (error, data) => {
        console.log(userIds, driverId, data);
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const groupedData = {};
        data.forEach((row) => {
          const date = row.DATE;
          if (!groupedData[date]) {
            groupedData[date] = [];
          }
          groupedData[date].push({
            mobile: row.mobile,
            address: row.address,
            Customer_Id: row.Customer_Id,
            order_id: row.order_id,
            PickUp_date_time: row.PickUp_date_time,
          });
        });

        // Create the response format
        const resultData = {
          status: true,
          message: "Order details retrieved successfully!",
          data: Object.entries(groupedData).map(([date, orders]) => ({
            Date: date,
            orders: orders,
          })),
        };

        res.json(resultData);
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const profile = async (req, res) => {
  const userData = res.user;
  const id = userData[0].id;
  try {
    const userIdData = `SELECT profile_image, name, email, mobile FROM users WHERE id = ${id}`;
    dbConnection.query(userIdData, async (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      res.json({ status: true, data: userIdResult[0] });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};
export default {
  get_orders,
  get_dry_clean_orders,
  get_order_detail,
  print_All_QrCode,
  print_All_Drop_QrCode,
  pickup_loads,
  pickup_loads_detail,
  submit_pickup_details,
  laundry_NotFound,
  get_drop_orders,
  get_drop_order_detail,
  get_dry_clean_drop_orders,
  drop_loads,
  drop_loads_detail,
  submit_drop_details,
  order_histroy,
  order_histroy_byOrderId,
  profile,
};
