import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';


//get loads API
export const get_loads = async(req,res)=>{
      try { 
            const userData = res.user;
            const {category_id} = req.body;
        	const loads = "select id,type,loads,price,note from admin_packages where category_id = '"+category_id+"' and status = 1 and isDelete = 0";
			dbConnection.query(loads, function (error, data) {
            const extraSQL = "select extra_chages from settings";
            dbConnection.query(extraSQL, function (error, extraSQLResult) {
			if (error) throw error;
				res.json({'status':true,"message":"data get successfully!",'data':data, 'card_status':userData[0].card_status,'extra_charges':extraSQLResult[0].extra_chages});
			})
            })
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//customer load subscription API
export const customer_loads_subscription = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	type,buy_loads,amount,category_id } = req.body;
        if(	type && buy_loads && amount){
	        var sql = "INSERT INTO customer_loads_subscription (user_id,category_id,type,buy_loads,amount) VALUES ('"+userData[0].id+"','"+category_id+"','"+type+"', '"+buy_loads+"','"+amount+"')";
	        dbConnection.query(sql, function (error, results) {
	        // if (error) throw error;

            const checkifloadexist = "select count(id) as total from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            dbConnection.query(checkifloadexist, function (error, loaddata) {
            if(loaddata[0].total == 0){
                var sql = "INSERT INTO customer_loads_availabilty (user_id) VALUES ('"+userData[0].id+"')";
                    dbConnection.query(sql, function (error, result) {
                })
            }
            })

            const loads = "select * from customer_loads_subscription where id = '"+results.insertId+"'";
            dbConnection.query(loads, function (error, data) {
            if (error) throw error;
                res.json({'status':true,"message":"Loads added successfully!",'data':data[0]});
            })
	        });
    	}else{
            res.json({'status':false,"message":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
//get load price API
export const get_load_price = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	buy_loads} = req.body;
        // if(buy_loads){
	        var sql = "select loads_price from settings";
	        dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
                // const price = (result[0].loads_price * buy_loads)
                let data = {
                    "price":result[0].loads_price,
                }
	            res.json({'status':true,"message":"Price get successfully!",'data':data});
	        });
    	// }else{
     //        res.json({'status':false,"message":"All fields are required"});
    	// }
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


//get total load API
export const get_user_loads = async(req,res)=>{
     try { 
        const userData = res.user;
        const { category_id } = req.body;
        if(category_id){
          if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else{
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            // var sql = "select * from users where id = '"+userData[0].id+"'";
            dbConnection.query(usrLoads, function (error, result) {
            const extraSQL = "select extra_chages from settings";
            dbConnection.query(extraSQL, function (error, extraSQLResult) {
            if (error) throw error;
            if (result.length > 0){
            const available_loads = result[0].total_loads;
             let data = {
                    "available_loads":available_loads,
                }
                res.json({'status':true,"message":"Price get successfully!",'data':data,'card_status':userData[0].card_status,'extra_charges':extraSQLResult[0].extra_chages});

            }else{
                let nodata = {
                    "available_loads":'0',
                }
                res.json({'status':true,"message":"Price get successfully!",'data':nodata,'card_status':userData[0].card_status,'extra_charges':extraSQLResult[0].extra_chages});

            }
            })
      

            });
        }else{
            res.json({'status':false,"message":"category_id fields are required"});
        }
        
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//get total load API
export const get_user_subscription = async(req,res)=>{
     try { 
        const userData = res.user;
        var datetime = new Date();
        const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
            // var sql = "SELECT customer_loads_subscription.id,customer_loads_subscription.type, customer_loads_subscription.payment_status, customer_loads_subscription.user_id, customer_loads_subscription.buy_loads,customer_loads_subscription.amount, users.available_loads,users.id FROM customer_loads_subscription LEFT JOIN users ON customer_loads_subscription.user_id = users.id where customer_loads_subscription.type = 'package' and customer_loads_subscription.payment_status = '1' and customer_loads_subscription.category_id = '"+userData[0].category_id+"' and customer_loads_subscription.user_id = '"+userData[0].id+"' ORDER BY customer_loads_subscription.id desc limit 1;";
            var sql = "select * from customer_loads_subscription where type = 'package' and payment_status = 1 and user_id = '"+userData[0].id+"' ORDER BY id desc limit 1";
            console.log('sql',sql)
            dbConnection.query(sql, function (err, subscriptionresult) {
            if(subscriptionresult.length > 0){
            if(userData[0].category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(userData[0].category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else{
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (err, usrLoadsresult) {
            var bookingSQL = "select date from bookings where cron_status = 1 and user_id ='"+userData[0].id+"' and date > '"+currentFinalDate+"' limit 1";
            dbConnection.query(bookingSQL, function (err, bookingSQLresult) {
                if(bookingSQLresult.length > 0){
                    var next_pickup = bookingSQLresult[0].date;
                }else{
                    var next_pickup = 'Booking not confirmed yet';
                }
            var usrLoadsspe = "select * from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            dbConnection.query(usrLoadsspe, function (err, usrLoadssperesult) {

                let initi = {
                "id":subscriptionresult[0].id,"package":subscriptionresult[0].buy_loads+' Loads. Min 2 Load Pick Up per order',"price":subscriptionresult[0].amount,"pending_loads":usrLoadsresult[0].total_loads,'commercial':usrLoadssperesult[0].commercial,'residential':usrLoadssperesult[0].residential,'yeshiba':usrLoadssperesult[0].yeshiba,'next_pickup':next_pickup
                }
                    res.json({'status':true,"message":"Subscription get successfully!",'data':initi,'card_status':userData[0].card_status});
            })
        })

             })
}else{
        var getloadsSQL= "select * from customer_loads_subscription where type = 'individual' and payment_status = 1 and user_id = '"+userData[0].id+"' ORDER BY id desc limit 1"
        console.log('getloadsSQL',getloadsSQL)
        dbConnection.query(getloadsSQL, function (err, getloadsresult) {
            if(getloadsresult){
                var usrLoadss = "select * from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                dbConnection.query(usrLoadss, function (err, usrLoadsresult) {
                    if(usrLoadsresult.length > 0){
                        if(userData[0].category_id == 1){
                            var total_loads = usrLoadsresult[0].commercial;
                        }else if(userData[0].category_id == 2){
                            var total_loads = usrLoadsresult[0].residential;
                        }else if(userData[0].category_id == 3){
                            var total_loads = usrLoadsresult[0].yeshiba;
                        }else{
                            var total_loads = '0';
                        }
                            let initi = {
                                "id":usrLoadsresult[0].id,"package":'No Subscription Found',"price":usrLoadsresult[0].amount,"pending_loads":total_loads,'commercial':usrLoadsresult[0].commercial,'residential':usrLoadsresult[0].residential,'yeshiba':usrLoadsresult[0].yeshiba,'next_pickup':'No pickup'
                            }
                            res.json({'status':true,"message":"Subscription not found!",'data':initi});

                        
                    }else{
                        let initi = {
                            "id":0,"package":'No Subscription Found',"price":'0',"pending_loads":'0','commercial':'0','residential':'0','yeshiba':'0','next_pickup':'No pickup'
                        }
                        res.json({'status':true,"message":"Subscription not found!",'data':initi});
                    }
                })   
            }else{
                let initi = {
                    "id":0,"package":'No Subscription Found',"price":'0',"pending_loads":'0','commercial':'0','residential':'0','yeshiba':'0','next_pickup':'No pickup'
                }
                res.json({'status':true,"message":"Subscription not found!",'data':initi});

            }
        })
}
            });
        
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//get total load API
export const get_user_home_data = async(req,res)=>{
     try { 
        const userData = res.user;
        var datetime = new Date();
        const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
        const { category_id } = req.body;
        var sql = "select * from customer_loads_subscription where type = 'package' and payment_status = '1' and category_id = '"+category_id+"' and user_id = '"+userData[0].id+"' ORDER BY id desc limit 1";
        dbConnection.query(sql, function (err, subscriptionresult) {
        if(subscriptionresult.length > 0){
            if(category_id == 1){
                var usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }else if(category_id == 2){
                var usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";              
            }else if(category_id == 3){
                var usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
            }
            dbConnection.query(usrLoads, function (err, usrLoadsresult) {
                var usrLoadsspe = "select * from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                dbConnection.query(usrLoadsspe, function (err, usrLoadssperesult) {
                    var bookingSQL = "select date from bookings where cron_status = 1 and user_id ='"+userData[0].id+"' and date > '"+currentFinalDate+"' limit 1";
                    dbConnection.query(bookingSQL, function (err, bookingSQLresult) {
                        if(bookingSQLresult.length > 0){
                            var next_pickup = bookingSQLresult[0].date;
                        }else{
                            var next_pickup = 'Booking not confirmed yet';
                        }
                        let initi = {
                            "id":subscriptionresult[0].id,"package":subscriptionresult[0].buy_loads+' Loads. Min 2 Load Pick Up per order',"price":subscriptionresult[0].amount,"pending_loads":usrLoadsresult[0].total_loads,'commercial':usrLoadssperesult[0].commercial,'residential':usrLoadssperesult[0].residential,'yeshiba':usrLoadssperesult[0].yeshiba,'next_pickup':next_pickup
                        }
                        res.json({'status':true,"message":"Subscription get successfully!",'data':initi});
                    })
                })
            })

        }else{
        var getloadsSQL= "select * from customer_loads_subscription where type = 'individual' and payment_status = 1 and user_id = '"+userData[0].id+"' ORDER BY id desc limit 1"
        dbConnection.query(getloadsSQL, function (err, getloadsresult) {
            console.log('getloadsresult',getloadsresult)
            if(getloadsresult.length > 0){
                if(category_id == 1){
                    var usrLoadss = "select commercial as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                }else if(category_id == 2){
                    var usrLoadss = "select residential as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                }else{
                    var usrLoadss = "select yeshiba as total_loads from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                }
                console.log('usrLoadss',usrLoadss)
                dbConnection.query(usrLoadss, function (err, usrLoadsresult) {
                    if(usrLoadsresult.length > 0){
                        var usrLoads = "select * from customer_loads_availabilty where user_id = '"+userData[0].id+"'";
                        dbConnection.query(usrLoads, function (err, getloadsresult) {
                            let initi = {
                                "id":getloadsresult[0].id,"package":'No Subscription Found',"price":getloadsresult[0].amount,"pending_loads":usrLoadsresult[0].total_loads,'commercial':getloadsresult[0].commercial,'residential':getloadsresult[0].residential,'yeshiba':getloadsresult[0].yeshiba,'next_pickup':'No pickup'
                            }
                            res.json({'status':true,"message":"Subscription not found!",'data':initi});

                        }) 
                    }else{
                        let initi = {
                            "id":0,"package":'No Subscription Found',"price":'0',"pending_loads":'0','commercial':'0','residential':'0','yeshiba':'0','next_pickup':'No pickup'
                        }
                        res.json({'status':true,"message":"Subscription not found!",'data':initi});
                    }
                })   
            }else{
                let initi = {
                    "id":0,"package":'No Subscription Found',"price":'0',"pending_loads":'0','commercial':'0','residential':'0','yeshiba':'0','next_pickup':'No pickup'
                }
                res.json({'status':true,"message":"Subscription not found!",'data':initi});

            }
        })

    }
        })
    
            
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
        
}
export const cancel_subscriptioin = async(req,res)=>{
    try {
        const userData = res.user;
        var sql = "update customer_loads_subscription set payment_status = 0 where id = '"+id+"'";
        dbConnection.query(sql, function (err, subscriptionresult) {
            res.json({'status':true,"message":"Subscription deleted successfully!"});
        })
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export default {
	get_loads,
	customer_loads_subscription,
    get_load_price,
    get_user_subscription,
    get_user_loads,
    get_user_home_data
}