import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import { getDates,randomNumber } from "../helpers/date.js";
//customer booking API

export const booking_subscription_cron = async(req,res)=>{
     try { 

        var datetime = new Date();
        const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
     	const bookingsql = "select id,cron_status,total_loads from bookings where date = '"+currentFinalDate+"' and order_type = '2' and cron_status = '0'";
        dbConnection.query(bookingsql, function (err, bookingresult) {
            if(bookingresult){
                    Object.keys(bookingresult).forEach(function(key) {
                    var elem = bookingresult[key];
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
                    var bookingsql = "INSERT INTO booking_timing (booking_id) VALUES ('"+elem.id+"')";
                    dbConnection.query(bookingsql, function (err, bookingresult) {
                    });
                    var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+elem.id+"')";
                    dbConnection.query(bookingsql, function (err, bookingresult) {

                    });
                    var updatesql = "update bookings set cron_status = '1' where id = '"+elem.id+"'";
                    dbConnection.query(updatesql, function (err, resultss) {
                 
                    });
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