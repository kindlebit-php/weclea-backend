import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import { getDates,randomNumber } from "../helpers/date.js";
//customer booking API

export const customer_booking = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	delievery_day,date,total_loads,order_type,frequency} = req.body;
        if(	delievery_day && date && total_loads && order_type){
        if(order_type == '1'){
            var sql = "select available_loads from users where id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (error, result) {
                if(total_loads > result[0].available_loads){
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }else{
                    let dateObject = new Date();
                    let hours = dateObject.getHours();
                    let minutes = dateObject.getMinutes();
                    const current_time = hours + ":" + minutes;
                    const oneTimeDate = dateFormat.format(new Date(date),'YYYY-MM-DD');

                    // var sqlDistance = "select * from (select latitude, longitude, SQRT(POW(69.1 * ('"+userData[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+userData[0].longitude+"') * COS('"+userData[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role =2 ORDER BY distance) as vt where vt.distance < 25;";

                    // dbConnection.query(sqlDistance, function (error, results) {
                    //     if (error) 
                    //     console.log('error',error)
                    //     console.log('results',results)
                    //     // res.json({'status':true,"message":"Booking added successfully!"});
                    // }); 
                    // return false;
                    var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,driver_id) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+oneTimeDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"',52)";
                    dbConnection.query(sql, function (err, result) {
                        for (var i = 0; total_loads > i; i++) {
                        var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                        dbConnection.query(sql, function (err, results) {
                        });     
                        }

                        var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+result.insertId+"')";
                        dbConnection.query(bookingsql, function (err, bookingresult) {
                        
                        });

                        var bookingsql2 = "INSERT INTO booking_timing (booking_id) VALUES ('"+result.insertId+"')";
                        dbConnection.query(bookingsql2, function (err, bookingresult) {

                        });

                        var order_id = '1001'+result.insertId;
                        var sql = "update bookings set order_id = '"+order_id+"'where id = '"+result.insertId+"'";
                        dbConnection.query(sql, function (err, resultss) {
                        res.json({'status':true,"message":"Booking added successfully!"});
                        
                        });
                    }); 
                }
            });
        }else if(frequency != ''){
            var currentDate = new Date(date);
            const currentFinalDate = dateFormat.format(currentDate,'YYYY-MM-DD');
            const lastdate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
            const endFinalDate = dateFormat.format(lastdate,'YYYY-MM-DD');

            let allDates =   getDates(new Date(currentFinalDate), new Date(endFinalDate),frequency);
            console.log('allDates',allDates)
            var sql = "select available_loads from users where id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (error, result) {
                if(total_loads > result[0].available_loads){
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }else{
                    var resData = [];
                    allDates.forEach(function callback(element, key)
                    {
                        var frequencyDate = new Date(allDates[key]);
                        const frequencyDBDate = dateFormat.format(frequencyDate,'YYYY-MM-DD');
                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                        const currentBookingDate = dateFormat.format(dateObject,'YYYY-MM-DD');

                        if(frequencyDBDate == currentBookingDate ){
                            var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,driver_id,cron_status) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+currentBookingDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"',52,1)";
                            dbConnection.query(sql, function (err, result) {
                            for (var i = 0; total_loads > i; i++) {
                            var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                            dbConnection.query(sql, function (err, results) {
                            });     
                            }
                            var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+result.insertId+"')";
                            dbConnection.query(bookingsql, function (err, bookingresult) {

                            });

                            var bookingsql2 = "INSERT INTO booking_timing (booking_id) VALUES ('"+result.insertId+"')";
                            dbConnection.query(bookingsql2, function (err, bookingresult) {

                            });

                            var order_id = '1001'+result.insertId;
                            var sql = "update bookings set order_id = '"+order_id+"'where id = '"+result.insertId+"'";
                            dbConnection.query(sql, function (err, resultss) {
                            // res.json({'status':true,"message":"Booking added successfully!"});

                            });
                            }); 
                        }else{
                            var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,frequency) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+frequency+"')";
                            dbConnection.query(sql, function (err, resultsub) {
                            var order_id = '1001'+resultsub.insertId;
                            var sql = "update bookings set order_id = '"+order_id+"'where id = '"+resultsub.insertId+"'";
                            dbConnection.query(sql, function (err, resultss) {
                            });
                            });
                        }
                    }) 
                        res.json({'status':true,"message":"Booking added successfully!"});

                }
            });
        }
    	}else{
            res.json({'status':false,"message":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"message":error});  
    }
}

export default {
	customer_booking
}