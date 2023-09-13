import dbConnection from'../config/db.js';

//customer booking API
export const customer_booking = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	delievery_day,date,total_loads,driver_id,order_type} = req.body;
        if(	delievery_day && date && total_loads && driver_id && order_type){

        var sql = "select available_loads from users where id = '"+userData[0].id+"'";
        dbConnection.query(sql, function (err, result) {
            if(total_loads > result[0].available_loads){
                res.json({'status':false,"messagae":'Insufficient loads,Please buy loads'});  
            }else{
                let dateObject = new Date();
                let hours = dateObject.getHours();
                let minutes = dateObject.getMinutes();
                const current_time = hours + ":" + minutes;
                var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,driver_id,order_type) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+date+"', '"+current_time+"','"+total_loads+"','"+driver_id+"','"+order_type+"')";
                dbConnection.query(sql, function (err, result) {
                    if (err) throw err;
                    res.json({'status':true,"messagae":"Booking added successfully!"});
                }); 
            }
        });

  
    	}else{
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}


export default {
	customer_booking
}