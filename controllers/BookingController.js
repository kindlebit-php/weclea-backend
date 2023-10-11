import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import dateFormatFinalDate from 'date-and-time';
import { getDates,randomNumber } from "../helpers/date.js";
//customer booking API

export const customer_booking = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	delievery_day,date,total_loads,order_type,frequency,category_id} = req.body;
        if(	date && total_loads && order_type){
        if(order_type == '1'){
            if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else{
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (error, results) {
                if(total_loads > results[0].total_loads){
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
                    var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,driver_id,category_id,cron_status) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+oneTimeDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"',52,'"+category_id+"',1)";
                    dbConnection.query(sql, function (err, result) {
                    var updateLoads = (results[0].total_loads - total_loads);
                    if(category_id == 1){
                        var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else if(category_id == 2){
                        var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else{
                        var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+userData[0].id+"' ";
                    }
                    dbConnection.query(usrLoadsup, function (error, result) {
                    })

                        for (var i = 0; total_loads > i; i++) {
                        var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                        dbConnection.query(sql, function (err, results) {
                        });     
                        }

                        var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+result.insertId+"')";
                        dbConnection.query(bookingsql, function (err, bookingresult) {
                        
                        });

                        var bookingsql = "INSERT INTO booking_timing (booking_id) VALUES ('"+result.insertId+"')";
                        dbConnection.query(bookingsql, function (err, bookingresult) {

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
            if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else{
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (error, resultss) {
                if(total_loads > resultss[0].total_loads){
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
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,driver_id,cron_status,category_id) VALUES ('"+userData[0].id+"', '"+currentBookingDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"',52,1,'"+category_id+"')";
                            dbConnection.query(sql, function (err, result) {
                                for (var i = 0; total_loads > i; i++) {
                                    var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                                    dbConnection.query(sql, function (err, results) {
                                    });     
                                }
                                var updateLoads = (resultss[0].total_loads - total_loads);
// console.log('updateLoads',updateLoads)
                                if(category_id == 1){
                                var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                                }else if(category_id == 2){
                                var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                                }else{
                                var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+userData[0].id+"' ";
                                }
                                dbConnection.query(usrLoadsup, function (error, result) {
                                })
                                var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+result.insertId+"')";
                                dbConnection.query(bookingsql, function (err, bookingresult) {

                                });
                                var bookingsql = "INSERT INTO booking_timing (booking_id) VALUES ('"+result.insertId+"')";
                                dbConnection.query(bookingsql, function (err, bookingresult) {

                                });

                                var order_id = '1001'+result.insertId;
                                var sql = "update bookings set order_id = '"+order_id+"'where id = '"+result.insertId+"'";
                                dbConnection.query(sql, function (err, resultss) {
                                });
                            }); 
                        }else{
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,frequency,category_id) VALUES ('"+userData[0].id+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+frequency+"','"+category_id+"')";
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

export const subscription_dates = async(req,res)=>{

        try { 
            const userData = res.user;
            var datetime = new Date();
            var resData = [];
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select id ,date from bookings where user_id = '"+userData[0].id+"' and date >= '"+currentFinalDate+"' order by date desc";
             dbConnection.query(sql, function (err, resultss) {
                // console.log('resultss',resultss)
                resultss.forEach(function callback(elem, key){
                var resversDate = new Date(elem.date)
                var finalDate = dateFormat.format(resversDate,'MM-DD-YYYY');
                  const init = {
                        'id':elem.id,'date':finalDate
                    }
                    resData.push(init)
                })
                res.json({'status':false,"message":"user subscriptions list",'data':resData});
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const booking_tracking_status = async(req,res)=>{

        try { 
            var resData = [];
            var resPickImg = [];
            const userData = res.user;
            var datetime = new Date();
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select bookings.id,bookings.order_status,bookings.order_type,booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.customer_pick_date, ' ', booking_timing.customer_pick_time) AS pickup_confirm_date,booking_qr.driver_pickup_status ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date from bookings left join booking_timing on bookings.id = booking_timing.booking_id left join booking_qr on booking_qr.booking_id = bookings.id left join booking_images on booking_images.booking_id = bookings.id where bookings.date >= '"+currentFinalDate+"' and bookings.cron_status = 1 and booking_qr.driver_pickup_status = 1 and booking_timing.customer_pick_time IS NOT NULL group by booking_qr.booking_id";
            dbConnection.query(sql, function (err, resultss) {
            resultss.forEach(element =>
            {
                const {id,order_type,pickup_images,request_confirm_date,status,pickup_confirm_date,driver_pickup_status} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                    // var img = process.env.BASE_URL+'/uploads/'+image;
                }
                const initi = {
                    "id":id,"order_type":order_type,"request_confirm_date":request_confirm_date,"status":status,'pickup_confirm_date':pickup_confirm_date,'driver_pickup_status':driver_pickup_status,'pickup_img':resImg
                }
                resData.push(initi);
            })
                res.json({'status':false,"message":"user order list",'data':resData});
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export default {
	customer_booking,
    subscription_dates,
    booking_tracking_status
}