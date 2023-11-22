import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
export const assignDriver = (user_id,date,time) => {
  return new Promise((resolve, reject) => {
	var driver_id = '';

	const custmer_address = "select * from customer_address where user_id = '"+user_id+"'"
	
	dbConnection.query(custmer_address, function (error, custmeraddressResult) {
			 // resolve(user_id);

	const userSQL = "select id,zip_code from users where zip_code = '"+custmeraddressResult[0].zip+"'"
	dbConnection.query(userSQL, function (error, userResult) {
		if(userResult){
		Object.keys(userResult).forEach(function(key) {
			var ele = userResult[key];
			console.log(ele)
			if(ele.zip_code == custmeraddressResult[0].zip){
				resolve(ele.id)
			}
		})

	}else{
		var sqlDistance = "select * from (select id, SQRT(POW(69.1 * ('"+custmeraddressResult[0].latitude+"' - latitude), 2) + POW(69.1 * ((longitude - '"+custmeraddressResult[0].longitude+"') * COS('"+custmeraddressResult[0].latitude+"' / 57.3)), 2)) AS distance FROM users where role = 2 and status = 1 ORDER BY distance) as vt where vt.distance < 25 order by distance asc;";
		dbConnection.query(sqlDistance, function (error, locationResult) {
			if(locationResult.length > 0){
				resolve(locationResult[0].id)
			}else{
				 driver_id = 0;
				 resolve(driver_id)
			}
		})
	}
	})
})
})

}



  