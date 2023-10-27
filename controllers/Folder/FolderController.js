import dbConnection from "../../config/db.js";
import { date, randomNumber, time } from "../../helpers/date.js";
import path from "path";
import { fcm_notification } from "../../helpers/fcm.js";
import { generatePDF, generateQRCode, getUserData } from "../../helpers/qr_slip.js";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

export const Scan_received_loads = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const { qr_code, qr_codeID, type } = req.body;
  const currentTime = time();
  const currentDate = date();
  const wash_scan_timing = `${currentDate} ${currentTime}`;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ? AND id = ?";
    dbConnection.query(verifyQr, [qr_code, qr_codeID], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }


      if (type == 1) {
        if (data.length == 0 || data[0].driver_pickup_status != 1 || data[0].folder_recive_status != 0) {
          return res.json({ status: false, message: "Invalid QR code or load status" });
        }
        const updateStatus = `UPDATE booking_qr SET folder_recive_status = '1' WHERE id = ${data[0].id}`;
        const update_Date_Time = `UPDATE booking_timing SET wash_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
        const updateBooking = `UPDATE bookings SET folder_id = ${folder_id} WHERE id = ${data[0].booking_id}`;

        dbConnection.query(updateStatus, function (updateerror, updateResult) {
          if (updateerror) {
            return res.json({ status: false, message: updateerror.message });
          }
          if (updateResult.affectedRows === 1) {
            dbConnection.query(update_Date_Time, function (updateTimeErr, updateTimeResult) {
              if (updateTimeErr) {
                return res.json({ status: false, message: updateTimeErr.message });
              }
              if (updateTimeResult.affectedRows === 1) {
                dbConnection.query(updateBooking, function (updateBookingErr, updateBookingResult) {
                  if (updateBookingErr) {
                    return res.json({ status: false, message: updateBookingErr.message });
                  }
                  return res.json({ status: true, message: "Load scanned and updated." });
                });
              }
            });
          }
        });
      } else if (type >= 2 && type <= 4) {
        if (data.length == 0 || data[0].driver_pickup_status != 1 || data[0].folder_recive_status != 1) {
          return res.json({ status: false, message: "Invalid QR code or load status" });
        }
        let update_Date_Time2;
        let verifyStatus;

        if (type == 2) {
          update_Date_Time2 = `UPDATE booking_timing SET dry_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          verifyStatus = `SELECT * FROM bookings WHERE order_status = '1' AND id = ${data[0].booking_id}`;
        } else if (type == 3) {
          update_Date_Time2 = `UPDATE booking_timing SET fold_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          verifyStatus = `SELECT * FROM bookings WHERE order_status = '2' AND id = ${data[0].booking_id}`;
        } else if (type == 4) {
          update_Date_Time2 = `UPDATE booking_timing SET pack_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          verifyStatus = `SELECT * FROM bookings WHERE order_status = '3' AND id = ${data[0].booking_id}`;
        }

        dbConnection.query(verifyStatus, function (verifyStatusErr, verifyStatusResult) {
          if (verifyStatusErr) {
            return res.json({ status: false, message: verifyStatusErr.message });
          }
          dbConnection.query(update_Date_Time2, function (updateTimeErr, updateTimeResult) {
            if (updateTimeErr) {
              return res.json({ status: false, message: updateTimeErr.message });
            }
            if (updateTimeResult.affectedRows === 1) {
              return res.json({ status: true, message: "Load scanned and updated." });
            }
          });
        });
      } else {
        return res.json({ status: false, message: "Invalid 'type' value" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};



export const customer_list_wash = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;

  try {
    const bookingIdQuery = `SELECT id FROM bookings WHERE folder_id = ?`;
    dbConnection.query(bookingIdQuery, [folder_id], (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }
      const booking_id = userIdResult.map((row) => row.id);
      const query = `SELECT b.id AS Booking_id, b.user_id AS Customer_Id, b.date, b.time, b.order_status, bi.pickup_images
                      FROM bookings AS b
                      JOIN booking_images AS bi ON b.id = bi.booking_id
                      WHERE b.id IN (?)`;
      dbConnection.query(query, [booking_id], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length == 0) {
          return res.json({ status: false, message: "Data not found" });
        } else {
          const resData = [];
          if (data?.length > 0) {
            for (const elem of data) {
              const {Booking_id, Customer_Id, date, time, order_status, pickup_images } = elem;

              console.log('images',pickup_images)
              const separatedStrings = pickup_images.split(", ")
               const imagesUrl=separatedStrings.map((val) => {
               return `${process.env.BASE_URL}/${val}`;
              });
                 resData.push({
                Booking_id,
                Customer_Id,
                date,
                time,
                order_status,
                imagesUrl,
              });
            }
          }
          return res.json({
            status: true,
            message: "Updated successfully!",
            data: resData,
          });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const wash_detail_ByCustomer_id = async (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const customer_id = req.body.customer_id;
  try {
    const bookingIdQuery = `SELECT id FROM bookings WHERE folder_id = ?`;
    dbConnection.query(bookingIdQuery, [folder_id], (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }

      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }

      const booking_id = userIdResult.map((row) => row.id);
      console.log(booking_id,folder_id)
      let query = `SELECT b.id AS Booking_id, b.user_id AS Customer_Id, bin.pickup_instruction AS comment, b.date, b.time, b.order_status, bi.pickup_images
                        FROM bookings AS b
                        JOIN booking_images AS bi ON b.id = bi.booking_id
                        JOIN booking_instructions AS bin ON b.user_id = bin.user_id
                        WHERE b.id IN (?)`;

      if (customer_id) {
        
        query += ' AND b.user_id = ?';
      }

      dbConnection.query(query, customer_id ? [booking_id, customer_id] : [booking_id], (error, data) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length === 0) {
          return res.json({ status: false, message: "Data not found" });
        } else {
          const resData = [];
          if (data?.length > 0) {
            for (const elem of data) {
              const { Booking_id, Customer_Id, comment, date, time, order_status, pickup_images } = elem;
              const separatedStrings = pickup_images.split(", ")
              const imagesUrl = separatedStrings.map((val) => {
                return `${process.env.BASE_URL}/${val}`;
              });
                const imageList = imagesUrl.map(imagePath => ({
                  path: imagePath,
                  type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                })
                )
              resData.push({
                Booking_id,
                Customer_Id,
                comment,
                date,
                time,
                order_status,
                imageList,
              });
            }
          }
          return res.json({
            status: true,
            message: "Updated successfully!",
            data: resData,
          });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_wash_detail = async (req, res) => {
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const { booking_id, type , extra_loads } = req.body;
    const currentTime = time();
    const currentDate = date();
    const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

    dbConnection.query(userIdQuery, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      const customerId_Query = "SELECT customer_id FROM users WHERE id = ?";
      dbConnection.query(customerId_Query, [data[0].user_id], function (error, data1) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const loadPrice_query = "SELECT loads_price FROM settings WHERE id = 1";
        dbConnection.query(loadPrice_query, function (error, data2) {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
      let updateDateTimeQuery;
      let updatePickupImagesQuery;
      let updateOrderStatusQuery;

      if (type == 1) {
        updateDateTimeQuery = `UPDATE booking_timing SET wash_time = ?, wash_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET wash_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
      } else if (type == 2) {
        updateDateTimeQuery = `UPDATE booking_timing SET dry_time = ?, dry_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET dry_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
      } else if (type == 3) {
        updateDateTimeQuery = `UPDATE booking_timing SET fold_time = ?, fold_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET fold_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
      } else if(type == 4){
        updateDateTimeQuery = `UPDATE booking_timing SET pack_time = ?, pack_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET pack_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        if(extra_loads !=''){
          var booking = "select user_id,category_id from bookings where id = '"+booking_id+"'";
          dbConnection.query(booking, function (error, bookingdata) {
            if(bookingdata[0].category_id == 1){
              var userLoads = "select commercial as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }else if(bookingdata[0].category_id == 2){
              var userLoads = "select residential as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }else{
              var userLoads = "select yeshiba as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }
                 dbConnection.query(userLoads, function (error, userLoadsresults){
                    if(userLoadsresults[0].totalCount >= extra_loads ){
                      var updateLoads = (userLoadsresults[0].totalCount - extra_loads);
                      if(bookingdata[0].category_id == 1){
                      var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                      }else if(bookingdata[0].category_id == 2){
                      var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                      }else{
                      var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"' ";
                      }
                      dbConnection.query(usrLoadsup, function (error, result) {
                      })

                      for (var i = 0; extra_loads > i; i++) {
                        var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                        dbConnection.query(sql, function (err, results) {
                          if(results){
                            var sql2= `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`
                            dbConnection.query(sql2, async function (err, result1) {
                              const qr_codes = result1.map((row) => row.qr_code);
                              const getAll_qrCode= await generateQRCode(qr_codes)
                              const userData1 = await getUserData(booking_id);
                              const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                              const match = pdfBytes.match(/uploads\\(.+)/);
                              const newPath = 'uploads//' +match[1];
                              const updatePdf = `UPDATE booking_qr SET pdf = '${newPath}' WHERE id = ${results.insertId}`;
                              dbConnection.query(updatePdf, async function (err, result2) {
                               
                              })
                            });
                          }
                        });     
                      }
                    }else{
                      const users = "select card_status from users where id = '"+bookingdata[0].user_id+"'"
                      dbConnection.query(users,async function (error, usersresult) {
                        if(usersresult[0].card_status == 1){
                         const customerId=data1[0].customer_id;
                         const paymentMethods = await stripe.paymentMethods.list({
                          customer: customerId,
                          type: "card",
                        });
                        const cards = paymentMethods.data.map((paymentMethod) => ({
                          cardId: paymentMethod.id,
                          brand: paymentMethod.card.brand,
                          last4: paymentMethod.card.last4,
                        }));
                         const amount=data2[0].loads_price * extra_loads;
                          const paymentIntent = await stripe.paymentIntents.create({
                            amount: amount * 100,
                            currency: 'usd',
                            customer: customerId,
                            payment_method: cards[0].cardId,
                            off_session: true,
                            confirm: true,
                            description: 'Payment by client',
                          });
                         
                          if (paymentIntent.status === 'succeeded') {
                            const currentDate = date(); 
                            const sql = `INSERT INTO payment (user_id,booking_id, amount, payment_id, date) VALUES ('${
                              data[0].user_id}', '${booking_id}', '${amount}', '${paymentIntent.id}', '${currentDate}')`;

                            dbConnection.query(sql, function (error, result) {
                            if (error) {
                               return res.json({ status: false, message: error.message });
                                 }
                                //  return res.json({ status: true, message: 'Payment successful' });
                                  });
                          }else{
                            var updateLoads = (userLoadsresults[0].totalCount - extra_loads);
                          if(bookingdata[0].category_id == 1){
                          var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else if(bookingdata[0].category_id == 2){
                          var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else{
                          var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"' ";
                          }
                          dbConnection.query(usrLoadsup, function (error, result) {
                          })
                        for (var i = 0; extra_loads > i; i++) {
                            var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                            dbConnection.query(sql, function (err, results) {
                              if(results){
                                var sql2= `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`
                                dbConnection.query(sql2, async function (err, result1) {
                                  const qr_codes = result1.map((row) => row.qr_code);
                                  const getAll_qrCode= await generateQRCode(qr_codes)
                                  const userData1 = await getUserData (booking_id);
                                  const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                  const match = pdfBytes.match(/uploads\\(.+)/);
                                  const newPath = 'uploads//' +match[1];
                                  const updatePdf = `UPDATE booking_qr SET pdf = '${newPath}' WHERE id = ${results.insertId}`;
                                  dbConnection.query(updatePdf, async function (err, result2) {
                                  })
                                });
                              }
                            });     
                        }
                          }

                          //payment deduct if card exist

                        }else{
                          var updateLoads = (userLoadsresults[0].totalCount - extra_loads);
                          if(bookingdata[0].category_id == 1){
                          var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else if(bookingdata[0].category_id == 2){
                          var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else{
                          var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"' ";
                          }
                          dbConnection.query(usrLoadsup, function (error, result) {
                          })
                        for (var i = 0; extra_loads > i; i++) {
                            var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                            dbConnection.query(sql, function (err, results) {
                              if(results){
                                var sql2= `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`
                                dbConnection.query(sql2, async function (err, result1) {
                                  const qr_codes = result1.map((row) => row.qr_code);
                                  const getAll_qrCode= await generateQRCode(qr_codes)
                                  const userData1 = await getUserData (booking_id);
                                  const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                  const match = pdfBytes.match(/uploads\\(.+)/);
                                  const newPath = 'uploads//' +match[1];
                                  const updatePdf = `UPDATE booking_qr SET pdf = '${newPath}' WHERE id = ${results.insertId}`;
                                  dbConnection.query(updatePdf, async function (err, result2) {
                                  })
                                });
                              }
                            });     
                        }
                        }

                      })
                    }
                 })
          })
        }
      }

      dbConnection.query(updateDateTimeQuery, [currentTime, currentDate, booking_id], function (updateTimeErr, updateTimeResult) {
        if (updateTimeErr) {
          return res.json({ status: false, message: updateTimeErr.message });
        }

        const imageArray = [];
        req.files.forEach((e, i) => {
          imageArray.push(e.path);
        });
        console.log(imageArray)
        if (imageArray.length > 5) {
          return res.json({ status: false, message: "Only 5 images are allowed" });
        }

        const pickupImagesJSON = imageArray.join(", ");
        console.log(pickupImagesJSON)
        dbConnection.query(updatePickupImagesQuery, [pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
          if (updateImagesErr) {
            return res.json({ status: false, message: updateImagesErr.message });
          }

          dbConnection.query(updateOrderStatusQuery, [type, booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
            if (updateOrderStatusErr) {
              return res.json({ status: false, message: updateOrderStatusErr.message });
            }

            const processMessages = {
              1: "Wash process is completed! Please go to the next step",
              2: "Dry process is completed! Please go to the next step",
              3: "Fold process is completed! Please go to the next step",
              4: "Pack process is completed order is ready to pickup"
            };

            const responseData = {
              status: true,
              message: processMessages[type],
              data: { customer_id: data[0].user_id },
            };
            const title={
              1: "loads Washed",
              2: "loads Dry",
              3: "loads fold",
              4: "loads Pack"
            }
            const body={
              1: "Wash process is completed!",
              2: "Dry process is completed! ",
              3: "Fold process is completed! ",
              4: "Pack process is completed! "
            };
            const fold_type={
              1: "Wash",
              2: "Dry",
              3: "Fold",
              4: "Pack",
            };
            fcm_notification(title[type], body[type], data[0].user_id, fold_type[type])
            return res.json(responseData);
          });
        });
      });
    });
    });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const Scan_loads_For_Dry = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '1' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const dry_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET dry_scan_timing = '${dry_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                if (updateTimeErr) {
                  return res.json({ status: false,message: updateTimeErr.message});
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({status: true,message: "Verified successfully!"});
                } else {
                  return res.json({ status: false, message: "Failed to update timing"});}
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

// export const submit_dry_detail = async (req, res) => {
//   const userData = res.user;
//   const folder_id = userData[0].id;
//   const { booking_id } = req.body;

//   try {
//     const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

//     dbConnection.query(userIdQuery, [booking_id], function (error, data) {
//       if (error) {
//         return res.json({ status: false, message: error.message });
//       }

//       const currentTime = time();
//       const currentDate = date();
//       const updateDateTimeQuery = `UPDATE booking_timing SET dry_time = ?, dry_date = ? WHERE booking_id = ?`;

//       dbConnection.query(
//         updateDateTimeQuery,
//         [currentTime, currentDate, booking_id],
//         function (updateTimeErr, updateTimeResult) {
//           if (updateTimeErr) {
//             return res.json({ status: false, message: updateTimeErr.message });
//           }

//           const imageArray = [];
//           req.files.forEach((e, i) => {
//             imageArray.push(e.path);
//           });

//           if (req.files.length > 5) {
//             return res.json({
//               status: false,
//               message: "only 5 images are allowed",
//             });
//           }
//           const pickupImagesJSON = imageArray.join(", ");
//           const updatePickupImagesQuery =
//             "UPDATE booking_images SET dry_images = ? WHERE booking_id = ?";

//           dbConnection.query(
//             updatePickupImagesQuery,
//             [pickupImagesJSON, booking_id],
//             function (updateImagesErr, updateImagesResult) {
//               if (updateImagesErr) {
//                 return res.json({
//                   status: false,
//                   message: updateImagesErr.message,
//                 });
//               }

//               const updateOrderStatusQuery =
//                 "UPDATE bookings SET order_status = ? WHERE id = ?";

//               dbConnection.query(
//                 updateOrderStatusQuery,
//                 ["2", booking_id],
//                 function (updateOrderStatusErr, updateOrderStatusResult) {
//                   if (updateOrderStatusErr) {
//                     return res.json({
//                       status: false,
//                       message: updateOrderStatusErr.message,
//                     });
//                   }

//                   const responseData = {
//                     status: true,
//                     message:
//                       "Dry process is completed! Please go to the next step",
//                     data: {
//                       customer_id: data[0].user_id,
//                     },
//                   };

//                   return res.json(responseData);
//                 }
//               );
//             }
//           );
//         }
//       );
//     });
//   } catch (error) {
//     res.json({ status: false, message: error.message });
//   }
// };

export const Scan_loads_For_Fold = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log("retyyyouiygtik", data[0].folder_recive_status);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '2' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const fold_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET fold_scan_timing = '${fold_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                if (updateTimeErr) {
                  return res.json({ status: false,  message: updateTimeErr.message,});
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({  status: true,  message: "Verified successfully!", });
                } else {
                  return res.json({status: false, message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

// export const submit_fold_detail = async (req, res) => {
//   const userData = res.user;
//   const folder_id = userData[0].id;
//   const { booking_id } = req.body;

//   try {
//     const userIdQuery = "SELECT user_id FROM bookings WHERE id = ?";

//     dbConnection.query(userIdQuery, [booking_id], function (error, data) {
//       if (error) {
//         return res.json({ status: false, message: error.message });
//       }

//       const currentTime = time();
//       const currentDate = date();
//       const updateDateTimeQuery = `UPDATE booking_timing SET fold_time = ?, fold_date = ? WHERE booking_id = ?`;

//       dbConnection.query(
//         updateDateTimeQuery,
//         [currentTime, currentDate, booking_id],
//         function (updateTimeErr, updateTimeResult) {
//           if (updateTimeErr) {
//             return res.json({ status: false, message: updateTimeErr.message });
//           }

//           const imageArray = [];
//           req.files.forEach((e, i) => {
//             imageArray.push(e.path);
//           });

//           if (req.files.length > 5) {
//             return res.json({
//               status: false,
//               message: "only 5 images are allowed",
//             });
//           }
//           const pickupImagesJSON = imageArray.join(", ");
//           const updatePickupImagesQuery =
//             "UPDATE booking_images SET fold_images = ? WHERE booking_id = ?";

//           dbConnection.query(updatePickupImagesQuery,[pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
//               if (updateImagesErr) {
//                 return res.json({ status: false, message: updateImagesErr.message});
//               }

//               const updateOrderStatusQuery =
//                 "UPDATE bookings SET order_status = ? WHERE id = ?";

//               dbConnection.query(
//                 updateOrderStatusQuery,
//                 ["3", booking_id],
//                 function (updateOrderStatusErr, updateOrderStatusResult) {
//                   if (updateOrderStatusErr) {
//                     return res.json({
//                       status: false,
//                       message: updateOrderStatusErr.message,
//                     });
//                   }

//                   const responseData = {
//                     status: true,
//                     message:
//                       "Fold process is completed! Please go to the next step",
//                     data: {
//                       customer_id: data[0].user_id,
//                     },
//                   };

//                   return res.json(responseData);
//                 }
//               );
//             }
//           );
//         }
//       );
//     });
//   } catch (error) {
//     res.json({ status: false, message: error.message });
//   }
// };

export const Scan_loads_For_Pack = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const qr_code = req.body.qr_code;
  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      console.log("retyyyouiygtik", data[0].folder_recive_status);
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data[0].folder_recive_status == "1") {
        const verifyStatus = `SELECT * FROM bookings WHERE order_status = '3' AND id = ${data[0].booking_id}`;
        dbConnection.query(verifyStatus, function (verifyerror, verifyResult) {
          if (verifyerror) {
            return res.json({ status: false, message: verifyerror.message });
          } else if (verifyResult.length > 0) {
            const currentTime = time();
            const currentDate = date();
            const pack_scan_timing = `${currentDate} ${currentTime}`;
            const update_Date_Time = `UPDATE booking_timing SET pack_scan_timing = '${pack_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
            dbConnection.query(
              update_Date_Time,
              function (updateTimeErr, updateTimeResult) {
                console.log(updateTimeResult);
                console.log(updateTimeErr);
                if (updateTimeErr) {
                  return res.json({
                    status: false,
                    message: updateTimeErr.message,
                  });
                } else if (updateTimeResult.affectedRows === 1) {
                  return res.json({
                    status: true,
                    message: "Verified successfully!",
                  });
                } else {
                  return res.json({
                    status: false,
                    message: "Failed to update timing",
                  });
                }
              }
            );
          } else {
            return res.json({ status: false, message: "Invalid qr_code!" });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid qr_code!" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const order_histroy = async (req, res) => {
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "Updated successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
};

export const Filter_order_histroy = async (req, res) => {
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "data retrived  successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
};

export const order_histroy_detail= async(req,res)=>{
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const order_id=req.body.order_id;
    const userIdQuery = `
            SELECT  b1.id,b1.user_id FROM bookings AS b1
            JOIN users AS u ON u.id = b1.folder_id
            WHERE u.id = ?`;
    dbConnection.query(
      userIdQuery,
      [folder_id],
      async (error, userIdResult) => {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const userIds = userIdResult.map((row) => row.user_id);
        const bookingIds = userIdResult.map((row) => row.id);

        console.log(userIds, bookingIds, folder_id);
        const query = ` SELECT  b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.pack_images
      FROM bookings AS b
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_images AS bi ON b.id = bi.booking_id 
      WHERE  b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)
        ORDER BY PickUp_date_time DESC`;

        dbConnection.query(
          query,
          [folder_id, userIds, bookingIds],
          (error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id, PickUp_date_time, pack_images } = elem;
                  for (const image of pack_images) {
                    imageArray.push({
                      img_path: image ? `${process.env.HTTPURL}${image}` : "",
                    });
                  }
                  resData.push({
                    Customer_Id,
                    PickUp_date_time,
                    imageArray,
                  });
                }
              }
              return res.json({
                status: true,
                message: "Updated successfully!",
                data: resData,
              });
            }
          }
        );
      }
    );
  }  catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
}

export default {
  Scan_received_loads,
  customer_list_wash,
  wash_detail_ByCustomer_id,
  submit_wash_detail,
  Scan_loads_For_Dry,
 // submit_dry_detail,
  Scan_loads_For_Fold,
//  submit_fold_detail,
  Scan_loads_For_Pack,
  order_histroy,
  Filter_order_histroy,
};
