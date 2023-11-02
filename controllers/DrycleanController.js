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

        var sql = "INSERT INTO bookings (user_id,date,time,order_type,driver_id,category_id,total_amount) VALUES ('"+userData[0].id+"','"+oneTimeDate+"', '"+current_time+"',3,1,'"+userData[0].category_id+"','"+amount+"')";

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

        const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
        dbConnection.query(custmer_address, function (error, custmeraddressResult) {
          var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 ORDER BY distance) as vt where vt.distance < 25;";
          dbConnection.query(sqlDistance, function (error, locationResult) {
          if(locationResult.length > 0){
            var driver_id = locationResult[0].id
          }else{
            var driver_id = 0
          }
        var qrSQL = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
        dbConnection.query(qrSQL, function (err, results) {
        if(results){
          var sql2= `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`
          dbConnection.query(sql2, async function (err, result1) {
          const qr_codes = result1.map((row) => row.qr_code);
          const getAll_qrCode= await generateQRCode(qr_codes)
          const userData1 = await getUserData (result.insertId);
          const pdfBytes = await generatePDF(userData1, getAll_qrCode);
          const match = pdfBytes.match(/uploads\\(.+)/);
          const newPath = 'uploads//' +match[1];
          const updatePdf = `UPDATE booking_qr SET pdf = '${newPath}' WHERE id = ${results.insertId}`;
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

  

  export default {
    get_category,
    Add_To_Cart,
    delete_cart_item,
    get_cart_items,
    dry_clean_booking
  }
  