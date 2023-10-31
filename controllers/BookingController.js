import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import dateFormatFinalDate from 'date-and-time';
import path from "path";
import { getDates,randomNumber } from "../helpers/date.js";
import { generatePDF, generateQRCode, getUserData } from '../helpers/qr_slip.js';

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
                      const checkIfDateExist = "select count(id) as total_date from bookings where date = '"+oneTimeDate+"' and user_id = '"+userData[0].id+"'";
                    dbConnection.query(checkIfDateExist, function (error, checkIfresults) {
                        if(checkIfresults[0].total_date == 0){

                    const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
                    dbConnection.query(custmer_address, function (error, custmeraddressResult) {
                    var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 ORDER BY distance) as vt where vt.distance < 25;";
                    dbConnection.query(sqlDistance, function (error, locationResult) {
                    // return false;
                    if(locationResult.length > 0){
                        // var driver_id = locationResult[0].id
                        var driver_id = 1
                    }else{
                        var driver_id = 1
                    }
                    var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,driver_id,category_id,cron_status) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+oneTimeDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+driver_id+"','"+category_id+"',1)";
                    dbConnection.query(sql, async function (err, result) {
                    var updateLoads = (results[0].total_loads - total_loads);
                    if(category_id == 1){
                        var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else if(category_id == 2){
                        var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else{
                        var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+userData[0].id+"' ";
                    }
                    dbConnection.query(usrLoadsup, function (error, resulst) {
                    })                    
                    if(typeof payment_id != 'undefined'){
                        var paymentsql = "update payment set booking_id = '"+result.insertId+"'where id = '"+payment_id+"'";
                        dbConnection.query(paymentsql, function (err,paymentResult ) {
                        });
                    }
                        for (var i = 0; total_loads > i; i++) {
                        var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                        dbConnection.query(sql, function (err, results) {
                           // console.log(results,"qrresults")
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
                    });  
                }); 
                       }else{
                        res.json({'status':false,"message":"Booking already added for selected date!"});
                       }
                    })
                }
            });
        }else if(order_type == '2'){
            var currentDate = new Date(date);
            const currentFinalDate = dateFormat.format(currentDate,'YYYY-MM-DD');
            const lastdate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
            const endFinalDate = dateFormat.format(lastdate,'YYYY-MM-DD');

            let allDates =   getDates(new Date(currentFinalDate), new Date(endFinalDate),frequency);
         
            if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            else
            {
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (error, resultss) 
            {
                if(total_loads > resultss[0].total_loads)
                {
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }
                else
                {
                    var resData = [];
                    allDates.forEach(function callback(element, key)
                    {
                        var frequencyDate = new Date(allDates[key]);
                        const frequencyDBDate = dateFormat.format(frequencyDate,'YYYY-MM-DD');
                        
                    const checkIfDateExist = "select count(id) as tpyedate from bookings where date = '"+frequencyDBDate+"' and user_id = '"+userData[0].id+"'";
                    dbConnection.query(checkIfDateExist, function (error, checkIfresults) 
                    {
                        if(checkIfresults[0].tpyedate == 0)
                        {

                    

                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                        const currentBookingDate = dateFormat.format(dateObject,'YYYY-MM-DD');

                        if(frequencyDBDate == currentBookingDate ){
                           
                            const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
                            dbConnection.query(custmer_address, function (error, custmeraddressResult) {
                            var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 ORDER BY distance) as vt where vt.distance < 25;";
                            dbConnection.query(sqlDistance, function (error, locationResult) {
                            // return false;
                            if(locationResult.length > 0){
                                // var driver_id = locationResult[0].id
                                var driver_id = 1

                            }else{
                                var driver_id = 1
                            }
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,driver_id,cron_status,category_id) VALUES ('"+userData[0].id+"', '"+currentBookingDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+driver_id+"',1,'"+category_id+"')";
                       
                            dbConnection.query(sql, function (err, result) {
                                for (var i = 0; total_loads > i; i++) {
                                    var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
                                    dbConnection.query(sql, function (err, results) {
                                        if(results){
                                            var sql2= `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`
                                           dbConnection.query(sql2, async function (err, result1) {
                                            const qr_codes = result1.map((row) => row.qr_code);
                                                const getAll_qrCode= await generateQRCode(qr_codes)
                                                console.log(getAll_qrCode)
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
                                var updateLoads = (resultss[0].total_loads - total_loads);

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
                            }
                    })
                    }) 
                        res.json({'status':true,"message":"Booking added successfully!"});
                }
            });
        }
        else if(order_type == '3'){
            var currentDate = new Date(date);
            const currentFinalDate = dateFormat.format(currentDate,'YYYY-MM-DD');
            const lastdate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
            const endFinalDate = dateFormat.format(lastdate,'YYYY-MM-DD');
            let allDates = date.split(',');
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
                        
                        const checkIfDateExist = "select count(id) as tpyedate from bookings where date = '"+frequencyDBDate+"' and user_id = '"+userData[0].id+"'";
                        dbConnection.query(checkIfDateExist, function (error, checkIfresults) {
                        if(checkIfresults[0].tpyedate == 0){


                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                        const currentBookingDate = dateFormat.format(dateObject,'YYYY-MM-DD');

                        if(frequencyDBDate == currentBookingDate ){
                            const custmer_address = "select * from customer_address where user_id = '"+userData[0].id+"'"
                            dbConnection.query(custmer_address, function (error, custmeraddressResult) {
                            var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 ORDER BY distance) as vt where vt.distance < 25;";
                            dbConnection.query(sqlDistance, function (error, locationResult) {
                            // return false;
                            if(locationResult.length > 0){
                                // var driver_id = locationResult[0].id
                                var driver_id = 1

                            }else{
                                var driver_id = 1
                            }
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,driver_id,cron_status,category_id) VALUES ('"+userData[0].id+"', '"+currentBookingDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+driver_id+"',1,'"+category_id+"')";
                           
                            dbConnection.query(sql, function (err, result) {
                                for (var i = 0; total_loads > i; i++) {
                                    var sql = "INSERT INTO booking_qr (booking_id,qr_code) VALUES ('"+result.insertId+"','"+randomNumber(result.insertId)+"')";
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
                                var updateLoads = (resultss[0].total_loads - total_loads);

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
                            }); 
                            }); 
                        }else{
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,category_id) VALUES ('"+userData[0].id+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+category_id+"')";
                      
                            dbConnection.query(sql, function (err, resultsub) {
                                var order_id = '1001'+resultsub.insertId;
                                var sql = "update bookings set order_id = '"+order_id+"'where id = '"+resultsub.insertId+"'";
                                dbConnection.query(sql, function (err, resultss) {
                                });
                            });
                        }
                          }
                        })
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
                resultss.forEach(function callback(elem, key){
                var resversDate = new Date(elem.date)
                var finalDate = dateFormat.format(resversDate,'MM-DD-YYYY');
                  const init = {
                        'id':elem.id,'date':finalDate
                    }
                    resData.push(init)
                })
                res.json({'status':true,"message":"user subscriptions list",'data':resData});
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const booking_tracking_status = async(req,res)=>{

        try { 
            var resData = [];
            var resPickImg = [];
            var resWashImg = [];
            var resDryImg = [];
            var resPackImg = [];
            var resFoldImg = [];
            const userData = res.user;
            var datetime = new Date();
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select bookings.id,booking_images.wash_images,booking_images.dry_images,booking_images.fold_images,booking_images.pack_images,booking_images.drop_image,bookings.order_status,bookings.order_type,booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.customer_pick_date, ' ', booking_timing.customer_pick_time) AS pickup_confirm_date ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date,CONCAT(booking_timing.dry_date, ' ', booking_timing.dry_time) AS dry_date,CONCAT(booking_timing.fold_date, ' ', booking_timing.fold_time) AS fold_date,CONCAT(booking_timing.pack_date, ' ', booking_timing.pack_time) AS pack_date from bookings left join booking_timing on bookings.id = booking_timing.booking_id left join booking_images on booking_images.booking_id = bookings.id where bookings.order_status != 6 and bookings.order_status != 7 and booking_timing.customer_pick_time IS NOT NULL";
            dbConnection.query(sql, function (err, resultss) {
            if(resultss){
            resultss.forEach(element =>
            {
                const {id,order_type,dry_images,wash_images,fold_images,pack_images,dry_date,fold_date,pack_date,order_status,pickup_images,wash_date,request_confirm_date,status,pickup_confirm_date,drop_image,driver_pickup_status} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(wash_images){
                    const wash_images_array = wash_images.split(',');
                    wash_images_array.forEach(function callback(img, key)
                    {
                        resWashImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(dry_images){
                    const dry_images_array = dry_images.split(',');
                    dry_images_array.forEach(function callback(img, key)
                    {
                        resDryImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(fold_images){
                    const fold_images_array = fold_images.split(',');
                    fold_images_array.forEach(function callback(img, key)
                    {
                        resFoldImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(pack_images){
                    const pack_images_array = pack_images.split(',');
                    pack_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }
                if(order_status == 1){
                    var wash_status = 1;
                }else if(order_status == 2){
                    var dry_status = 1;
                }else if(order_status == 3){
                    var fold_status = 1;
                }else if(order_status == 4){
                    var pack_status = 1;
                }else{
                    var pack_status = 0;
                    var dry_status = 0;
                    var fold_status = 0;
                    var wash_status = 0;

                }
                const initi = {
                    "id":id,"order_type":order_type,"request_confirm_date":request_confirm_date,"request_confirm_status":status,'pickup_confirm_date':pickup_confirm_date,'pickup_confirm_status':1,'pickup_img':resPickImg,'wash_date':wash_date,'wash_status':wash_status,'wash_images':resWashImg,'dry_date':dry_date,'dry_status':dry_status,'dry_images':resDryImg,'fold_date':fold_date,'fold_status':fold_status,'fold_images':resFoldImg,'pack_date':pack_date,'pack_status':pack_status,'pack_images':resPackImg
                }
                resData.push(initi);
            })
                res.json({'status':true,"message":"user order list",'data':resData});
            }else{
                res.json({'status':false,"message":"Not found"});

            }
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const booking_tracking_details = async(req,res)=>{

        const {booking_id} = req.body;
        try { 
            var resData = [];
            var resPickImg = [];
            var resWashImg = [];
            var resDryImg = [];
            var resPackImg = [];
            var resFoldImg = [];
            const userData = res.user;
            var datetime = new Date();
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select bookings.id,booking_images.wash_images,booking_images.dry_images,booking_images.fold_images,booking_images.pack_images,booking_images.drop_image,bookings.order_status,bookings.order_type,booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.customer_pick_date, ' ', booking_timing.customer_pick_time) AS pickup_confirm_date ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date,CONCAT(booking_timing.dry_date, ' ', booking_timing.dry_time) AS dry_date,CONCAT(booking_timing.fold_date, ' ', booking_timing.fold_time) AS fold_date,CONCAT(booking_timing.pack_date, ' ', booking_timing.pack_time) AS pack_date from bookings left join booking_timing on bookings.id = booking_timing.booking_id left join booking_images on booking_images.booking_id = bookings.id where bookings.id = '"+booking_id+"' and booking_timing.customer_pick_time IS NOT NULL";
            dbConnection.query(sql, function (err, resultss) {
            if(resultss){
            resultss.forEach(element =>
            {
                const {id,order_type,dry_images,wash_images,fold_images,pack_images,dry_date,fold_date,pack_date,order_status,pickup_images,wash_date,request_confirm_date,status,pickup_confirm_date,drop_image,driver_pickup_status} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(wash_images){
                    const wash_images_array = wash_images.split(',');
                    wash_images_array.forEach(function callback(img, key)
                    {
                        resWashImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(dry_images){
                    const dry_images_array = dry_images.split(',');
                    dry_images_array.forEach(function callback(img, key)
                    {
                        resDryImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(fold_images){
                    const fold_images_array = fold_images.split(',');
                    fold_images_array.forEach(function callback(img, key)
                    {
                        resFoldImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }

                if(pack_images){
                    const pack_images_array = pack_images.split(',');
                    pack_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.BASE_URL+'/uploads/'+img;
                    })
                }
                if(order_status == 1){
                    var wash_status = 1;
                }else if(order_status == 2){
                    var dry_status = 1;
                }else if(order_status == 3){
                    var fold_status = 1;
                }else if(order_status == 4){
                    var pack_status = 1;
                }else{
                    var pack_status = 0;
                    var dry_status = 0;
                    var fold_status = 0;
                    var wash_status = 0;

                }
                const initi = {
                    "id":id,"order_type":order_type,"request_confirm_date":request_confirm_date,"request_confirm_status":status,'pickup_confirm_date':pickup_confirm_date,'pickup_confirm_status':1,'pickup_img':resPickImg,'wash_date':wash_date,'wash_status':wash_status,'wash_images':resWashImg,'dry_date':dry_date,'dry_status':dry_status,'dry_images':resDryImg,'fold_date':fold_date,'fold_status':fold_status,'fold_images':resFoldImg,'pack_date':pack_date,'pack_status':pack_status,'pack_images':resPackImg
                }
                resData.push(initi);
            })
                res.json({'status':true,"message":"user order list",'data':resData});
            }else{
                res.json({'status':false,"message":"Not found"});

            }
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const assign_driver = async(req,res)=>{
     try {
        const {booking_id,driver_id} = req.body;
        if(booking_id  && driver_id ){
                var sql = "update bookings set driver_id = '"+driver_id+"' where id = '"+booking_id+"'";
                dbConnection.query(sql, function (error, result) {
                if (error) throw error;
                    res.json({'status':true,"message":"Employee profile has been updated!"});
                }); 
        }else{
            res.json({'status':false,"message":"All fields are required"});
        }
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const assign_folder = async(req,res)=>{
     try {
        const {booking_id,folder_id} = req.body;
        if(booking_id  && folder_id ){
                var sql = "update bookings set folder_id = '"+folder_id+"' where id = '"+booking_id+"'";
                dbConnection.query(sql, function (error, result) {
                if (error) throw error;
                    res.json({'status':true,"message":"Employee profile has been updated!"});
                }); 
        }else{
            res.json({'status':false,"message":"All fields are required"});
        }
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const booking_pickup_instruction = async(req,res)=>{

        try { 
            const userData = res.user;
            const { pickup_instruction} = req.body;
            var sql = "update booking_instructions set pickup_instruction = '"+pickup_instruction+"' where user_id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Instruction added successfully"});
            }); 
        }catch (error) {
            res.json({'status':false,"message":error.message});  
        }
}

export const booking_delievery_instruction = async(req,res)=>{

        try { 
            const userData = res.user;
            const { delievery_instruction} = req.body;
            var sql = "update booking_instructions set delievery_instruction = '"+delievery_instruction+"' where user_id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Instruction added successfully"});
            }); 
        }catch (error) {
            res.json({'status':false,"message":error.message});  
        }
}

export const delete_booking_date = async(req,res)=>{

        try { 
            const userData = res.user;
            const { date} = req.body;
            var sql = "delete from bookings where user_id = '"+userData[0].id+"' and date = '"+date+"'";
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Booking deleted successfully"});
            }); 
        }catch (error) {
            res.json({'status':false,"message":error.message});  
        }
}


export const booking_rating = async(req,res)=>{

    try { 
        const userData = res.user;
        const { booking_id,title,body,rating,images} = req.body;
        if(booking_id  && rating ){
             const imageArray = [];
             var pickupImagesJSON ='';
                if(req.files){
                    req.files.forEach((e, i) => {
                        imageArray.push(e.path);
                    });
                if (imageArray.length > 5) {
                    return res.json({ status: false, message: "Only 5 images are allowed" });
                }
                    var pickupImagesJSON = imageArray.join(", ");
                }
            var sql = "INSERT INTO ratings (booking_id,user_id,rating,title,body,images) VALUES ('"+booking_id+"','"+userData[0].id+"','"+rating+"', '"+title+"', '"+body+"','"+pickupImagesJSON+"')";
            console.log('sql',sql)
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Rating submitted"});
            }); 
        }else{
            res.json({'status':false,"message":"All fields are required"});
        }
     }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
 
export const booking_history = async(req,res)=>{
    try {   
            const userData = res.user;
            var resData = []
            const sql = "select bookings.date ,bookings.id ,bookings.time, bookings.total_loads,booking_images.drop_image,booking_timing.deliever_date,booking_timing.deliever_time from bookings left join booking_timing on booking_timing.booking_id = bookings.id left join booking_images on booking_images.booking_id = bookings.id where bookings.order_status = 6 and user_id = '"+userData[0].id+"'";
            console.log('sql',sql)
            dbConnection.query(sql, function (err, results) {
                results.forEach(ele => {
                const {id,date,time,total_loads,drop_image,deliever_date,deliever_time} = ele;
                if(drop_image){
                    const separatedStrings = drop_image.split(", ")
                    const imagesUrl = separatedStrings.map((val) => {
                        return `${process.env.BASE_URL}/${val}`;
                    });
                    var imageList = imagesUrl.map(imagePath => ({
                        path: imagePath,
                        type: path.extname(imagePath) === '.mov' || path.extname(imagePath) === '.mp4' ? 'video' : 'image',
                    })
                    )
                }else{
                    var imageList = [];
                }
                    const init = {
                        'id':id,'date':date,'time':time,'total_loads':total_loads,'deliever_date':deliever_date,'deliever_time':deliever_time,'images':imageList
                    }
                    resData.push(init)
                })
                res.json({'status':true,"message":"Order history",'data':resData});
            });
     }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export default {
	customer_booking,
    booking_tracking_details,
    delete_booking_date,
    subscription_dates,
    booking_tracking_status,
    booking_pickup_instruction,
    booking_delievery_instruction,
    assign_driver,
    assign_folder,
    booking_history,
    booking_rating
}