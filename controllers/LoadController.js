import dbConnection from'../config/db.js';

//get loads API
export const get_loads = async(req,res)=>{
      try { 
        	const loads = "select id,type,loads,price,status from admin_load_subscription";
			dbConnection.query(loads, function (err, data) {
			if (err) throw err;
				res.json({'status':true,"messagae":"data get successfully!",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}

//customer load subscription API
export const customer_loads_subscription = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	type,buy_loads,amount} = req.body;
        if(	type && buy_loads && amount){
	        var sql = "INSERT INTO customer_loads_subscription (user_id,type,buy_loads,amount) VALUES ('"+userData[0].id+"','"+type+"', '"+buy_loads+"','"+amount+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	            res.json({'status':true,"messagae":"Load added successfully!"});
	        });
    	}else{
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}
//get load price API
export const get_load_price = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	type,buy_loads,amount} = req.body;
        if(	type && buy_loads && amount){
	        var sql = "INSERT INTO customer_loads_subscription (user_id,type,buy_loads,amount) VALUES ('"+userData[0].id+"','"+type+"', '"+buy_loads+"','"+amount+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	            res.json({'status':true,"messagae":"Load added successfully!"});
	        });
    	}else{
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}

export default {
	get_loads,
	customer_loads_subscription
}