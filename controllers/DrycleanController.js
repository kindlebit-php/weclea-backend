import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import { generatePDF, generateQRCode, getUserData } from '../helpers/qr_slip.js';
import { date, getDates,randomNumber,randomNumberDryClean, time} from "../helpers/date.js";
import { fcm_notification } from '../helpers/fcm.js';
import path from "path";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

export const get_category = async (req, res) => {
    try {
      var resData = [];
    const category = `SELECT id, title, price, note, image FROM dry_clean_services WHERE status = 1  and isDelete = 0`;
      dbConnection.query(category, function (error, data) {
        if (error) throw error;
        const dryCleanChares = `SELECT dry_clean_charges FROM settings `;
        dbConnection.query(dryCleanChares, function (error, dryCleanCharesdata) {
          data.forEach(element =>
          {
            const {id,title,price,image,note} = element;
            if(image){
              var img = process.env.S3_URL+image;
            }else{
              var img = process.env.BASE_URL+'/uploads/pants.jpg';
            }
            const initi = {
            "id":id,"title":title,'note':note,"price":price,"image":img
            }
            resData.push(initi);
          });
            res.json({'status':true,"message":"Category retrieved successfully!",'data': resData,'dry_clean_min_amount':dryCleanCharesdata[0].dry_clean_charges});
      });
      });

    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };

  export const Add_To_Cart = async (req, res) => {
    try {
      const userData = res.user;
      // console.log(userData);
      const { id ,price,qty} = req.body;
        const category = "SELECT count(id) as total FROM cart WHERE user_id = '"+userData[0].id+"' and service_id = '"+id+"' and status = '0'";
        dbConnection.query(category, function (error, data) {
          if(data[0].total > 0){
            const updateService = "update cart set quantity = '"+qty+"' ,amount = '"+price+"' where user_id = '"+userData[0].id+"' and service_id = '"+id+"' and status = '0'";
          console.log(updateService)
           dbConnection.query(updateService, function (error, data) {
             if(error) throw error;
                res.json({'status':true,"message":"cart updated successfully"});
                
              
            });
          }else{
            const insertService = "INSERT INTO cart (user_id,service_id, quantity, amount) VALUES ( '"+userData[0].id+"', '"+id+"', '"+qty+"', '"+price+"')";
            console.log('insertService',insertService)
            dbConnection.query(insertService, function (insertError) {
             
              res.json({'status':true,"message":"Items added to cart successfully"});
                
            });
          }
          
       });
      
    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };
  
  
  export const delete_cart_item = async (req, res) => {
    try {
       const userData = res.user;
      const { id } = req.body;
         const updateService = "delete from cart where id = '"+id+"'";
           dbConnection.query(updateService, function (error, data) {
             if(error) throw error;
        res.json({'status':true,"message":"Item deleted successfully"});
                
              
            });
    }catch (error) {
      res.json({ status: false, message: error.message });
    }
  }
   
  export const get_cart_items = async (req, res) => {
    try {
       const userData = res.user;
        const items = "SELECT cart.service_id ,cart.id,dry_clean_services.title,cart.amount,cart.quantity FROM cart LEFT JOIN dry_clean_services ON cart.service_id = dry_clean_services.id WHERE cart.user_id = '"+userData[0].id+"' and cart.status = '0'";
        
          dbConnection.query(items, function (error, data) {
             if(error) throw error;
          res.json({'status':true,"message":"Item list",'data':data});
                
              
            });
    }catch (error) {
      res.json({ status: false, message: error.message });
    }
  }

  export const dry_clean_booking = async (req, res) => {
    try {
        const userData = res.user;
        const {date,amount,payment_id} = req.body;
        if(date && amount){
        let dateObject = new Date();
        let hours = dateObject.getHours();
        let minutes = dateObject.getMinutes();
        const current_time = hours + ":" + minutes;
        const oneTimeDate = dateFormat.format(new Date(date),'YYYY-MM-DD');
         const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
        dbConnection.query(custmer_address, function (error, custmeraddressResult) {
          var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 and status = 1 ORDER BY distance) as vt where vt.distance < 25 order by distance asc;";
          dbConnection.query(sqlDistance, function (error, locationResult) {
            console.log('list of driver',locationResult)
          if(locationResult.length > 0){
            var driver_id = locationResult[0].id
          }else{
            var driver_id = 0
          }
        var sql = "INSERT INTO bookings (user_id,date,time,order_type,driver_id,category_id,total_amount,total_loads) VALUES ('"+userData[0].id+"','"+oneTimeDate+"', '"+current_time+"',3,'"+driver_id+"','"+userData[0].category_id+"','"+amount+"',1)";

        dbConnection.query(sql, function (err, result) {
        if(result){

        if(payment_id != ''){
          var paymentsql = "update payment set booking_id = '"+result.insertId+"'where id = '"+payment_id+"'";
          dbConnection.query(paymentsql, function (err,paymentResult ) {

          });
        }

        var order_id = '1001'+result.insertId;
        var sql = "update bookings set order_id = '"+order_id+"'where id = '"+result.insertId+"'";
        dbConnection.query(sql, function (err, resultss) {

        });

        var bookingsql = "INSERT INTO dry_clean_booking_images (booking_id) VALUES ('"+result.insertId+"')";
        dbConnection.query(bookingsql, function (err, bookingresult) {                        
        });

        var bookingsql = "INSERT INTO dry_clean_booking_timing (booking_id) VALUES ('"+result.insertId+"')";
        dbConnection.query(bookingsql, function (err, bookingresult) {
        });

       
        var qrSQL = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumberDryClean(result.insertId)+"')";
        dbConnection.query(qrSQL, function (err, results) {
        if(results){
          var sql2= `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`
          dbConnection.query(sql2, async function (err, result1) {
          const qr_codes = result1.map((row) => row.qr_code);
          const getAll_qrCode= await generateQRCode(qr_codes)
          const userData1 = await getUserData (result.insertId);
          const pdfBytes = await generatePDF(userData1, getAll_qrCode);
          // const match = pdfBytes.match(/uploads\\(.+)/);
          // const newPath = 'uploads//' +match[1];
          const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id = ${results.insertId}`;
          dbConnection.query(updatePdf, async function (err, result2) {
          })
          });
        }
        });     
                        
        const updateService = "update cart set booking_id = '"+result.insertId+"' where user_id = '"+userData[0].id+"' and status = '0'";
        dbConnection.query(updateService, function (error, data) {
             if(error) throw error;
              res.json({'status':true,"message":"booking created successfully",'booking_id':result.insertId, 'card_status':userData[0].card_status});  
              
            });
        }else{
            res.json({'status':false,"message":err.sqlMessage});

        }
        });
        });   
        });        
        }else{
            res.json({'status':false,"message":"All fields are required"});
      }             
    }catch (error) {
      res.json({ status: false, message: error.message });
    }
  }

  //-------------------------------------------------------------------------------------------------------------------------------//
  //-------------------------------------------------------------------------------------------------------------------------------//
  //-------------------------------------------------------------------------------------------------------------------------------//
  export const Scan_dryClean_received_loads = (req, res) => {
    const userData = res.user;
    const folder_id = userData[0].id;
    const { qr_code } = req.body;
  
    try {
      const verifyQr = "SELECT * FROM dry_clean_booking_qr WHERE qr_code = ?";
      dbConnection.query(verifyQr, [qr_code], function (error, data) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        if (data.length === 0 || data[0].driver_pickup_status === 0 || data[0].tagging_status === 1) {
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
  
  export const Scan_loads_dry_clean = (req, res) => {
    try {
      const userData = res.user;
      const { qr_code, type } = req.body;
      const currentTime = time();
      const currentDate = date();
      const wash_scan_timing = `${currentDate} ${currentTime}`;
  
      const verifyQr = "SELECT * FROM dry_clean_booking_qr WHERE qr_code = ?";
      dbConnection.query(verifyQr, [qr_code], function (error, data) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
  
        if ((type == 0) || (type >= 9 && type <= 13)) {
          if (data.length === 0 || data[0].driver_pickup_status !== 1 ) {
            return res.json({ status: false, message: "Invalid QR code or load status" });
          }
  
          let update_Date_Time2;
  
          if (type == 0) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET tagging_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          } else if (type == 9) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET spotting_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          } else if (type == 10) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET cleaning_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          } else if (type == 11) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET inspect_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          } else if (type == 12) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET press_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
          } else if (type == 13) {
            update_Date_Time2 = `UPDATE dry_clean_booking_timing SET package_scan_timing = '${wash_scan_timing}' WHERE booking_id = ${data[0].booking_id}`;
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


export const customer_list_dryClean = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const customer_id = req.body.customer_id;
  try {
    var datetime = new Date();
    const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
    const bookingIdQuery = "SELECT bookings.id FROM bookings left join dry_clean_booking_qr on dry_clean_booking_qr.driver_pickup_status = 1 WHERE bookings.folder_id = '"+folder_id+"' and bookings.date = '"+currentFinalDate+"' and bookings.order_status != 4 and bookings.order_type != 1 and bookings.order_type != 2";
    console.log('bookingIdQuery',bookingIdQuery)
    dbConnection.query(bookingIdQuery, (error, userIdResult) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      }
      if (userIdResult.length === 0) {
        return res.json({ status: false, message: "User has no bookings" });
      }
      const booking_id = userIdResult.map((row) => row.id);
      let query = `SELECT b.id AS Booking_id,b.total_loads,bin.pickup_instruction AS Note_From_Delivery, b.user_id AS Customer_Id, b.date, b.time, b.order_status as orderStatus, bi.pickup_images
                      FROM bookings AS b
                      left JOIN dry_clean_booking_images AS bi ON b.id = bi.booking_id
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
            message: "Retrieved successfully!",
            data: resData,
          });
        }
      });
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

export const submit_dryClean_process_detail = async (req, res) => {
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
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET tagging_time = ?, tagging_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET tagging_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = 9 WHERE id = ?";
        updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET tagging_status = ? WHERE booking_id = ?";
      } else if (type == 2) {
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET spotting_time = ?, spotting_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET spoting_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = 10 WHERE id = ?";
        updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET spotting_status = ? WHERE booking_id = ?";
        
      } else if (type == 3) {
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET cleaning_time = ?, cleaning_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET cleaning_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = 11 WHERE id = ?";
        updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET cleaning_status = ? WHERE booking_id = ?";
        
      }else if (type == 4) {
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET inspect_time = ?, inspect_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET inspect_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = 12 WHERE id = ?";
        updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET inspect_status = ? WHERE booking_id = ?";
        
      }else if (type == 5) {
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET press_time = ?, press_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET press_images = ? WHERE booking_id = ?";
        updateOrderStatusQuery = "UPDATE bookings SET order_status = 13 WHERE id = ?";
        updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET press_status = ? WHERE booking_id = ?";
        
      }else if(type == 6){
        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET package_time = ?, package_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET package_images = ? WHERE booking_id = ?";
        // updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
       
        if(extra_loads !=''){
          var booking = "select user_id,category_id ,extra_loads,total_loads from bookings where id = '"+booking_id+"'";
          dbConnection.query(booking, function (error, bookingdata) {

          var  qrCountSql = "select count(id) as qrCount from dry_clean_booking_qr where booking_id = '"+booking_id+"' ";

          dbConnection.query(qrCountSql, function (error, qrCountresults){
          if(qrCountresults[0].qrCount > bookingdata[0].total_loads){
              var deleteRecord = (qrCountresults[0].qrCount - bookingdata[0].total_loads)
              var  qrdeleteSql = "delete from dry_clean_booking_qr order by id desc limit "+deleteRecord+"";
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
                 dbConnection.query(userLoads, function (error, userLoadsresults){
                    if(Number(userLoadsresults[0].totalCount) >= Number(extra_loads)){
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
                        var sql = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,tagging_status,spotting_status,cleaning_status,inspect_status,press_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1,1,1)";
                        dbConnection.query(sql, function (err, results) {
                          if(results){
                            var sql2= `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`
                            dbConnection.query(sql2, async function (err, result1) {
                              const qr_codes = result1.map((row) => row.qr_code);
                              const getAll_qrCode= await generateQRCode(qr_codes)
                              const userData1 = await getUserData(booking_id);
                              const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                              // const match = pdfBytes.match(/uploads\\(.+)/);
                              // const newPath = 'uploads//' +match[1];
                              const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id = ${results.insertId}`;
                              dbConnection.query(updatePdf, async function (err, result2) {
                               
                              })
                            });
                          }
                        });     
                      }

                const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE dry_clean_booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
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


                            for (var i = 0; extra_loads > i; i++) {
                        console.log('reached at qr code')
                        var sqlQR = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,tagging_status,spotting_status,cleaning_status,inspect_status,press_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1,1,1)";
                        dbConnection.query(sqlQR, function (err, results) {
                          if(results){
                            var sql2= `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`
                            dbConnection.query(sql2, async function (err, result1) {
                              const qr_codes = result1.map((row) => row.qr_code);
                              const getAll_qrCode= await generateQRCode(qr_codes)
                              const userData1 = await getUserData(booking_id);
                              const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                              // const match = pdfBytes.match(/uploads\\(.+)/);
                              // const newPath = 'uploads//' +match[1];
                              const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id = ${results.insertId}`;
                              dbConnection.query(updatePdf, async function (err, result2) {
                               
                              })
                            });
                          }
                        });     
                      }

                            const currentDate = date(); 
                            const sqls = `INSERT INTO payment (user_id,booking_id, amount, payment_id, date) VALUES ('${
                              data[0].user_id}', '${booking_id}', '${amount}', '${paymentIntent.id}', '${currentDate}')`;

                            dbConnection.query(sqls, function (error, result) {
                                  });
                  const imageArray = [];
                  req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.path);
                  });
                  if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                  }
                  const pickupImagesJSON = imageArray.join(", ");

                  var extraSQL = "UPDATE dry_clean_booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                  dbConnection.query(extraSQL, function (error, userLoadsresultss){
                  })

                            const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                  dbConnection.query(updateBooking, function (err, results) {
                  })
                  var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
                  return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads: Number(totalPrintLoads)}});
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
                        for (var i = 0; extra_loads > i; i++) {
                          var sql = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,tagging_status,spotting_status,cleaning_status,inspect_status,press_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1,1,1)";
                            //var sqlQR = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                            
                            dbConnection.query(sql, function (err, results) {
                              if(results){
                                var sql2= `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`
                                dbConnection.query(sql2, async function (err, result1) {
                                  const qr_codes = result1.map((row) => row.qr_code);
                                  const getAll_qrCode= await generateQRCode(qr_codes)
                                  const userData1 = await getUserData (booking_id);
                                  const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                  // const match = pdfBytes.match(/uploads\\(.+)/);
                                  // const newPath = 'uploads//' +match[1];
                                  const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id = ${results.insertId}`;
                                  dbConnection.query(updatePdf, async function (err, result2) {
                                  })
                                });
                              }
                            });     
                        }

                          const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE dry_clean_booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                dbConnection.query(extraSQL, function (error, userLoadsresultss){
                })

                        const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                  dbConnection.query(updateBooking, function (err, results) {
                  })
                          }
                          var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
                          return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads: Number(totalPrintLoads)}});
                      

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
                            // var sql = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"')";
                            var sql = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,tagging_status,spotting_status,cleaning_status,inspect_status,press_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1,1,1)";
                            //var sql = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code,driver_pickup_status,folder_recive_status,folder_dry_status,folder_fold_status) VALUES ('"+booking_id+"','"+randomNumber(booking_id)+"',1,1,1,1)";
                            
                            dbConnection.query(sql, function (err, results) {
                              if(results){
                                var sql2= `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`
                                dbConnection.query(sql2, async function (err, result1) {
                                  const qr_codes = result1.map((row) => row.qr_code);
                                  const getAll_qrCode= await generateQRCode(qr_codes)
                                  const userData1 = await getUserData (booking_id);
                                  const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                  // const match = pdfBytes.match(/uploads\\(.+)/);
                                  // const newPath = 'uploads//' +match[1];
                                  const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id = ${results.insertId}`;
                                  dbConnection.query(updatePdf, async function (err, result2) {
                                  })
                                });
                              }
                            });     
                        }
                          const imageArray = [];
                req.files.extra_loads_images.forEach((e, i) => {
                  imageArray.push(e.path);
                });
                if (imageArray.length > 5) {
                  return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                const pickupImagesJSON = imageArray.join(", ");

                var extraSQL = "UPDATE dry_clean_booking_images SET extra_load_images = '"+pickupImagesJSON+"' WHERE booking_id = '"+booking_id+"'";
                dbConnection.query(extraSQL, function (error, userLoadsresultss){
                })
                            const updateBooking = "UPDATE bookings SET extra_loads = '"+extra_loads+"' WHERE id = '"+booking_id+"'";
                        dbConnection.query(updateBooking, function (err, results) {
                        })
                        var totalPrintLoads = (Number(bookingdata[0].total_loads) + Number(extra_loads))
                        return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads: Number(totalPrintLoads)}});
                       
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

        updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET package_time = ?, package_date = ? WHERE booking_id = ?`;
        updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET package_images = ? WHERE booking_id = ?";
        // updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
        const imageArray = [];
        req.files.images.forEach((e, i) => {
        imageArray.push(e.path);
        });
        const pickupImagesJSON = imageArray.join(", ");
        dbConnection.query(updateDateTimeQuery, [currentTime, currentDate, booking_id], function (updateTimeErr, updateTimeResult) {
        })
        dbConnection.query(updatePickupImagesQuery, [pickupImagesJSON, booking_id], function (updateImagesErr, updateImagesResult) {
        })
          return res.json({ status: true,message: 'package',data: { customer_id: bookingdata[0].user_id,total_loads: parseInt(bookingdata[0]?.total_loads)}});
      })

        }
      }
     if(type != 6){

      
console.log('updateQRtatusQueryss',updateQRtatusQuery)
      dbConnection.query(updateQRtatusQuery, [1, booking_id], function (updateQRErr, updateQRResult) {
        console.log('updateQRResult',updateQRResult)
      })
      dbConnection.query(updateDateTimeQuery, [currentTime, currentDate, booking_id], function (updateTimeErr, updateTimeResult) {
        if (updateTimeErr) {
          return res.json({ status: false, message: updateTimeErr.message });
        }
// console.log('req.files',req.files)
        const imageArray = [];
        req.files.images.forEach((e, i) => {
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
     
          dbConnection.query(updateOrderStatusQuery, [ booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
            if (updateOrderStatusErr) {
              return res.json({ status: false, message: updateOrderStatusErr.message });
            }
            const processMessages = {
              1: "Tagging process is completed! Please go to the next step",
              2: "Spoting process is completed! Please go to the next step",
              3: "Cleaning process is completed! Please go to the next step",
              4: "Inspect process is completed! Please go to the next step",
              5: "Press process is completed! Please go to the next step",
              6: "Package process is completed order is ready to pickup"
            };

            const responseData = {
              status: true,
              message: processMessages[type],
              data: { customer_id: data[0].user_id , Note_From_Delivery:data1[0].delievery_instruction },
            };
            const title={
              1: "loads Tagging",
              2: "loads Spoting",
              3: "loads Cleaning",
              4: "loads Inspect",
              5: "loads Press",
              6: "loads Package"
            }
            const body={
              1: "Tagging process is completed!",
              2: "Spoting process is completed! ",
              3: "Cleaning process is completed! ",
              4: "Inspect process is completed! ",
              5: "Press process is completed! ",
              6: "Package process is completed! "
            };
            const fold_type={
              1: "Tagging",
              2: "Spoting",
              3: "Cleaning",
              4: "Inspect",
              5: "Press",
              6: "Package",
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
    console.log("error",error.message)
    res.json({ status: false, message: error.message });
  }
};

export const print_DryClean_extra_loads_QrCode = async (req, res) => {
  try {
    const userData = res.user;
    const booking_id = req.body.booking_id;
    const data = `SELECT id AS qr_codeID, qr_code, package_status FROM dry_clean_booking_qr WHERE driver_pickup_status = '1' AND tagging_status = '1' AND spotting_status = '1' AND cleaning_status = '1' AND inspect_status = '1'AND press_status = '1' AND booking_id = ?`;

    dbConnection.query(data, [booking_id], function (error, data) {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else {
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i].package_status === 1) {
            count++;
          }
        }
        const total_qr_code=data.map((row) => row.qr_code);
        const customerId_Query = "SELECT b.user_id AS customer_id,bin.delievery_instruction AS Note_From_Delivery FROM bookings AS b JOIN booking_instructions AS bin ON b.user_id = bin.user_id WHERE b.id = ?";
        if ( total_qr_code.length === count) {
          let updateOrderStatusQuery = "UPDATE bookings SET order_status = 4 WHERE id = ?";
          dbConnection.query(updateOrderStatusQuery, [booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
            if (updateOrderStatusErr) {
              return res.json({ status: false, message: updateOrderStatusErr.message });
            }
           
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
            
          });
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

export const scanning_extra_loads_dryClean = async (req, res) => {
  try {
    const userData = res.user;
    const driverId = userData[0].id;
    const { qr_code, qr_codeID } = req.body;

    const bookingDataQuery =
      "SELECT * FROM dry_clean_booking_qr WHERE qr_code = ? AND id = ?";
    dbConnection.query(
      bookingDataQuery,
      [qr_code, qr_codeID],function (error, data) {
        if (error) {
          return res.json({ status: false, message: error.message });
        }
        if (data.length > 0 && data[0].press_status === 1) {
          const updateStatus = `UPDATE dry_clean_booking_qr SET package_status = '1' WHERE id = ${data[0].id}`;

          dbConnection.query(updateStatus,function (updateerror, updateResult) {
              if (updateerror) {
                return res.json({status: false,message: updateerror.message,});
              }
              const result = {
                booking_id: data[0].booking_id,
                qrCode_id: data[0].id,
                package_status: 1,
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

export const order_histroy_dryClean = async (req, res) => {
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
        let query = `SELECT b.id AS BookingId, u.name,b.order_status, b.order_id, b.user_id AS Customer_Id, CONCAT(b.date, ' ', b.time) AS PickUp_date_time, b.date, bi.package_images
          FROM bookings AS b
          JOIN users AS u ON b.user_id = u.id
          JOIN dry_clean_booking_images AS bi ON b.id = bi.booking_id 
          WHERE b.order_status = '4' AND b.order_type != 1 AND b.order_type != 2 AND b.folder_id = ? AND b.user_id IN (?) AND b.id IN (?)`;

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
                  let {BookingId,name,order_status, Customer_Id, PickUp_date_time, package_images
                   } = elem;
                  const separatedStrings = package_images.split(",")
                  const imagesUrl = separatedStrings.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList = imagesUrl.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    if (order_status === 9) {
                      order_status = "tagging";
                    } else if (order_status === 10) {
                      order_status = "spoting";
                    } else if (order_status === 11) {
                      order_status = "cleaning";
                    } else if (order_status === 12) {
                      order_status = "inspect";
                    } else if (order_status === 13) {
                      order_status = "press";
                    } else if (order_status === 4) {
                      order_status = "package";
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

export const order_histroy_dryClean_detail= async(req,res)=>{
  try {
    const userData = res.user;
    const folder_id = userData[0].id;
    const BookingId=req.body.BookingId;
   
        const query = `SELECT  b.user_id AS Customer_Id,cda.address,cda.zip AS Zip_Code,u.mobile,CONCAT(b.date, ' ', b.time) AS PickUp_date_time ,bi.tagging_images,bi.spoting_images,bi.cleaning_images,bi.inspect_images,bi.press_images,bi.package_images,bt.tagging_date,bt.tagging_time,bt.spotting_date,bt.spotting_time,bt.cleaning_date,bt.cleaning_time,bt.inspect_date,bt.inspect_time,bt.press_date,bt.press_time,bt.package_date,bt.package_time
      FROM bookings AS b
      JOIN customer_drop_address AS cda ON b.user_id = cda.user_id
      JOIN users AS u ON b.user_id = u.id
      JOIN dry_clean_booking_timing AS bt ON b.id = bt.booking_id
      JOIN dry_clean_booking_images AS bi ON b.id = bi.booking_id
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
                  const { Customer_Id,address,Zip_Code,mobile,PickUp_date_time,tagging_images,spoting_images,cleaning_images, inspect_images,press_images, package_images,tagging_date,tagging_time,spotting_date,spotting_time,cleaning_date,cleaning_time,inspect_date,inspect_time,press_date,press_time,package_date,package_time } = elem;
                  const separatedStrings1 = tagging_images.split(",")
                  const imagesUrl1 = separatedStrings1.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList1 = imagesUrl1.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings2 = spoting_images.split(",")
                  const imagesUrl2 = separatedStrings2.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList2 = imagesUrl2.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings3 = cleaning_images.split(",")
                  const imagesUrl3 = separatedStrings3.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList3 = imagesUrl3.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings4 = inspect_images.split(",")
                  const imagesUrl4 = separatedStrings4.map((val) => {
                    return `${process.env.S3_URL}${val}`;
                  });
                    const imageList4 = imagesUrl4.map(imagePath => ({
                      path: imagePath,
                      type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                    const separatedStrings5 = press_images.split(",")
                    const imagesUrl5 = separatedStrings5.map((val) => {
                      return `${process.env.S3_URL}${val}`;
                    });
                      const imageList5 = imagesUrl5.map(imagePath => ({
                        path: imagePath,
                        type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                      })
                      )
                      const separatedStrings6 = package_images.split(",")
                      const imagesUrl6 = separatedStrings6.map((val) => {
                        return `${process.env.S3_URL}${val}`;
                      });
                        const imageList6 = imagesUrl6.map(imagePath => ({
                          path: imagePath,
                          type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                        })
                        )
                    const laundry_detail = [
                      {
                        title: "Tagging",
                        imageList: imageList1,
                        date: tagging_date,
                        time: tagging_time
                      },
                      {
                        title: "Spotting",
                        imageList: imageList2,
                        date: spotting_date,
                        time: spotting_time
                      },
                      {
                        title: "Cleaning",
                        imageList: imageList3,
                        date: cleaning_date,
                        time: cleaning_time
                      },
                      {
                        title: "Inspect",
                        imageList: imageList4,
                        date: inspect_date,
                        time: inspect_time
                      },
                      {
                        title: "Press",
                        imageList: imageList5,
                        date: press_date,
                        time: press_time
                      },
                      {
                        title: "Package",
                        imageList: imageList6,
                        date: package_date,
                        time: package_time
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
    get_category,
    Add_To_Cart,
    delete_cart_item,
    get_cart_items,
    dry_clean_booking,
    Scan_dryClean_received_loads,
    Scan_loads_dry_clean,
    customer_list_dryClean,
    submit_dryClean_process_detail,
    print_DryClean_extra_loads_QrCode,
    scanning_extra_loads_dryClean,
    order_histroy_dryClean,
    order_histroy_dryClean_detail
  }
  