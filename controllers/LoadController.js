import dbConnection from'../config/db.js';

//get loads API
export const get_loads = async(req,res)=>{
      try { 
            const userData = res.user;
            const {category_id} = req.body;
        	const loads = "select id,type,loads,price from admin_packages where category_id = '"+category_id+"'";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"data get successfully!",'data':data, 'card_status':userData[0].card_status});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//customer load subscription API
export const customer_loads_subscription = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	type,buy_loads,amount} = req.body;
        if(	type && buy_loads && amount){
	        var sql = "INSERT INTO customer_loads_subscription (user_id,category_id,type,buy_loads,amount) VALUES ('"+userData[0].id+"','"+userData[0].category_id+"','"+type+"', '"+buy_loads+"','"+amount+"')";
	        dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
           console.log(result)
            const loads = "select * from customer_loads_subscription where id = '"+result.insertId+"'";
            console.log('loads',loads)
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
            var sql = "select available_loads from users where id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (error, result) {
            if (error) throw error;
            const available_loads = result[0].available_loads;
             let data = {
                    "available_loads":available_loads,
                }
                res.json({'status':true,"message":"Price get successfully!",'data':data});
            });
        
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//get total load API
export const get_user_subscription = async(req,res)=>{
     try { 
        const userData = res.user;
            var sql = "SELECT customer_loads_subscription.id,customer_loads_subscription.type, customer_loads_subscription.payment_status, customer_loads_subscription.user_id, customer_loads_subscription.buy_loads,customer_loads_subscription.amount, users.available_loads,users.id FROM customer_loads_subscription LEFT JOIN users ON customer_loads_subscription.user_id = users.id where customer_loads_subscription.type = 'package' and customer_loads_subscription.payment_status = '1' and customer_loads_subscription.user_id = '"+userData[0].id+"' ORDER BY customer_loads_subscription.id desc limit 1;";
            console.log('sql',sql)
            dbConnection.query(sql, function (err, subscriptionresult) {
                let initi = {
                "id":subscriptionresult[0].id,"package":subscriptionresult[0].buy_loads+' Loads. Min 2 Load Pick Up per',"price":subscriptionresult[0].amount,"pending_loads":subscriptionresult[0].available_loads,
                }
                    res.json({'status':true,"message":"Subscription get successfully!",'data':initi});
            });
        
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export default {
	get_loads,
	customer_loads_subscription,
    get_load_price,
    get_user_subscription,
    get_user_loads
}