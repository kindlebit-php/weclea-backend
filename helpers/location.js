import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
export const assignDriver = (user_id, date, time) => {
	return new Promise((resolve, reject) => {
	  let driver_id = '';
  
	  const customer_address_query = "SELECT * FROM customer_address WHERE user_id = ?";
	  dbConnection.query(customer_address_query, [user_id], function (error, customerAddressResult) {
		if (error) {
		  console.error("Error in customer_address_query:", error);
		  reject(error);
		  return;
		}
  
		const userSQL = "SELECT id, zip_code FROM users WHERE zip_code = ?";
		dbConnection.query(userSQL, [customerAddressResult[0].zip], function (error, userResult) {
		  if (error) {
			console.error("Error in userSQL:", error);
			reject(error);
			return;
		  }
  
		  if (userResult.length > 0) {
			resolve(userResult[0].id);
		  } else {
			const sqlDistance = "SELECT * FROM (SELECT id, SQRT(POW(69.1 * (? - latitude), 2) + POW(69.1 * ((longitude - ?) * COS(? / 57.3)), 2)) AS distance FROM users WHERE role = 2 AND status = 1 AND is_deleted = 0 ORDER BY distance) AS vt WHERE vt.distance < 25 ORDER BY distance ASC;";
			dbConnection.query(sqlDistance, [customerAddressResult[0].latitude, customerAddressResult[0].longitude, customerAddressResult[0].latitude], function (error, locationResult) {
			  if (error) {
				console.error("Error in sqlDistance:", error);
				reject(error);
				return;
			  }
  
			  if (locationResult.length > 0) {
				resolve(locationResult[0].id);
			  } else {
				driver_id = 0;
				resolve(driver_id);
			  }
			});
		  }
		});
	  });
	});
  };
  



  