import dbConnection from'../../config/db.js';

//get loads API
export const get_orders = async(req,res)=>{
      try { 
        	const loads = "select id,type,loads,price,status from admin_load_subscription";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"data get successfully!",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export default {
	get_orders
}