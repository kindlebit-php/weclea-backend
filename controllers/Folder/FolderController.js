import dbConnection from "../../config/db.js";
import { date, randomNumber, time } from "../../helpers/date.js";
import path from "path";
import dateFormat from 'date-and-time';

import { fcm_notification } from "../../helpers/fcm.js";
import { generatePDF, generateQRCode, getUserData } from "../../helpers/qr_slip.js";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

export const Scan_received_loads = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const { qr_code } = req.body;

  try {
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ?";
    dbConnection.query(verifyQr, [qr_code], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      if (data.length === 0 || data[0].driver_pickup_status === 0 || data[0].folder_receive_status === 1) {
        return res.json({ status: false, message: "Invalid QR code or load status" });
      }
      
      const checkFolderQuery = "SELECT folder_id FROM bookings WHERE id = ?";
      dbConnection.query(checkFolderQuery, [data[0].booking_id], function (folderCheckError, folderCheckData) {
        if (folderCheckError) {
          return res.json({ status: false, message: folderCheckError.message });
        }else if (folderCheckData[0].folder_id === 0) {
          const updateBooking = `UPDATE bookings SET folder_id = ${folder_id} WHERE id = ${data[0].booking_id}`;
          dbConnection.query(updateBooking, function (updateBookingErr, updateBookingResult) {
            if (updateBookingErr) {
              return res.json({ status: false, message: updateBookingErr.message });
            }
            return res.json({ status: true, message: "Load data scanned and updated." });
          });
        } else {
          return res.json({ status: false, message: "Folder is already assigned!" });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


export const Scan_loads_folder = (req, res) => {
  try {
    const userData = res.user;
    const { qr_code, type,bookingId } = req.body;
    const currentTime = time();
    const currentDate = date();
    const wash_scan_timing = `${currentDate} ${currentTime}`;
    const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ? AND booking_id = ?";
    dbConnection.query(verifyQr, [qr_code,bookingId], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      console.log("12323",data)
      if (type >= 0 && type <= 3) {
        if (data.length == 0 || data[0].driver_pickup_status != 1 ) {
          return res.json({ status: false, message: "Invalid QR code or load status" });
        }

        let update_Date_Time2;
        if (type == 0) {
          update_Date_Time2 = `UPDATE booking_timing SET wash_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
        } else if (type == 1) {
          update_Date_Time2 = `UPDATE booking_timing SET dry_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
        } else if (type == 2) {
          update_Date_Time2 = `UPDATE booking_timing SET fold_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
        } else if (type == 3) {
          update_Date_Time2 = `UPDATE booking_timing SET pack_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
        }
        dbConnection.query(update_Date_Time2, function (updateTimeErr, updateTimeResult) {
          if (updateTimeErr) {
            return res.json({ status: false, message: updateTimeErr.message });
          }
          if (updateTimeResult.affectedRows === 1) {
            return res.json({ status: true, message: "Load scanned and updated." });
          }
        });
      } else {
        return res.json({ status: false, message: "Invalid 'type' value" });
      }
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};


// export const Scan_received_loads = (req, res) => {
//   const userData = res.user;
//   const folder_id = userData[0].id;
//   const { qr_code, qr_codeID, type } = req.body;
//   const currentTime = time();
//   const currentDate = date();
//   const wash_scan_timing = `${currentDate} ${currentTime}`;

//   try {
//     const verifyQr = "SELECT * FROM booking_qr WHERE qr_code = ? AND id = ?";
//     dbConnection.query(verifyQr, [qr_code, qr_codeID], function (error, data) {
//       if (error) {
//         return res.json({ status: false, message: error.message });
//       }


//       if (type == 1) {
//         if (data.length == 0 || data[0].driver_pickup_status != 1 || data[0].folder_recive_status != 0) {
//           return res.json({ status: false, message: "Invalid QR code or load status" });
//         }
//         const updateStatus = `UPDATE booking_qr SET folder_recive_status = '1' WHERE id = ${data[0].id}`;
//         const update_Date_Time = `UPDATE booking_timing SET wash_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
//         const updateBooking = `UPDATE bookings SET folder_id = ${folder_id} WHERE id = ${data[0].booking_id}`;

//         dbConnection.query(updateStatus, function (updateerror, updateResult) {
//           if (updateerror) {
//             return res.json({ status: false, message: updateerror.message });
//           }
//           if (updateResult.affectedRows === 1) {
//             dbConnection.query(update_Date_Time, function (updateTimeErr, updateTimeResult) {
//               if (updateTimeErr) {
//                 return res.json({ status: false, message: updateTimeErr.message });
//               }
//               if (updateTimeResult.affectedRows === 1) {
//                 dbConnection.query(updateBooking, function (updateBookingErr, updateBookingResult) {
//                   if (updateBookingErr) {
//                     return res.json({ status: false, message: updateBookingErr.message });
//                   }
//                   return res.json({ status: true, message: "Load scanned and updated." });
//                 });
//               }
//             });
//           }
//         });
//       } else if (type >= 2 && type <= 4) {
//         if (data.length == 0 || data[0].driver_pickup_status != 1 || data[0].folder_recive_status != 1) {
//           return res.json({ status: false, message: "Invalid QR code or load status" });
//         }
//         let update_Date_Time2;
//         let verifyStatus;

//         if (type == 2) {
//           update_Date_Time2 = `UPDATE booking_timing SET dry_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
//           verifyStatus = `SELECT * FROM bookings WHERE order_status = '1' AND id = ${data[0].booking_id}`;
//         } else if (type == 3) {
//           update_Date_Time2 = `UPDATE booking_timing SET fold_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
//           verifyStatus = `SELECT * FROM bookings WHERE order_status = '2' AND id = ${data[0].booking_id}`;
//         } else if (type == 4) {
//           update_Date_Time2 = `UPDATE booking_timing SET pack_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
//           verifyStatus = `SELECT * FROM bookings WHERE order_status = '3' AND id = ${data[0].booking_id}`;
//         }

//         dbConnection.query(verifyStatus, function (verifyStatusErr, verifyStatusResult) {
//           if (verifyStatusErr) {
//             return res.json({ status: false, message: verifyStatusErr.message });
//           }
//           dbConnection.query(update_Date_Time2, function (updateTimeErr, updateTimeResult) {
//             if (updateTimeErr) {
//               return res.json({ status: false, message: updateTimeErr.message });
//             }
//             if (updateTimeResult.affectedRows === 1) {
//               return res.json({ status: true, message: "Load scanned and updated." });
//             }
//           });
//         });
//       } else {
//         return res.json({ status: false, message: "Invalid 'type' value" });
//       }
//     });
//   } catch (error) {
//     res.json({ status: false, message: error.message });
//   }
// };



export const customer_list_wash = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const customer_id = req.body.customer_id;
  try {
    var datetime = new Date();
    const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
    const bookingIdQuery = "SELECT bookings.id FROM bookings left join booking_qr on booking_qr.driver_pickup_status = 1 WHERE bookings.folder_id = '"+folder_id+"' and bookings.date = '"+currentFinalDate+"' and bookings.order_status != 4 and bookings.order_type != 3";
    console.log('bookingIdQuery',bookingIdQuery)
    dbConnection.query(bookingIdQuery, (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }
      const booking_id = userIdResult.map((row) => row.id);
      let query = `SELECT b.id AS Booking_id,b.total_loads,bin.delievery_instruction AS Note_From_Delivery, b.user_id AS Customer_Id, b.date, b.time, b.order_status as orderStatus, bi.pickup_images
                      FROM bookings AS b
                      left JOIN booking_images AS bi ON b.id = bi.booking_id
                      left JOIN booking_instructions AS bin ON b.user_id = bin.user_id
                      WHERE bi.pickup_images IS NOT NULL and b.id IN (?)`;
                      if (customer_id) {
        
                        query += ' AND b.user_id = ?';
                      }
          console.log('querylist',query)
                      dbConnection.query(query, customer_id ? [booking_id, customer_id] : [booking_id], (error, data) => {
                        console.log(data)
        if (error) {
          return res.json({ status: false, message: error.message });
        } else if (data.length == 0) {
          return res.json({ status: false, message: "Data not found" });
        } else {
          const resData = [];
          if (data?.length > 0) {
            for (const elem of data) {
              const {Booking_id,total_loads, Customer_Id,Note_From_Delivery, date, time, orderStatus, pickup_images } = elem;
              if(orderStatus == 8){
                var order_status = 0
              }else{
                var order_status = orderStatus
              }
              console.log('images',pickup_images)
              const separatedStrings = pickup_images.split(",")
              const imagesUrl = separatedStrings.map((val) => {
                return `${process.env.S3_URL}${val}`;
              });
                const imageList = imagesUrl.map(imagePath => ({
                  path: imagePath,
                  type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                })
                )
                 resData.push({
                Booking_id,
                Customer_Id,
                Note_From_Delivery,
                date,
                total_loads,
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
              const separatedStrings = pickup_images.split(",")
              const imagesUrl = separatedStrings.map((val) => {
                return `${process.env.S3_URL}${val}`;
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
      const customerId_Query = "SELECT u.customer_id,bin.delievery_instruction FROM users AS u JOIN booking_instructions AS bin ON u.id = bin.user_id WHERE u.id = ?";
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
      let updateQRtatusQuery;

      if (type == 1) {
        updateDateTimeQuery = `UPDATE booking_timing SET wash_time = ?, wash_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET wash_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        updateQRtatusQuery = "UPDATE booking_qr SET folder_recive_status = ? WHERE booking_id = ?";
      } else if (type == 2) {
        updateDateTimeQuery = `UPDATE booking_timing SET dry_time = ?, dry_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET dry_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        updateQRtatusQuery = "UPDATE booking_qr SET folder_dry_status = ? WHERE booking_id = ?";
        
      } else if (type == 3) {
        updateDateTimeQuery = `UPDATE booking_timing SET fold_time = ?, fold_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET fold_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        updateQRtatusQuery = "UPDATE booking_qr SET folder_fold_status = ? WHERE booking_id = ?";
        
      } else if(type == 4){
        updateDateTimeQuery = `UPDATE booking_timing SET pack_time = ?, pack_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET pack_images = ? WHERE booking_id = ?";
        // updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
       
        if(extra_loads !=''){
          var booking = "select user_id,category_id ,extra_loads,total_loads from bookings where id = '"+booking_id+"'";
          dbConnection.query(booking, function (error, bookingdata) {

          var  qrCountSql = "select count(id) as qrCount from booking_qr where booking_id = '"+booking_id+"' ";
          dbConnection.query(qrCountSql, function (error, qrCountresults){
          if(qrCountresults[0].qrCount > bookingdata[0].total_loads){
              var deleteRecord = (qrCountresults[0].qrCount - bookingdata[0].total_loads)
              var  qrdeleteSql = "delete from booking_qr order by id desc limit "+deleteRecord+"";

              dbConnection.query(qrdeleteSql, function (error, qrdeleteresults){
              })
            }
          })

            if(bookingdata[0].category_id == 1){
              var userLoads = "select commercial as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }else if(bookingdata[0].category_id == 2){
              var userLoads = "select residential as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }else{
              var userLoads = "select yeshiba as totalCount from customer_loads_availabilty where user_id = '"+bookingdata[0].user_id+"'";
            }
                 dbConnection.query(userLoads,async function (error, userLoadsresults){
                    if(Number(userLoadsresults[0].totalCount) >= Number(extra_loads)){
                      var updateLoads = (userLoadsresults[0].totalCount - extra_loads);
                      if(bookingdata[0].category_id == 1){
                      var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                      }else if(bookingdata[0].category_id == 2){
                      var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                      }else{
                      var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"' ";
                      }
                      dbConnection.query(usrLoadsup,async function (error, result) {
                      })


                      const qrCodesArray = [];
                      const insertIds=[]
                      for (var i = 0; extra_loads > i; i++) {
                        var sql = "INSERT INTO booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                      
        await new Promise((resolve, reject) => {
          dbConnection.query(sql, function (err, results) {
              if (err) {
                  reject(err);
              } else {
                  const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                  dbConnection.query(sql2, function (err, result1) {
                      if (err) {
                          reject(err);
                      } else {
                          qrCodesArray.push(result1[0].qr_code);
                          insertIds.push(results.insertId);
                          resolve();
                      }
                  });
              }
          });
      });
  }
                              console.log("All QR codes:", qrCodesArray);
                              const qr_codes = qrCodesArray.join(",")
                              console.log(qr_codes,"after all qrcode")
                      const getAll_qrCode= await generateQRCode(qrCodesArray)
                      const userData1 = await getUserData(booking_id);
                      console.log(userData1)
                      const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                      
                      console.log(pdfBytes)
                      const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                dbConnection.query(updatePdf, async function (err, result2) {
                                console.log(result2);
                                    });

                const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.key);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                dbConnection.query(extraSQL, function (error, userLoadsresultss){
                })
                  const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                  dbConnection.query(updateBooking, function (err, results) {
                  })
                  var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
              return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads: Number(totalPrintLoads)}});


                    }else{
                      const users = "select card_status from users where id = '"+bookingdata[0].user_id+"'"
                      dbConnection.query(users,async function (error, usersresult) {
                        if(usersresult[0].card_status == 1){
                          console.log('enter card status')
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
                            console.log('payemnt success')

                            const qrCodesArray = [];
                            const insertIds=[]
                            for (var i = 0; extra_loads > i; i++) {
                        console.log('reached at qr code')
                        var sqlQR = "INSERT INTO booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                        await new Promise((resolve, reject) => {
                          dbConnection.query(sql, function (err, results) {
                              if (err) {
                                  reject(err);
                              } else {
                                  const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                                  dbConnection.query(sql2, function (err, result1) {
                                      if (err) {
                                          reject(err);
                                      } else {
                                          qrCodesArray.push(result1[0].qr_code);
                                          insertIds.push(results.insertId);
                                          resolve();
                                      }
                                  });
                              }
                          });
                      });
                  }
                                              console.log("All QR codes:", qrCodesArray);
                                              const qr_codes = qrCodesArray.join(",")
                                              console.log(qr_codes,"after all qrcode")
                                      const getAll_qrCode= await generateQRCode(qrCodesArray)
                                      const userData1 = await getUserData(booking_id);
                                      console.log(userData1)
                                      const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                      
                                      console.log(pdfBytes)
                                      const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                                dbConnection.query(updatePdf, async function (err, result2) {
                                                console.log(result2);
                                                    });
                
                            const currentDate = date(); 
                            const sqls = `INSERT INTO payment (user_id,booking_id, amount, payment_id, date) VALUES ('${
                              data[0].user_id}', '${booking_id}', '${amount}', '${paymentIntent.id}', '${currentDate}')`;

                            dbConnection.query(sqls, function (error, result) {
                                  });
                  const imageArray = [];
                  req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.key);
                  });
                  if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                  }
                  const pickupImagesJSON = imageArray.join(", ");

                  var extraSQL = "UPDATE booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                  dbConnection.query(extraSQL, function (error, userLoadsresultss){
                  })

                            const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                  dbConnection.query(updateBooking, function (err, results) {
                  })
 var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
            return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads:Number(totalPrintLoads) }});
                            // res.json({'status':true,"message":"pack",'data':bookingdata[0].user_id});                        
                          }else{
                          if(userLoadsresults[0].totalCount > 0){

                            var updateLoads = (userLoadsresults[0].totalCount - extra_loads);
                          }else{
                            var removeV = userLoadsresults[0].totalCount.replace("-","")
                            var updateLoadsRe = (removeV + extra_loads);
                            var updateLoads = '-'+updateLoadsRe

                          }
                          if(bookingdata[0].category_id == 1){
                          var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else if(bookingdata[0].category_id == 2){
                          var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"'";
                          }else{
                          var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+bookingdata[0].user_id+"' ";
                          }
                          dbConnection.query(usrLoadsup, function (error, result) {
                          })

                          const qrCodesArray = [];
                          const insertIds=[]
                        for (var i = 0; extra_loads > i; i++) {
                            // var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                            var sql = "INSERT INTO booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                            
                            await new Promise((resolve, reject) => {
                              dbConnection.query(sql, function (err, results) {
                                  if (err) {
                                      reject(err);
                                  } else {
                                      const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                                      dbConnection.query(sql2, function (err, result1) {
                                          if (err) {
                                              reject(err);
                                          } else {
                                              qrCodesArray.push(result1[0].qr_code);
                                              insertIds.push(results.insertId);
                                              resolve();
                                          }
                                      });
                                  }
                              });
                          });
                      }
                                                  console.log("All QR codes:", qrCodesArray);
                                                  const qr_codes = qrCodesArray.join(",")
                                                  console.log(qr_codes,"after all qrcode")
                                          const getAll_qrCode= await generateQRCode(qrCodesArray)
                                          const userData1 = await getUserData(booking_id);
                                          console.log(userData1)
                                          const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                          
                                          console.log(pdfBytes)
                                          const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                                    dbConnection.query(updatePdf, async function (err, result2) {
                                                    console.log(result2);
                                                        });
                    

                          const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.key);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                dbConnection.query(extraSQL, function (error, userLoadsresultss){
                })

                        const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                  dbConnection.query(updateBooking, function (err, results) {
                  })
                          }
 var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
            return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads:Number(totalPrintLoads) }});
                      

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

                          const qrCodesArray = [];
                          const insertIds=[]
                        for (var i = 0; extra_loads > i; i++) {
                            // var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                            var sql = "INSERT INTO booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                            
                            await new Promise((resolve, reject) => {
                              dbConnection.query(sql, function (err, results) {
                                  if (err) {
                                      reject(err);
                                  } else {
                                      const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                                      dbConnection.query(sql2, function (err, result1) {
                                          if (err) {
                                              reject(err);
                                          } else {
                                              qrCodesArray.push(result1[0].qr_code);
                                              insertIds.push(results.insertId);
                                              resolve();
                                          }
                                      });
                                  }
                              });
                          });
                      }
                                                  console.log("All QR codes:", qrCodesArray);
                                                  const qr_codes = qrCodesArray.join(",")
                                                  console.log(qr_codes,"after all qrcode")
                                          const getAll_qrCode= await generateQRCode(qrCodesArray)
                                          const userData1 = await getUserData(booking_id);
                                          console.log(userData1)
                                          const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                          
                                          console.log(pdfBytes)
                                          const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                                    dbConnection.query(updatePdf, async function (err, result2) {
                                                    console.log(result2);
                                                        });
                    
                          const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.key);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                dbConnection.query(extraSQL, function (error, userLoadsresultss){
                })
                            const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                        dbConnection.query(updateBooking, function (err, results) {
                        })
 var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
            return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads:Number(totalPrintLoads) }});
                       
                        }

                      })
                    }
                 })
          })
        }else{

      
          var booking = "select user_id,total_loads from bookings where id = '"+booking_id+"'";
          dbConnection.query(booking, function (error, bookingdata) {

          var  qrCountSql = "select count(id) as qrCount from booking_qr where booking_id = '"+booking_id+"' ";
        dbConnection.query(qrCountSql, function (error, qrCountresults){
        if(qrCountresults[0].qrCount > bookingdata[0].total_loads){
          var deleteRecord = (qrCountresults[0].qrCount - bookingdata[0].total_loads)
          var  qrdeleteSql = "delete from booking_qr order by id desc limit "+deleteRecord+"";
          dbConnection.query(qrdeleteSql, function (error, qrdeleteresults){
          })
        }
        })

        updateDateTimeQuery = `UPDATE booking_timing SET pack_time = ?, pack_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE booking_images SET pack_images = ? WHERE booking_id = ?";
        // updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        const imageArray = [];
        req.files.images.forEach((e, i) => {
        imageArray.push(e.key);
        });
        const pickupImagesJSON = imageArray.join(", ");
        dbConnection.query(updateDateTimeQuery, [currentTime, currentDate, booking_id], function (updateTimeErr, updateTimeResult) {
        })
        dbConnection.query(updatePickupImagesQuery, [pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
        })
 var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
            return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads:Number(totalPrintLoads) }});
      })

        }
      }
     if(type != 4){

      
console.log('updateQRtatusQueryss',updateQRtatusQuery)
      dbConnection.query(updateQRtatusQuery, [1, booking_id], function (updateQRErr, updateQRResult) {
        console.log('updateQRResult',updateQRResult)
      })
      dbConnection.query(updateDateTimeQuery, [currentTime, currentDate, booking_id], function (updateTimeErr, updateTimeResult) {
        if (updateTimeErr) {
          return res.json({ status: false, message: updateTimeErr.message });
        }
        const imageArray = [];
        req.files.images.forEach((e, i) => {
          imageArray.push(e.key);
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
              data: { customer_id: data[0].user_id , Note_From_Delivery:data1[0].delievery_instruction },
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
    }
    });
    });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};



export const print_extra_loads_QrCode = async (req, res) => {
  try {
    const userData = res.user;
    const booking_id = req.body.booking_id;
    const data = `SELECT id AS qr_codeID, qr_code, folder_pack_status FROM booking_qr WHERE driver_pickup_status = '1' AND folder_recive_status = '1' AND folder_dry_status = '1' AND folder_fold_status = '1' AND booking_id = ?`;

    dbConnection.query(data, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else {
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i].folder_pack_status === 1) {
            count++;
          }
        }
        const total_qr_code=data.map((row) => row.qr_code);
        const customerId_Query = "SELECT b.user_id AS customer_id,bin.delievery_instruction AS Note_From_Delivery FROM bookings AS b JOIN booking_instructions AS bin ON b.user_id = bin.user_id WHERE b.id = ?";
        if ( total_qr_code.length === count) {
          // let updateOrderStatusQuery = "UPDATE bookings SET order_status = 4 WHERE id = ?";
          // dbConnection.query(updateOrderStatusQuery, [booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
          //   if (updateOrderStatusErr) {
          //     return res.json({ status: false, message: updateOrderStatusErr.message });
          //   }
           
      dbConnection.query(customerId_Query, [booking_id], function (error, data1) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        const Customer_Id=data1[0].customer_id;
        const Note_From_Delivery=data1[0].Note_From_Delivery;
        const combinedResponse = {
          status: true,
          message: "Data retrieved and order status updated successfully!",
          Customer_Id,Note_From_Delivery,
          scanned_qr_code:count,
          data
        };
        return res.json(combinedResponse);

      })
            
        } else {
          dbConnection.query(customerId_Query, [booking_id], function (error, data1) {
            if (error) {
              return res.json({ status: false, message: error.message });
            }
            const Customer_Id=data1[0].customer_id;
            const Note_From_Delivery=data1[0].Note_From_Delivery;
            const combinedResponse = {
              status: true,
              message: "Data retrieved successfully!",
              Customer_Id,Note_From_Delivery,
              scanned_qr_code:count,
              data
            };
            return res.json(combinedResponse);
    
          })
        }
      }
    });
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};


export const scanning_extra_loads = async (req, res) => {
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

        if (data.length > 0 && data[0].folder_fold_status === 1) {
          const updateStatus = `UPDATE booking_qr SET folder_pack_status = '1' WHERE id = ${data[0].id}`;

          dbConnection.query(updateStatus,function (updateerror, updateResult) {
              if (updateerror) {
                return res.json({status: false,message: updateerror.message,});
              }
              const result = {
                booking_id: data[0].booking_id,
                qrCode_id: data[0].id,
                folder_pack_status: 1,
              };
              res.json({
                status: true,
                message: "Data scanned and updated successfully!",
                data: result,
              });
            }
          );
        } else {
          res.json({ status: false, message: "data not processed" });
        }
      } 
    );
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
//             imageArray.push(e.key);
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
//             imageArray.push(e.key);
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
    const {date,orderId}= req.body
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
        let query = `SELECT b.id AS BookingId, u.name,b.order_status, b.order_id, b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time, b.date, bi.pack_images
          FROM bookings AS b
          JOIN users AS u ON b.user_id = u.id
          JOIN booking_images AS bi ON b.id = bi.booking_id 
          WHERE b.order_status = '4' AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)`;

        const queryParams = [folder_id, userIds, bookingIds];

        if (date) {
          query += ' AND b.date = ?';
          queryParams.push(date);
        }

        if (orderId) {
          query += ' AND b.order_id = ?';
          queryParams.push(orderId);
        }

        query += ' ORDER BY PickUp_date_time DESC';
      
  
        dbConnection.query(query,queryParams,(error, data) => {
          console.log(data)
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const resData = [];
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  let {BookingId,name,order_status, Customer_Id, PickUp_date_time, pack_images } = elem;
                  const separatedStrings = pack_images.split(",")
                  const imagesUrl = separatedStrings.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList = imagesUrl.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    if (order_status === 1) {
                      order_status = "wash";
                    } else if (order_status === 2) {
                      order_status = "dry";
                    } else if (order_status === 3) {
                      order_status = "fold";
                    } else if (order_status === 4) {
                      order_status = "pack";
                    } else {
                      order_status = "NA";
                    }
                  resData.push({
                    BookingId,
                    name,
                    order_status,
                    Customer_Id,
                    PickUp_date_time,
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
    const BookingId=req.body.BookingId;
   
        const query = `SELECT  b.user_id AS Customer_Id,cda.address,cda.zip AS Zip_Code,u.mobile,CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.wash_images,bi.dry_images,bi.fold_images,bi.pack_images,bt.wash_date,bt.wash_time,bt.dry_date,bt.dry_time,bt.fold_date,bt.fold_time,bt.pack_date,bt.pack_time
      FROM bookings AS b
      JOIN customer_drop_address AS cda ON b.user_id = cda.user_id
      JOIN users AS u ON b.user_id = u.id
      JOIN booking_timing AS bt ON b.id = bt.booking_id
      JOIN booking_images AS bi ON b.id = bi.booking_id
      WHERE  b.id = ? ORDER BY PickUp_date_time DESC`;

        dbConnection.query(query,[BookingId],(error, data) => {
            console.log(data);
            if (error) {
              return res.json({ status: false, message: error.message });
            } else if (data.length < 0) {
              return res.json({ status: false, message: "data not found" });
            } else {
              const imageArray = [];
              if (data?.length > 0) {
                for (const elem of data) {
                  const { Customer_Id,address,Zip_Code,mobile,PickUp_date_time,wash_images,dry_images,fold_images, pack_images,wash_date,wash_time,dry_date,dry_time,fold_date,fold_time,pack_date,pack_time } = elem;
                  const separatedStrings1 = wash_images.split(",")
                  const imagesUrl1 = separatedStrings1.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList1 = imagesUrl1.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings2 = dry_images.split(",")
                  const imagesUrl2 = separatedStrings2.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList2 = imagesUrl2.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings3 = fold_images.split(",")
                  const imagesUrl3 = separatedStrings3.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList3 = imagesUrl3.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings4 = pack_images.split(",")
                  const imagesUrl4 = separatedStrings4.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList4 = imagesUrl4.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const laundry_detail = [
                      {
                        title: "Wash",
                        imageList: imageList1,
                        date: wash_date,
                        time: wash_time
                      },
                      {
                        title: "Dry",
                        imageList: imageList2,
                        date: dry_date,
                        time: dry_time
                      },
                      {
                        title: "Fold",
                        imageList: imageList3,
                        date: fold_date,
                        time: fold_time
                      },
                      {
                        title: "Pack",
                        imageList: imageList4,
                        date: pack_date,
                        time: pack_time
                      }
                    ];
                    

                  const resData={Customer_Id,
                    address,
                    Zip_Code,
                    mobile,
                    PickUp_date_time,
                    laundry_detail}
                    return res.json({
                      status: true,
                      message: "Updated successfully!",
                      data: resData,
                    });
                }
              }
            }
          }
        );
  }  catch (error) {
    console.log(error.message);
    res.json({ status: false, message: error.message });
  }
}


export default {
  Scan_received_loads,
  Scan_loads_folder,
  customer_list_wash,
  wash_detail_ByCustomer_id,
  submit_wash_detail,
  print_extra_loads_QrCode,
  scanning_extra_loads,
  Scan_loads_For_Dry,
 // submit_dry_detail,
  Scan_loads_For_Fold,
//  submit_fold_detail,
  Scan_loads_For_Pack,
  order_histroy,
  order_histroy_detail
};
