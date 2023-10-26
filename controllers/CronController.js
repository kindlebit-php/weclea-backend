import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
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
            const checkIfDateExist = "select * from bookings where date = '"+frequencyDBDate+"' and cron_status = 0";
            dbConnection.query(checkIfDateExist, function (error, checkIfresults) 
            {
                checkIfresults.forEach(ele =>{
                    const checkIfDateExist = "select * from bookings where date = '"+frequencyDBDate+"' and cron_status = 0";
                        dbConnection.query(checkIfDateExist, function (error, checkIfresults){

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