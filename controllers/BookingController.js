import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
import dateFormatFinalDate from 'date-and-time';
import path from "path";
import { getDates,randomNumber } from "../helpers/date.js";
import { orderAddress } from "../helpers/orderAddress.js";
import { assignDriver } from "../helpers/location.js";
import { generatePDF, generateQRCode, getUserData } from '../helpers/qr_slip.js';

//customer booking API

export const customer_booking = async(req,res)=>{
     try { 
        
     	const userData = res.user;
        const {	delievery_day,is_admin,date,total_loads,paymentId,order_type,frequency,category_id} = req.body;
        if(	date && total_loads && order_type){
        if(typeof is_admin != 'undefined'){
            var isAdmin = 1
        }else{
            var isAdmin = 0
        }
        if(order_type == '1'){
            if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else{
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (error, results) {
                if(total_loads > Number(results[0].total_loads)){
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }else{
                    // console.log("data")
                    let dateObject = new Date();
                    let hours = dateObject.getHours();
                    let minutes = dateObject.getMinutes();
                    const current_time = hours + ":" + minutes;
                    const oneTimeDate = dateFormat.format(new Date(date),'YYYY-MM-DD');
                      const checkIfDateExist = "select count(id) as total_date from bookings where date = '"+oneTimeDate+"' and user_id = '"+userData[0].id+"' and order_type = 1";
                    dbConnection.query(checkIfDateExist, async function (error, checkIfresults) {
                        if(checkIfresults[0].total_date == 0){
                            
                    const driver_id = await assignDriver(userData[0].id,oneTimeDate,current_time)
                  
                    var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,driver_id,drop_drive_id,category_id,cron_status,is_admin) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+oneTimeDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+driver_id+"','"+driver_id+"','"+category_id+"',1,'"+isAdmin+"')";

                    dbConnection.query(sql, async function (err, result) {
                    if(result.insertId){
                    orderAddress(userData[0].id,result.insertId)

                    var updateLoads = (results[0].total_loads - total_loads);
                    if(category_id == 1){
                        var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else if(category_id == 2){
                        var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                    }else{
                        var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+userData[0].id+"' ";
                    }
                    dbConnection.query(usrLoadsup, function (error, resulst) {
                        console.log(error,resulst)
                    })                    
                    if(typeof paymentId != 'undefined'){
                        // console.log('enter in paymentsql')
                        var paymentsql = "update payment set booking_id = '"+result.insertId+"' where id = '"+paymentId+"'";
                        // console.log('paymentsqlKailash',paymentsql)
                        dbConnection.query(paymentsql, function (err,paymentResult ) {
                        });
                    }
              

                        const qrCodesArray = [];
                        const insertIds=[]
    for (let i = 0; i < total_loads; i++) { 
        const sql = "INSERT INTO booking_qr (booking_id, qr_code) VALUES (?, ?)";
        const values = [result.insertId, randomNumber(result.insertId)];

        await new Promise((resolve, reject) => {
            dbConnection.query(sql, values, function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                    dbConnection.query(sql2, function (err, result1) {
                        if (err) {
                            reject(err);
                        } else {
                            qrCodesArray.push(result1[0].qr_code);
                            insertIds.push(results.insertId);
                            resolve();
                        }
                    });
                }
            });
        });
    }
                                const qr_codes = qrCodesArray.join(",")
                                 const getAll_qrCode= await generateQRCode(qrCodesArray)
                                const userData1 = await getUserData(result.insertId);
                                const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                dbConnection.query(updatePdf, async function (err, result2) {

                                    });

                        
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
                    }else{
                        res.json({'status':false,"message":"There are some problems with server connectivity. Please place order your again"});
                      
                    }
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
            dbConnection.query(usrLoads,async function (error, resultss) 
            {
                if(total_loads > Number(resultss[0].total_loads))
                
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
                        
                    const checkIfDateExist = "select count(id) as tpyedate from bookings where date = '"+frequencyDBDate+"' and user_id = '"+userData[0].id+"' and order_type = 2";
                    dbConnection.query(checkIfDateExist, async function (error, checkIfresults) 
                    {
                        if(checkIfresults[0].tpyedate == 0)
                        {

                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                        const currentBookingDate = dateFormat.format(dateObject,'YYYY-MM-DD');
                        console.log("1231231234445555",checkIfresults[0].tpyedate)
                        console.log(frequencyDBDate,currentBookingDate)
                        if(frequencyDBDate == currentBookingDate ){
                            // var driver_id = assignDriver(userData[0].id)
                    var driver_id = await assignDriver(userData[0].id,currentBookingDate,current_time)
                          console.log('driver_id',driver_id)
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,driver_id,drop_drive_id,cron_status,category_id,frequency,is_admin) VALUES ('"+userData[0].id+"', '"+currentBookingDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+driver_id+"','"+driver_id+"',1,'"+category_id+"','"+frequency+"','"+isAdmin+"')";
                            dbConnection.query(sql,async function (err, result) {
                            orderAddress(userData[0].id,result.insertId)
                                
                                const qrCodesArray = [];
                                const insertIds=[]
                                for (let i = 0; i < total_loads; i++) {
                                    const sql = "INSERT INTO booking_qr (booking_id, qr_code) VALUES (?, ?)";
                                    const values = [result.insertId, randomNumber(result.insertId)];
                                    await new Promise((resolve, reject) => {
                                        dbConnection.query(sql, values, function (err, results) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                const sql2 = `SELECT qr_code FROM booking_qr WHERE id=${results.insertId}`;
                                                dbConnection.query(sql2, function (err, result1) {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        qrCodesArray.push(result1[0].qr_code);
                                                        insertIds.push(results.insertId);
                                                        resolve();
                                                    }
                                                });
                                            }
                                        });
                                    });
                                }
                                                            console.log("All QR codes:", qrCodesArray);
                                                            const qr_codes = qrCodesArray.join(",")
                                                            console.log("All QR codes1:", qr_codes);
                                                             const getAll_qrCode= await generateQRCode(qrCodesArray)
                                                             console.log('getAll_qrCode2',getAll_qrCode)
                                                            const userData1 = await getUserData(result.insertId);
                                                            console.log('userData1',userData1)
                                                            
                                                            const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                                                            
                                                            console.log('pdfBytes',pdfBytes)
                            
                                                            const updatePdf = `UPDATE booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                                                            dbConnection.query(updatePdf, async function (err, result2) {
                                                            console.log(result2);
                                                                });
                            
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
                         
                        }else{
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,frequency,category_id) VALUES ('"+userData[0].id+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+frequency+"','"+category_id+"')";
                            dbConnection.query(sql, function (err, resultsub) {
                            orderAddress(userData[0].id,resultsub.insertId)

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
                if(total_loads > Number(resultss[0].total_loads)){
                    res.json({'status':false,"message":'Insufficient loads,Please buy loads'});  
                }else{
                    var resData = [];
                    // console.log('allDates',allDates)
                    allDates.forEach(function callback(element, key)
                    {
                        var frequencyDate = new Date(allDates[key]);
                        const frequencyDBDate = dateFormat.format(frequencyDate,'YYYY-MM-DD');

                        const checkIfDateExist = "select count(id) as tpyedate from bookings where date = '"+frequencyDBDate+"' and user_id = '"+userData[0].id+"' and order_type = 3";
                        dbConnection.query(checkIfDateExist, async function (error, checkIfresults) {
                        if(checkIfresults[0].tpyedate == 0){


                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                       
                    var driver_id = await assignDriver(userData[0].id,frequencyDBDate,current_time)

                      
                            var sql = "INSERT INTO bookings (user_id,date,time,total_loads,order_type,driver_id,drop_drive_id,cron_status,category_id,is_admin) VALUES ('"+userData[0].id+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','4','"+driver_id+"','"+driver_id+"',1,'"+category_id+"','"+isAdmin+"')";
                           
                            dbConnection.query(sql,async function (err, result) {
                            orderAddress(userData[0].id,result.insertId)

                                const qrCodesArray = [];
                                const insertIds=[]
                                for (let i = 0; i < total_loads; i++) {
                                    const sql = "INSERT INTO dry_clean_booking_qr (booking_id, qr_code) VALUES (?, ?)";
                                    const values = [result.insertId, randomNumber(result.insertId)];
                            
                                    await new Promise((resolve, reject) => {
                                        dbConnection.query(sql, values, function (err, results) {
                                 
                                            if (err) {
                                                reject(err);
                                            } else {
                                                const sql2 = `SELECT qr_code FROM dry_clean_booking_qr WHERE id=${results.insertId}`;
                                                dbConnection.query(sql2, function (err, result1) {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        qrCodesArray.push(result1[0].qr_code);
                                                        insertIds.push(results.insertId);
                                                        resolve();
                                                    }
                                                });
                                            }
                                        });
                                    });
                                }
                            const qr_codes = qrCodesArray.join(",")
                             const getAll_qrCode= await generateQRCode(qrCodesArray)
                            const userData1 = await getUserData(result.insertId);
                            
                            const pdfBytes = await generatePDF(userData1, getAll_qrCode);
                            

                            const updatePdf = `UPDATE dry_clean_booking_qr SET pdf = '${pdfBytes}' WHERE id IN (${insertIds.join(',')})`;
                            dbConnection.query(updatePdf, async function (err, result2) {
                  
                                });
                            

                                if(category_id == 1){
                                var usrLoadsD = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                                }else if(category_id == 2){
                                var usrLoadsD = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                                }else{
                                var usrLoadsD = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                                }
                                dbConnection.query(usrLoadsD, function (error, resultssD) {

                                

                                var updateLoads = (resultssD[0].total_loads - total_loads);

                                if(category_id == 1){
                                    var usrLoadsup = "update customer_loads_availabilty set  commercial = '"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                                }else if(category_id == 2){
                                    var usrLoadsup = "update customer_loads_availabilty set residential ='"+updateLoads+"' where user_id = '"+userData[0].id+"'";
                                }else{
                                    var usrLoadsup = "update customer_loads_availabilty set yeshiba = '"+updateLoads+"' where user_id = '"+userData[0].id+"' ";
                                }
                                // console.log('usrLoadsup',usrLoadsup)
                                dbConnection.query(usrLoadsup, function (error, resultUserUP) {
                                })

                            })
                                var bookingsql = "INSERT INTO booking_images (booking_id) VALUES ('"+result.insertId+"')";
                                dbConnection.query(bookingsql, function (err, bookingresult) {

                                });
                                console.log('order_idTOP',result.insertId)

                                var bookingsql = "INSERT INTO booking_timing (booking_id) VALUES ('"+result.insertId+"')";
                                dbConnection.query(bookingsql, function (err, bookingresult) {

                                });

                                var order_id = '1001'+result.insertId;
                                var sql = "update bookings set order_id = '"+order_id+"'where id = '"+result.insertId+"'";
                                console.log('sqlLat',sql)
                                dbConnection.query(sql, function (err, resultss) {
                                });
                            }); 
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

export const subscription_dates_fre = async(req,res)=>{

        try { 
            const userData = res.user;
            var datetime = new Date();
            var resData = [];
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select id ,date, order_type,frequency from bookings where user_id = '"+userData[0].id+"' and date >= '"+currentFinalDate+"' and order_type = 2 order by date desc";
             dbConnection.query(sql, function (err, resultss) {
            
                res.json({'status':true,"message":"user subscriptions list",'data':resultss,'order_type':2});
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
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

export const subscription_dates_custom = async(req,res)=>{

        try { 
            const userData = res.user;
            var datetime = new Date();
            var resData = [];
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select id ,date, order_type from bookings where user_id = '"+userData[0].id+"' and date >= '"+currentFinalDate+"' and order_type = 4 order by date desc";
             dbConnection.query(sql, function (err, resultss) {
            
                res.json({'status':true,"message":"user subscriptions list",'data':resultss,'order_type': 4});
            });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const booking_tracking_status = async(req,res)=>{

        try { 
            var resData = [];
            
            const userData = res.user;
            var datetime = new Date();
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            var sql = "select bookings.id,booking_images.wash_images,booking_images.dry_images,booking_images.fold_images,booking_images.pack_images,booking_images.drop_image,bookings.order_status,bookings.order_type,booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.driver_pick_date, ' ', booking_timing.driver_pick_time) AS pickup_confirm_date ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date,CONCAT(booking_timing.dry_date, ' ', booking_timing.dry_time) AS dry_date,CONCAT(booking_timing.fold_date, ' ', booking_timing.fold_time) AS fold_date,CONCAT(booking_timing.pack_date, ' ', booking_timing.pack_time) AS pack_date from bookings left join booking_timing on bookings.id = booking_timing.booking_id left join booking_images on booking_images.booking_id = bookings.id where bookings.order_status != 0 and bookings.user_id = '"+userData[0].id+"' and booking_timing.driver_pick_time IS NOT NULL";
            dbConnection.query(sql, function (err, resultss) {
            if(resultss){
            resultss.forEach(element =>
            {

                var resPickImg = [];
                var resWashImg = [];
                var resDryImg = [];
                var resPackImg = [];
                var resFoldImg = [];
                const {id,order_type,dry_images,wash_images,fold_images,pack_images,dry_date,fold_date,pack_date,order_status,pickup_images,wash_date,request_confirm_date,status,pickup_confirm_date,drop_image,driver_pickup_status} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.S3_URL+img;
                    })
                }

                if(wash_images){
                    const wash_images_array = wash_images.split(',');
                    console.log('wash_images_array',wash_images_array)
                    wash_images_array.forEach(function callback(img, key)
                    {
                        resWashImg[key] = process.env.S3_URL+img;
                    })
                    console.log('resWashImg',resWashImg)
                }

                if(dry_images){
                    const dry_images_array = dry_images.split(',');
                    dry_images_array.forEach(function callback(img, key)
                    {
                        resDryImg[key] = process.env.S3_URL+img;
                    })
                }

                if(fold_images){
                    const fold_images_array = fold_images.split(',');
                    fold_images_array.forEach(function callback(img, key)
                    {
                        resFoldImg[key] = process.env.S3_URL+img;
                    })
                }

                if(pack_images){
                    const pack_images_array = pack_images.split(',');
                    pack_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.S3_URL+img;
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
export const booking_tracking_status_both = async(req,res)=>{

        try { 
            const userData = res.user;

            var resData = [];
            var resPickImg = [];
            var resWashImg = [];
            var resDryImg = [];
            var resPackImg = [];
            var resFoldImg = [];
            var resInsImg = [];
            var resCleanImg = [];
            var resSpotImg = [];
            var resTagImg = [];
            var resInspectImg = [];
       
                var sql = "select bookings.id,bookings.order_id,bookings.order_type, dry_clean_booking_images.tagging_images,dry_clean_booking_images.spoting_images,dry_clean_booking_images.cleaning_images,dry_clean_booking_images.inspect_images,dry_clean_booking_images.drop_image,dry_clean_booking_images.press_images,dry_clean_booking_images.package_images,dry_clean_booking_images.pickup_images,bookings.status,CONCAT(dry_clean_booking_timing.driver_pick_date, ' ', dry_clean_booking_timing.driver_pick_time) AS bpickup_confirm_date ,CONCAT(dry_clean_booking_timing.tagging_date, ' ', dry_clean_booking_timing.tagging_time) AS tagging_date,CONCAT(dry_clean_booking_timing.spotting_date, ' ', dry_clean_booking_timing.spotting_time) AS spotting_date,CONCAT(dry_clean_booking_timing.cleaning_date, ' ', dry_clean_booking_timing.cleaning_time) AS cleaning_date,CONCAT(dry_clean_booking_timing.inspect_date, ' ', dry_clean_booking_timing.inspect_time) AS inspect_date,CONCAT(dry_clean_booking_timing.press_date, ' ', dry_clean_booking_timing.press_time) AS press_date,CONCAT(dry_clean_booking_timing.package_date, ' ', dry_clean_booking_timing.package_time) AS package_date,CONCAT(dry_clean_booking_timing.deliever_date, ' ', dry_clean_booking_timing.deliever_time) AS bdeliever_date ,booking_images.wash_images,booking_images.dry_images,booking_images.fold_images,booking_images.pack_images,booking_images.drop_image,booking_images.pickup_images as bpickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.driver_pick_date, ' ', booking_timing.driver_pick_time) AS pickup_confirm_date ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date,CONCAT(booking_timing.dry_date, ' ', booking_timing.dry_time) AS dry_date,CONCAT(booking_timing.fold_date, ' ', booking_timing.fold_time) AS fold_date,CONCAT(booking_timing.pack_date, ' ', booking_timing.pack_time) AS pack_date,CONCAT(booking_timing.deliever_date, ' ', booking_timing.deliever_time) AS cdeliever_date from bookings left join dry_clean_booking_timing on bookings.id = dry_clean_booking_timing.booking_id LEFT join booking_images on bookings.id = booking_images.booking_id LEFT join booking_timing on bookings.id = booking_timing.booking_id left join dry_clean_booking_images on dry_clean_booking_images.booking_id = bookings.id where user_id = '"+userData[0].id+"' and order_status != 6 and cron_status = 1";

            dbConnection.query(sql, function (err, sqlResult) {
                // console.log('sad',sqlResult)
            sqlResult.forEach(ele => {
                const {id,order_type,order_id,tagging_date,press_images,tagging_images,spotting_date,cleaning_date,inspect_date,dry_images,wash_images,fold_images,pack_images,dry_date,fold_date,pack_date,order_status,pickup_images,bpickup_images,wash_date,request_confirm_date,status,pickup_confirm_date,cleaning_images,spoting_images,press_date,package_date,drop_image,driver_pickup_status,inspect_images,package_images} = ele;
                if(order_type == 3){
                    if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.S3_URL+img;
                    })
                    var pickup_status = 1;
                }else{
                    var pickup_status = 0;
                    resPickImg = [];
                }

                if(press_images){
                    const press_images_array = press_images.split(',');
                    press_images_array.forEach(function callback(img, key)
                    {
                        resInspectImg[key] = process.env.S3_URL+img;
                    })
                    var press_status = 1;
                }else{
                    var press_status = 0;
                    resInspectImg = [];
                }

                if(tagging_images){
                    const tagging_images_array = tagging_images.split(',');
                    tagging_images_array.forEach(function callback(img, key)
                    {
                        resTagImg[key] = process.env.S3_URL+img;
                    })
                    var tagging_status = 1;

                }else{
                    var tagging_status = 0;
                    resTagImg = [];
                }

                if(spoting_images){
                    const spoting_images_array = spoting_images.split(',');
                    spoting_images_array.forEach(function callback(img, key)
                    {
                        resSpotImg[key] = process.env.S3_URL+img;
                    })
                    var spoting_status = 1;

                }else{
                    var spoting_status = 0;
                    resSpotImg = [];
                }

                if(cleaning_images){
                    const cleaning_images_array = cleaning_images.split(',');
                    cleaning_images_array.forEach(function callback(img, key)
                    {
                        resCleanImg[key] = process.env.S3_URL+img;
                    })
                    var cleaning_status = 1;

                }else{
                    var cleaning_status = 0;
                    resCleanImg = [];
                }

                if(inspect_images){
                    const inspect_images_array = inspect_images.split(',');
                    inspect_images_array.forEach(function callback(img, key)
                    {
                        resInsImg[key] = process.env.S3_URL+img;
                    })
                    var inspect_status = 1;

                }else{
                    var inspect_status = 0;
                    resInsImg = [];
                }

                if(package_images){
                    const package_images_array = package_images.split(',');
                    package_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.S3_URL+img;
                    })
                    var package_status = 1;

                }else{
                    var package_status = 0;
                    resPackImg = [];
                }
            const laundry_detail = [
                      {
                        title: "Pickup Request",
                        status:1,
                        imageList: [],
                        date: request_confirm_date 
                      },
                      {
                        title: "Tagging",
                        imageList: resTagImg,
                        status:tagging_status,
                        date: tagging_date || ''
                      }, 
                      {
                        title: "Spoting Stains",
                        imageList: resSpotImg,
                        status:spoting_status,
                        date: spotting_date || ''
                      },
                      {
                        title: "Cleaning",
                        imageList: resCleanImg,
                        status:cleaning_status,
                        date: cleaning_date || ''
                      },
                      {
                        title: "Inspect / Reclean",
                        imageList: resInsImg,
                        status:inspect_status,
                        date: inspect_date || ''
                      },
                      {
                        title: "Press",
                        imageList: resInspectImg,
                        status:press_status,
                        date: press_date || ''
                      }, 
                      {
                        title: "Package",
                        imageList: resPackImg,
                        status:package_status,
                        imageList: resTagImg,
                        date: package_date || ''
                      }
                    ];
                    console.log('laundry_detail',laundry_detail)
                    const init = {
                    'id':id,'order_id':order_id,'order_type':order_type,"laundry_detail":laundry_detail
                    }
                    resData.push(init)
                }else{
                    if(bpickup_images){
                    const pickup_images_array = bpickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.S3_URL+img;
                    })
                    // var pickup_status = 1;

                }else{
                    // var pickup_status = 0;
                    resPickImg = [];
                }

                if(wash_images){
                    const wash_images_array = wash_images.split(',');
                    wash_images_array.forEach(function callback(img, key)
                    {
                        resWashImg[key] = process.env.S3_URL+img;
                    })
                    var wash_status = 1;

                }else{
                    var wash_status = 0;
                    resWashImg = [];

                }

                if(dry_images){
                    const dry_images_array = dry_images.split(',');
                    dry_images_array.forEach(function callback(img, key)
                    {
                        resDryImg[key] = process.env.S3_URL+img;
                    })
                    var dry_status = 1;

                }else{
                    var dry_status = 0;
                    resDryImg = [];

                }

                if(fold_images){
                    const fold_images_array = fold_images.split(',');
                    fold_images_array.forEach(function callback(img, key)
                    {
                        resFoldImg[key] = process.env.S3_URL+img;
                    })
                    var fold_status = 1;

                }else{
                    var fold_status = 0;
                    resFoldImg = [];

                }

                if(pack_images){
                    const pack_images_array = pack_images.split(',');
                    pack_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.S3_URL+img;
                    })
                    var pack_status = 1;

                }else{
                    var pack_status = 0;
                    resPackImg = [];
                }
                    const laundry_detail = [
                      {
                        title: "Pickup Request",
                        status:1,
                        imageList: [],
                        date: request_confirm_date
                      },
                      {
                        title: "Wash",
                        imageList: resWashImg,
                        status:wash_status,
                        date: wash_date || ''
                      },
                      {
                        title: "Dry",
                        imageList: resDryImg,
                        status:dry_status,
                        date: dry_date || ''
                      },
                      {
                        title: "Fold",
                        imageList: resFoldImg,
                        status:fold_status,
                        date: fold_date || ''
                      },
                      {
                        title: "Pack",
                        imageList: resPackImg,
                        status:pickup_status,
                        date: pack_date || ''
                      }
                    ];

                const initi = {
                    "id":id,'order_id':order_id,'order_type':order_type,'laundry_detail':laundry_detail
                }
                    resData.push(initi)

                }
            })
                res.json({'status':true,"message":"user order list",'data':resData});
            })
            

           

          
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }


}

export const booking_tracking_details = async(req,res)=>{

        const {booking_id,type} = req.body;
        try { 
            var resData = [];
            var resPickImg = [];
            var resWashImg = [];
            var resDryImg = [];
            var resPackImg = [];
            var resFoldImg = [];
            var resInsImg = [];
            var resCleanImg = [];
            var resSpotImg = [];
            var resTagImg = [];
            var resInspectImg = [];
            var pickup_status = 0;
            var press_status = 0;
            var tagging_status = 0;
            var spoting_status = 0;
            var cleaning_status = 0;
            var inspect_status = 0;
            var package_status = 0;

            var bag_status = 0;
            var pack_status = 0;
            var fold_status = 0;
            var dry_status = 0;
            var wash_status = 0;


            const userData = res.user;
            var datetime = new Date();
            const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            if(type == 3){
                var sql = "select bookings.id,order_billing_address.address,bookings.category_id,bookings.total_amount,bookings.user_id,bookings.extra_loads,bookings.total_loads,bookings.order_id,dry_clean_booking_images.tagging_images,dry_clean_booking_images.spoting_images,dry_clean_booking_images.cleaning_images,dry_clean_booking_images.inspect_images,dry_clean_booking_images.drop_image,dry_clean_booking_images.press_images,dry_clean_booking_images.package_images,bookings.order_status,bookings.order_type,dry_clean_booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(dry_clean_booking_timing.driver_pick_date, ' ', dry_clean_booking_timing.driver_pick_time) AS pickup_confirm_date ,CONCAT(dry_clean_booking_timing.tagging_date, ' ', dry_clean_booking_timing.tagging_time) AS tagging_date,CONCAT(dry_clean_booking_timing.spotting_date, ' ', dry_clean_booking_timing.spotting_time) AS spotting_date,CONCAT(dry_clean_booking_timing.cleaning_date, ' ', dry_clean_booking_timing.cleaning_time) AS cleaning_date,CONCAT(dry_clean_booking_timing.inspect_date, ' ', dry_clean_booking_timing.inspect_time) AS inspect_date,CONCAT(dry_clean_booking_timing.press_date, ' ', dry_clean_booking_timing.press_time) AS press_date,CONCAT(dry_clean_booking_timing.package_date, ' ', dry_clean_booking_timing.package_time) AS package_date,CONCAT(dry_clean_booking_timing.deliever_date, ' ', dry_clean_booking_timing.deliever_time) AS deliever_date,users.email,users.mobile,users.name ,ratings.rating_id,ratings.rating_feedback  from bookings left join dry_clean_booking_timing on bookings.id = dry_clean_booking_timing.booking_id left join ratings on ratings.booking_id = bookings.id left join dry_clean_booking_images on dry_clean_booking_images.booking_id = bookings.id left join order_billing_address on order_billing_address.booking_id=bookings.id left join users on users.id=bookings.user_id  where bookings.id = '"+booking_id+"'";
            }else{
            var sql = "select bookings.id,order_billing_address.address,bookings.category_id,bookings.total_amount,bookings.user_id,bookings.extra_loads,bookings.total_loads,bookings.order_id,booking_images.wash_images,booking_images.dry_images,booking_images.fold_images,booking_images.pack_images,booking_images.drop_image,bookings.order_status,bookings.order_type,booking_images.pickup_images,bookings.created_at as request_confirm_date,bookings.status,CONCAT(booking_timing.driver_pick_date, ' ', booking_timing.driver_pick_time) AS pickup_confirm_date ,CONCAT(booking_timing.wash_date, ' ', booking_timing.wash_time) AS wash_date,CONCAT(booking_timing.dry_date, ' ', booking_timing.dry_time) AS dry_date,CONCAT(booking_timing.fold_date, ' ', booking_timing.fold_time) AS fold_date,CONCAT(booking_timing.pack_date, ' ', booking_timing.pack_time) AS pack_date,CONCAT(booking_timing.deliever_date, ' ', booking_timing.deliever_time) AS deliever_date, users.email,users.mobile, users.name, ratings.rating_id,ratings.rating_feedback from bookings left join ratings on ratings.booking_id = bookings.id left join booking_timing on bookings.id = booking_timing.booking_id left join booking_images on booking_images.booking_id = bookings.id left join order_billing_address on order_billing_address.booking_id=bookings.id left join users on users.id=bookings.user_id where bookings.id = '"+booking_id+"'";
            }
            console.log('tracking_sql',sql)
            dbConnection.query(sql, function (err, resultss) {
            if(resultss){
            if(type == 3){
            resultss.forEach(element =>
            {
                const {id,category_id,address,extra_loads,total_amount,total_loads,package_date,order_type,inspect_date,cleaning_date,tagging_date,deliever_date,order_id,tagging_images,spoting_images,cleaning_images,inspect_images,press_images,dry_date,fold_date,pack_date,order_status,package_images,spotting_date,pickup_images,press_date,wash_date,request_confirm_date,status,pickup_confirm_date,drop_image,driver_pickup_status,user_id,name,email,mobile,rating_id,rating_feedback} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.S3_URL+img;
                    })
                    var pickup_status = 1;
                }else{
                    var pickup_status = 0;
                    resPickImg = [];
                }

                if(press_images){
                    const press_images_array = press_images.split(',');
                    press_images_array.forEach(function callback(img, key)
                    {
                        resInspectImg[key] = process.env.S3_URL+img;
                    })
                    var press_status = 1;
                }else{
                    var press_status = 0;
                    resInspectImg = [];
                }

                if(tagging_images){
                    const tagging_images_array = tagging_images.split(',');
                    tagging_images_array.forEach(function callback(img, key)
                    {
                        resTagImg[key] = process.env.S3_URL+img;
                    })
                    var tagging_status = 1;

                }else{
                    var tagging_status = 0;
                    resTagImg = [];
                }

                if(spoting_images){
                    const spoting_images_array = spoting_images.split(',');
                    spoting_images_array.forEach(function callback(img, key)
                    {
                        resSpotImg[key] = process.env.S3_URL+img;
                    })
                    var spoting_status = 1;

                }else{
                    var spoting_status = 0;
                    resSpotImg = [];
                }

                if(cleaning_images){
                    const cleaning_images_array = cleaning_images.split(',');
                    cleaning_images_array.forEach(function callback(img, key)
                    {
                        resCleanImg[key] = process.env.S3_URL+img;
                    })
                    var cleaning_status = 1;

                }else{
                    var cleaning_status = 0;
                    resCleanImg = [];
                }

                if(inspect_images){
                    const inspect_images_array = inspect_images.split(',');
                    inspect_images_array.forEach(function callback(img, key)
                    {
                        resInsImg[key] = process.env.S3_URL+img;
                    })
                    var inspect_status = 1;

                }else{
                    var inspect_status = 0;
                    resInsImg = [];
                }

                if(package_images){
                    const package_images_array = package_images.split(',');
                    package_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.S3_URL+img;
                    })
                    var package_status = 1;

                }else{
                    var package_status = 0;
                    resPackImg = [];
                }
                if(deliever_date){
                   var bag_status = 1;
                }else{
                   var bag_status = 0;

                }

                    const laundry_detail = [
                      {
                        title: "Pickup Request",
                        status:pickup_status,
                        imageList: [],
                        date: request_confirm_date || ''
                      },
                      {
                        title: "Tagging",
                        imageList: resTagImg,
                        status:tagging_status,
                        date: tagging_date || ''
                      }, 
                      {
                        title: "Spoting Stains",
                        imageList: resSpotImg,
                        status:spoting_status,
                        date: spotting_date || ''
                      },
                      {
                        title: "Cleaning",
                        imageList: resCleanImg,
                        status:cleaning_status,
                        date: cleaning_date || ''
                      },
                      {
                        title: "Inspect / Reclean",
                        imageList: resInsImg,
                        status:inspect_status,
                        date: inspect_date || ''
                      },
                      {
                        title: "Press",
                        imageList: resInspectImg,
                        status:press_status,
                        date: press_date || ''
                      }, 
                      {
                        title: "Package",
                        imageList: resPackImg,
                        status:package_status,
                        imageList: resTagImg,
                        date: package_date || ''
                      }, 
                      {
                        title: "Bags Delivered",
                        status:bag_status,
                        imageList: [],

                        date: deliever_date || ''
                      }
                    ];

                    if(rating_id){
                        var rating = rating_id;
                        var rating_feed = rating_feedback.split(',');
                    }else{
                        var rating = 0;
                        var rating_feed = [];
                    }

                const initi = {
                    "id":id,"category_id":category_id,"address":address,'total_amount':total_amount || '0','rating_id':rating,'rating_feedback':rating_feed,"user_id":user_id,"name":name,"email":email,"mobile":mobile,"order_id":order_id,"order_type":order_type,'laundry_detail':laundry_detail
                }
                res.json({'status':true,"message":"user order list","order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,'extra_loads':extra_loads,'total_loads':total_loads,'deliever_date':deliever_date || '','data':initi});
            })
            }else{
            resultss.forEach(element =>
            {
                const {id,category_id,address,rating_id,total_amount,rating_feedback,extra_loads,total_loads,order_type,deliever_date,order_id,dry_images,wash_images,fold_images,pack_images,dry_date,fold_date,pack_date,order_status,pickup_images,wash_date,request_confirm_date,status,pickup_confirm_date,drop_image,driver_pickup_status,user_id,name,email,mobile} = element;
                if(pickup_images){
                    const pickup_images_array = pickup_images.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        resPickImg[key] = process.env.S3_URL+img;
                    })
                    var pickup_status = 1;

                }else{
                    var pickup_status = 0;
                    resPickImg = [];
                }

                if(wash_images){
                    const wash_images_array = wash_images.split(',');
                    wash_images_array.forEach(function callback(img, key)
                    {
                        resWashImg[key] = process.env.S3_URL+img;
                    })
                    var wash_status = 1;

                }else{
                    var wash_status = 0;
                    resWashImg = [];
                }

                if(dry_images){
                    const dry_images_array = dry_images.split(',');
                    dry_images_array.forEach(function callback(img, key)
                    {
                        resDryImg[key] = process.env.S3_URL+img;
                    })
                    var dry_status = 1;

                }else{
                    var dry_status = 0;
                    resDryImg = [];
                }

                if(fold_images){
                    const fold_images_array = fold_images.split(',');
                    fold_images_array.forEach(function callback(img, key)
                    {
                        resFoldImg[key] = process.env.S3_URL+img;
                    })
                    var fold_status = 1;

                }else{
                    var fold_status = 0;
                    resFoldImg = [];
                }

                if(pack_images){
                    const pack_images_array = pack_images.split(',');
                    pack_images_array.forEach(function callback(img, key)
                    {
                        resPackImg[key] = process.env.S3_URL+img;
                    })
                    var pack_status = 1;

                }else{
                    var pack_status = 0;
                    resPackImg = [];
                }

                if(deliever_date){
                   var bag_status = 1;
                }else{
                   var bag_status = 0;

                }
                    const laundry_detail = [
                      {
                        title: "Pickup Request",
                        status:pickup_status,
                        imageList: [],
                        date: request_confirm_date || ''
                      },
                      {
                        title: "Wash",
                        imageList: resWashImg,
                        status:wash_status,
                        date: wash_date || ''
                      },
                      {
                        title: "Dry",
                        imageList: resDryImg,
                        status:dry_status,
                        date: dry_date || ''
                      },
                      {
                        title: "Fold",
                        imageList: resFoldImg,
                        status:fold_status,
                        date: fold_date || ''
                      },
                      {
                        title: "Pack",
                        imageList: resPackImg,
                        status:pickup_status,
                        date: pack_date || ''
                      }, 
                      {
                        title: "Bags Delivered",
                        status:bag_status,
                        imageList: [],
                        date: deliever_date || ''
                      }
                    ];

                    if(rating_id){
                        var rating = rating_id;
                        var rating_feed = rating_feedback.split(',');
                    }else{
                        var rating = 0;
                        var rating_feed = [];
                    }
                    if(type == 1){
                        const pamentSQL = "select amount from payment where booking_id = '"+booking_id+"'";
                        dbConnection.query(pamentSQL, function (err, resultss) {
                            if (resultss?.length > 0) {
                                var initi = {
                                "id":id,"category_id":category_id,"address":address,'extra_charge':resultss[0].amount,'total_amount':total_amount || '0','rating_id':rating,'rating_feedback':rating_feed,"order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,"order_type":order_type,'laundry_detail':laundry_detail
                                }

                            }else{

                               var initi = {
                                "id":id,"category_id":category_id,"address":address,'extra_charge':0,'total_amount':total_amount || '0','rating_id':rating,'rating_feedback':rating_feed,"order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,"order_type":order_type,'laundry_detail':laundry_detail
                                } 
                            }
                            res.json({'status':true,"message":"user order list","order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,'extra_loads':extra_loads,'total_loads':total_loads,'deliever_date':deliever_date || '','data':initi});
                        })
                    }else{

                const initi = {
                    "id":id,"category_id":category_id,"address":address,'total_amount':total_amount || '0','rating_id':rating,'rating_feedback':rating_feed,"order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,"order_type":order_type,'laundry_detail':laundry_detail
                }
                res.json({'status':true,"message":"user order list","order_id":order_id,"user_id":user_id,"name":name,"email":email,"mobile":mobile,'extra_loads':extra_loads,'total_loads':total_loads,'deliever_date':deliever_date || '','data':initi});
                }
            })
            }
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
                    res.json({'status':true,"message":"Driver has been assigned successfully!"});
                }); 
        }else{
            res.json({'status':false,"message":"All fields are required"});
        }
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const assign_drop_driver = async(req,res)=>{
     try {
        const {booking_id,driver_id} = req.body;
        if(booking_id  && driver_id ){
                var sql = "update bookings set drop_drive_id = '"+driver_id+"' where id = '"+booking_id+"'";
                dbConnection.query(sql, function (error, result) {
                if (error) throw error;
                    res.json({'status':true,"message":"Driver has been assigned successfully!"});
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
                    res.json({'status':true,"message":"Folder assigned successfully!"});
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

export const get_rating_details = async(req,res)=>{

        try { 
            const userData = res.user;
            const {rating_id} = req.body;
            var sql = "select id,feedback from wc_rating_feeback where rating_id = '"+rating_id+"' and isDelete = 0";
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Rating List",'data':results});
            }); 
        }catch (error) {
            res.json({'status':false,"message":error.message});  
        }
}


export const booking_rating = async(req,res)=>{

    try { 
        const userData = res.user;
        const { booking_id,rating_feedback,rating_id} = req.body;
        if(booking_id  && rating_feedback && rating_id ){
            var sql = "INSERT INTO ratings (booking_id,user_id,rating_feedback,rating_id) VALUES ('"+booking_id+"','"+userData[0].id+"','"+rating_feedback+"',"+rating_id+")";
            dbConnection.query(sql, function (err, results) {
                res.json({'status':true,"message":"Rating submitted successfully"});
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
            const sql = "select bookings.date,bookings.order_type ,bookings.id,ratings.rating_feedback,ratings.rating_id,dry_clean_booking_timing.deliever_time as dryCleanDelTime,dry_clean_booking_timing.deliever_date as dryCleanDelDate ,bookings.time, bookings.total_loads,booking_images.drop_image,dry_clean_booking_images.drop_image as dryCleanDropImage,booking_timing.deliever_date,booking_timing.deliever_time from bookings left join booking_timing on booking_timing.booking_id = bookings.id left join booking_images on booking_images.booking_id = bookings.id left join ratings on bookings.id = ratings.booking_id left join dry_clean_booking_images on dry_clean_booking_images.booking_id = bookings.id left join dry_clean_booking_timing on dry_clean_booking_timing.booking_id = bookings.id where bookings.order_status = 6 and bookings.user_id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (err, results) {
                results.forEach(ele => {
                const {id,date,rating_feedback_id,order_type,dryCleanDropImage,time,total_loads,drop_image,deliever_date,deliever_time,dryCleanDelTime,dryCleanDelDate,rating_id} = ele;
                if(order_type != 3){
                var delivery_time = deliever_time;
                var delivery_date = deliever_date;
                var imageList = []
                if(drop_image){
                    const pickup_images_array = drop_image.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        imageList[key] = process.env.S3_URL+img;
                    })
                }else{
                    var imageList = [];
                }
                }else{
                var delivery_time = dryCleanDelTime;
                var delivery_date = dryCleanDelDate;
                if(dryCleanDropImage){
                var imageList = []
                    const pickup_images_array = dryCleanDropImage.split(',');
                    pickup_images_array.forEach(function callback(img, key)
                    {
                        imageList[key] = process.env.S3_URL+img;
                    })
                
                }else{
                    var imageList = [];
                }
                }

                    const init = {
                        'id':id,'date':date,'rating_id':rating_id,'time':time,'order_type':order_type,'total_loads':total_loads,'deliever_date':delivery_date,'deliever_time':delivery_time,'images':imageList
                    }
                    resData.push(init)
                })
                res.json({'status':true,"message":"Order history",'data':resData});
            });
     }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

  export const add_bin = async (req, res) => {
    try {
        const userData = res.user;
        const { booking_id, bin } = req.body;
        if(booking_id  && bin ){
        
            const sql = `UPDATE bookings SET bin = ?, order_status = 4 WHERE id = ${booking_id}`;
            
            dbConnection.query(sql, [bin], function (updateerror, updateResult) {
                if (updateerror) {
                    return res.json({ status: false, message: updateerror.message });
                }
                res.json({ status: true, message: 'Bin added successfully' });
            });
        }else{
            res.json({'status':false,"message":"All fields are required"});

        }
    } catch (error) {
        res.json({ status: false, message: error.message });
    }
};

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
    get_rating_details,
    subscription_dates_fre,
    subscription_dates_custom,
    assign_drop_driver,
    booking_history,
    booking_tracking_status_both,
    booking_rating,
    add_bin
}