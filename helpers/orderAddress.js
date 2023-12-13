import dbConnection from'../config/db.js';
export const orderAddress = (user_id,booking_id) => {
		const bookingAddress = "select customer_address.address,customer_address.appartment,customer_address.city,customer_address.state,customer_address.zip,customer_address.latitude,customer_address.longitude,customer_billing_address.address as cpAddress,customer_billing_address.appartment as cpappartment,customer_billing_address.city as cpcity,customer_billing_address.state as cpstate,customer_billing_address.zip as cpzip,customer_billing_address.latitude as cplat,customer_billing_address.longitude as cplong,customer_drop_address.address as cdaaddress,customer_drop_address.appartment as cdaappartment,customer_drop_address.city as cdacity,customer_drop_address.state as cdastate,customer_drop_address.zip as cdazip,customer_drop_address.latitude as cdalat,customer_drop_address.longitude as cdalong from customer_address left join customer_billing_address on customer_billing_address.user_id = customer_address.user_id left join customer_drop_address on customer_drop_address.user_id = customer_address.user_id where customer_address.user_id="+user_id+"";
		console.log('bookingAddress',bookingAddress)
		dbConnection.query(bookingAddress, function (error, bookingresult) {
			console.log('bookingresult',bookingresult)
			 var sql = "INSERT INTO order_pick_address (booking_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+booking_id+"','"+bookingresult[0].address+"', '"+bookingresult[0].appartment+"','"+bookingresult[0].city+"','"+bookingresult[0].state+"','"+bookingresult[0].zip+"','"+bookingresult[0].latitude+"','"+bookingresult[0].longitude+"')";
	        dbConnection.query(sql, function (error, result) {
	        });
	          var sql = "INSERT INTO order_drop_address (booking_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+booking_id+"','"+bookingresult[0].cdaaddress+"', '"+bookingresult[0].cdaappartment+"','"+bookingresult[0].cdacity+"','"+bookingresult[0].cdastate+"','"+bookingresult[0].cdazip+"','"+bookingresult[0].cdalat+"','"+bookingresult[0].cdalong+"')";
	        dbConnection.query(sql, function (error, result) {
	        });
	         var sql = "INSERT INTO order_billing_address (booking_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+booking_id+"','"+bookingresult[0].cpAddress+"', '"+bookingresult[0].cpappartment+"','"+bookingresult[0].cpcity+"','"+bookingresult[0].cpstate+"','"+bookingresult[0].cpzip+"','"+bookingresult[0].cplat+"','"+bookingresult[0].cplong+"')";
	        dbConnection.query(sql, function (error, result) {
	        	if (error) throw error;
                   return '1';
	        });
		})
}



  