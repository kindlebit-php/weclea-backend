import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import { generatePDF, generateQRCode, getUserData } from '../helpers/qr_slip.js';
import { getDates,randomNumber } from "../helpers/date.js";

export const get_category = async (req, res) => {
    try {
      var resData = [];
    const category = `SELECT id, title, price, image FROM dry_clean_services WHERE status = 1  and isDelete = 0`;
      dbConnection.query(category, function (error, data) {
        if (error) throw error;
        const dryCleanChares = `SELECT dry_clean_charges FROM settings `;
        dbConnection.query(dryCleanChares, function (error, dryCleanCharesdata) {
          data.forEach(element =>
          {
            const {id,title,price,image} = element;
            if(image){
              var img = process.env.BASE_URL+'/uploads/'+image;
            }else{
              var img = process.env.BASE_URL+'/uploads/pants.jpg';
            }
            const initi = {
            "id":id,"title":title,"price":price,"image":img
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

        var sql = "INSERT INTO bookings (user_id,date,time,order_type,driver_id,category_id,total_amount,total_loads) VALUES ('"+userData[0].id+"','"+oneTimeDate+"', '"+current_time+"',3,1,'"+userData[0].category_id+"','"+amount+"',1)";

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

        const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
        dbConnection.query(custmer_address, function (error, custmeraddressResult) {
          var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 ORDER BY distance) as vt where vt.distance < 25;";
          dbConnection.query(sqlDistance, function (error, locationResult) {
          if(locationResult.length > 0){
            var driver_id = locationResult[0].id
          }else{
            var driver_id = 0
          }
        var qrSQL = "INSERT INTO dry_clean_booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
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
        }); 
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



  
export const customer_list_dryClean = (req, res) => {
  const userData = res.user;
  const folder_id = userData[0].id;
  const customer_id = req.body.customer_id;
  try {
    var datetime = new Date();
    const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
    const bookingIdQuery = "SELECT bookings.id FROM bookings left join booking_qr on booking_qr.driver_pickup_status = 1 WHERE bookings.folder_id = '"+folder_id+"' and bookings.date = '"+currentFinalDate+"' and bookings.order_status != 14 and bookings.order_type != 3";
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
              console.log('images',pickup_images)
              const separatedStrings = pickup_images.split(",")
               const imagesUrl=separatedStrings.map((val) => {
               return `${process.env.BASE_URL}/${val}`;
              });
                 resData.push({
                Booking_id,
                Customer_Id,
                Note_From_Delivery,
                date,
                total_loads,
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


  export default {
    get_category,
    Add_To_Cart,
    delete_cart_item,
    get_cart_items,
    dry_clean_booking
  }
  