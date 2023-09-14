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
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}
//get load price API
export const get_load_price = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	buy_loads} = req.body;
        if(buy_loads){
	        var sql = "select loads_price from settings";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
                const price = (result[0].loads_price * buy_loads)
                let data = {
                    "price":price,
                }
	            res.json({'status':true,"messagae":"Price get successfully!",'data':data});
	        });
    	}else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}


//get total load API
export const get_user_loads = async(req,res)=>{
     try { 
        const userData = res.user;
            var sql = "select available_loads from users";
            dbConnection.query(sql, function (err, result) {
            if (err) throw err;
            const available_loads = result[0].available_loads;
             let data = {
                    "available_loads":available_loads,
                }
                res.json({'status':true,"messagae":"Price get successfully!",'data':data});
            });
        
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}

export default {
	get_loads,
	customer_loads_subscription,
    get_load_price,
    get_user_loads
}