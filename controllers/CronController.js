import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import transport from "../helpers/mail.js";
import { getDates,randomNumber,setDateForNotification } from "../helpers/date.js";
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
export const booking_load_alert = async(req,res)=>{
     try { 
         var datetime = new Date();
        const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
        const lastdate = dateFormat.addDays(datetime, 3); 
        const endFinalDate = dateFormat.format(lastdate,'YYYY-MM-DD');
        let allDates =   setDateForNotification(new Date(currentFinalDate), new Date(endFinalDate));
        // console.log('allDates',allDates)
        allDates.forEach(function callback(element, key)
        {
            var frequencyDate = new Date(allDates[key]);
            const frequencyDBDate = dateFormat.format(frequencyDate,'YYYY-MM-DD');
            // console.log('frequencyDBDate',frequencyDBDate)
            const checkIfDateExist = "select * from bookings where date = '"+frequencyDBDate+"' and cron_status = 0 and order_type != 3";
            // console.log('checkIfDateExist',checkIfDateExist)
            dbConnection.query(checkIfDateExist, function (error, checkIfresults) 
            {
                // console.log('checkIfresults',checkIfresults)
                checkIfresults.forEach(ele =>{
                    if(ele.category_id == 1){
                    var userLoads = "select commercial as totalCount from customer_loads_availabilty where user_id = '"+ele.user_id+"'";
                    }else if(ele.category_id == 2){
                    var userLoads = "select residential as totalCount from customer_loads_availabilty where user_id = '"+ele.user_id+"'";
                    }else{
                    var userLoads = "select yeshiba as totalCount from customer_loads_availabilty where user_id = '"+ele.user_id+"'";
                    }
                    dbConnection.query(userLoads, function (error, userLoadsresults){
                        console.log('userLoadsresults',userLoadsresults)
                        console.log('ele.loads',ele.total_loads)
                        if(userLoadsresults[0].totalCount < ele.total_loads){

                            const user = "select name, email from users where id = '"+ele.user_id+"'";
                            dbConnection.query(user, function (error, userresults) 
                            {
                                        const mailOptions = 
                    {
                    from: 'ankuchauhan68@gmail.com',
                    to: userresults[0].email,
                    subject: "Weclea Load Alert",
                    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                        <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">WeClea</a>
                        </div>
                        <p style="font-size:1.1em">Hi ${userresults[0].name},</p>
                        <p>You have an upcoming booking on ${ele.date} ,Please purchase loads..</p>
                        <p style="font-size:0.9em;">Regards,<br />WeClea</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                        <p>WeClea Inc</p>
                        <p>USA</p>
                        </div>
                        </div>
                        </div>`,
                    };

                    transport.sendMail(mailOptions, function (error, info) 
                    {

                    })
                            }) 
                        }
                    })
                })
            })
        })
     }catch (error) {
        res.json({'status':false,"message":error});  
    }
}
export default {
	booking_subscription_cron,
    booking_load_alert
}