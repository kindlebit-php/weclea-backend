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
          updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
          updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET tagging_status = ? WHERE booking_id = ?";
        } else if (type == 2) {
          updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET spotting_time = ?, spotting_date = ? WHERE booking_id = ?`;
          updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET spoting_images = ? WHERE booking_id = ?";
          updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
          updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET spotting_status = ? WHERE booking_id = ?";
          
        } else if (type == 3) {
          updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET cleaning_time = ?, cleaning_date = ? WHERE booking_id = ?`;
          updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET cleaning_images = ? WHERE booking_id = ?";
          updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
          updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET cleaning_status = ? WHERE booking_id = ?";
          
        }else if (type == 4) {
          updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET inspect_time = ?, inspect_date = ? WHERE booking_id = ?`;
          updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET inspect_images = ? WHERE booking_id = ?";
          updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
          updateQRtatusQuery = "UPDATE dry_clean_booking_qr SET inspect_status = ? WHERE booking_id = ?";
          
        }else if (type == 5) {
          updateDateTimeQuery = `UPDATE dry_clean_booking_timing SET press_time = ?, press_date = ? WHERE booking_id = ?`;
          updatePickupImagesQuery = "UPDATE dry_clean_booking_images SET press_images = ? WHERE booking_id = ?";
          updateOrderStatusQuery = "UPDATE bookings SET order_status = ? WHERE id = ?";
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
                    var totalPrintLoads = (bookingdata[0].category_id + extra_loads)
                    return res.json({ status: true,message: 'pack',data: { customer_id: bookingdata[0].user_id,total_loads: totalPrintLoads}});
  
  
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
  var totalPrintLoads = (bookingdata[0].category_id + extra_loads)
  
                               return res.json({ status: true,message: 'package',data: { customer_id: bookingdata[0].user_id,total_loads:totalPrintLoads }});
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
  var totalPrintLoads = (bookingdata[0].category_id + extra_loads)
  
                               return res.json({ status: true,message: 'package',data: { customer_id: bookingdata[0].user_id,total_loads:totalPrintLoads }});
                        
  
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
                var totalPrintLoads = (bookingdata[0].category_id + extra_loads)
  
                               return res.json({ status: true,message: 'package',data: { customer_id: bookingdata[0].user_id,total_loads:totalPrintLoads }});
                         
                          }
  
                        })
                      }
                   })
            })
          }else{
            var booking = "select user_id,total_loads from bookings where id = '"+booking_id+"'";
            dbConnection.query(booking, function (error, bookingdata) {
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
            return res.json({ status: true,message: 'package',data: { customer_id: bookingdata[0].user_id,total_loads: bookingdata[0].total_loads}});
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
       
            dbConnection.query(updateOrderStatusQuery, [type, booking_id], function (updateOrderStatusErr, updateOrderStatusResult) {
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
      res.json({ status: false, message: error.message });
    }
  };


  const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');

const s3 = new AWS.S3({
  accessKeyId: 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  region: 'YOUR_S3_REGION',
});

export const generatePDF = async (data, qrCodesArray) => {
  const executablePath = '/usr/bin/chromium-browser';
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  let htmlContent = '';

  for (let i = 0; i < qrCodesArray.length; i++) {
    // ... (unchanged)

    htmlContent += sectionHtml;
  }

  await page.setContent(htmlContent);

  const pdfBuffer = await page.pdf({
    format: 'A4',
  });

  const pdfKey = `uploads/${uuidv4()}.pdf`;

  const uploadParams = {
    Bucket: 'YOUR_S3_BUCKET_NAME',
    Key: pdfKey,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ACL: 'public-read', // Adjust the ACL as needed
  };

  // Upload the PDF to S3
  const uploadResult = await s3.upload(uploadParams).promise();

  await browser.close();

  // Return the S3 URL of the uploaded PDF
  return uploadResult.Location;
};
