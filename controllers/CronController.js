import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import { getDates,randomNumber } from "../helpers/date.js";
//customer booking API

export const booking_subscription_cron = async(req,res)=>{
     try { 

        var datetime = new Date();
        const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
     	const bookingsql = "select id,cron_status,user_id,category_id,total_loads from bookings where date = '"+currentFinalDate+"' and order_type = '2' and cron_status = '0'";
        dbConnection.query(bookingsql, function (err, bookingresult) {
            if(bookingresult){
                Object.keys(bookingresult).forEach(function(key) {
                var elem = bookingresult[key];

                if(elem.category_id == 1){
                    var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+elem.user_id+"'";
                }else if(elem.category_id == 2){
                    var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+elem.user_id+"'";
                }else{
                    var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+elem.user_id+"'";
                }
                dbConnection.query(usrLoads, function (error, resultss) {
                    if(elem.total_loads > resultss[0].total_loads){
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }else{

                    const sqlqr = "select count(id) as total from booking_qr where booking_id = '"+elem.id+"'";
                    dbConnection.query(sqlqr, function (err, qrresult) {
                        if(qrresult[0].total == 0){
                            for (var i = 0; elem.total_loads > i; i++) {
                                var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+elem.id+"','"+randomNumber(elem.id)+"')";
                                dbConnection.query(sql, function (err, results) {
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
                                                console.log(result2)
                                            })
                                    });
                                       }
                                });     
                            }

                        }
                    });
 
                    var updateLoads = (resultss[0].total_loads - elem.total_loads);
                    if(elem.category_id == 1){
                        var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+elem.user_id+"'";
                    }else if(elem.category_id == 2){
                        var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+elem.user_id+"'";
                    }else{
                        var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+elem.user_id+"' ";
                    }
                    console.log('usrLoadsup',usrLoadsup)
                    dbConnection.query(usrLoadsup, function (error, result) {
                    })

                    var bookingsql = "INSERT INTO booking_timing (booking_id) VALUES ('"+elem.id+"')";
                    dbConnection.query(bookingsql, function (err, bookingresult) {
                    });
                    var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+elem.id+"')";
                    dbConnection.query(bookingsql, function (err, bookingresult) {

                    });
                    var updatesql = "update bookings set cron_status = '1' where id = '"+elem.id+"'";
                    dbConnection.query(updatesql, function (err, resultss) {
                 
                    });
              
                }
                })
             })
            }
        });
    	
    }catch (error) {
        res.json({'status':false,"message":error});  
    }
}

export default {
	booking_subscription_cron
}