import dbConnection from'../config/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from "../config/generateToken.js";
import transport from "../helpers/mail.js";
import dotenv from "dotenv";
import dateFormat from 'date-and-time';
dotenv.config();
import Stripe from "stripe";
import path from "path";
import { isThisMonth, isThisWeek, isToday } from '../helpers/date.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//customer register API
export const customer_register = async(req,res)=>{
      try { 
      	const saltRounds = 10;
        const {name,email,password,mobile,comment,role,latitude,longitude,category_id} = req.body;
        if(name && email && password  && mobile && role && category_id){
        	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist,async function (error, data) {

				// console.log(data[])
				if(data[0].total == 0){
					const checkIfMobileExist = "select count(id) as mobiletotal from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist,async function (error, mobiledata) {
					if(mobiledata[0].mobiletotal == 0){
						const stripeCustomer = await stripe.customers.create({
						email: email,
						name: name,
						description: "Opening stripe account",
						phone: mobile
						});
						const customer_id=stripeCustomer.id;

					bcrypt.hash(password, saltRounds, function(error, hash) {
						var sql = "INSERT INTO users (name, email,password,mobile,customer_id,comment,role,latitude,longitude,category_id) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+customer_id+"','"+comment+"','"+role+"','"+latitude+"','"+longitude+"','"+category_id+"')";
						dbConnection.query(sql, function (err, result) {
							if (err) throw err;

							var loadSQL = "INSERT INTO customer_loads_availabilty (user_id) VALUES ('"+result.insertId+"')";
							dbConnection.query(loadSQL, function (error, loadResult) {
							})

							var sql = "select id,name,email,mobile,comment,role,status,category_id from users where id = '"+result.insertId+"'";
							dbConnection.query(sql, function (err, userList) {
								userList[0].token = generateToken({ userId: userList[0].id, type: role });
								res.json({'status':true,"message":"User registered successfully!",'data':userList[0]});
							}); 
							}); 
						});
					}else{
						res.json({'status':false,"message":'Mobile Number is already registered'});  
						
					}
					});
				}else{
					res.json({'status':false,"message":'Email is already registered'});  
				
				}
			})
        	
    	}else{
            res.json({'status':false,"message":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


export const order_managament_user_singup = async(req,res)=>{
      try {
      		const saltRounds = 10;
        const {name,email,password,mobile,role,latitude,longitude,dob,group_id,zip_code,country,state,city,address,area} = req.body;
        if(name && email && password  && mobile && role){
        	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist,async function (error, data) {
				console.log(req.files)

				// console.log(data[])
				if(data[0].total == 0){
					const checkIfMobileExist = "select count(id) as mobiletotal from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist,async function (error, mobiledata) {
					if(mobiledata[0].mobiletotal == 0){

						console.log('password',password)
					bcrypt.hash(password, saltRounds, function(error, hash) {
						console.log('hash',hash)
						if(role == 2){
						if(req.files.licence_front_image){
							var licence_front_image = req.files.licence_front_image[0].key;
							console.log("1",licence_front_image)
						}else{
							var licence_front_image = '';
						}
						if(req.files.licence_back_image){
							var licence_back_image = req.files.licence_back_image[0].key;
						}else{
							var licence_front_image = '';
						}
						if(req.files.profile_image){
							var profile_image = req.files.profile_image[0].key;
						}else{
							var profile_image = '';
						}
							var sql = "INSERT INTO users (name, email,password,mobile,role,latitude,longitude,dob,group_id,zip_code,country,state,city,address,licence_front_image,licence_back_image,profile_image,area) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+role+"','"+latitude+"','"+longitude+"','"+dob+"','"+group_id+"','"+zip_code+"','"+country+"','"+state+"','"+city+"','"+address+"','"+licence_front_image+"','"+licence_back_image+"','"+profile_image+"','"+area+"')";
						}else{
							if(req.files.profile_image){
							var profile_image = req.files.profile_image[0].key;
							}else{
							var profile_image = '';
							}
							var sql = "INSERT INTO users (name, email,password,mobile,role,latitude,longitude,dob,zip_code,country,state,city,address,profile_image,area) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+role+"','"+latitude+"','"+longitude+"','"+dob+"','"+zip_code+"','"+country+"','"+state+"','"+city+"','"+address+"','"+profile_image+"','"+area+"')";
						}
						console.log('kaisql',sql)
						
						dbConnection.query(sql, function (err, result) {
							if (err) throw err;
							var sql = "select id,name,email,mobile,comment,role,status,category_id from users where id = '"+result.insertId+"'";
							dbConnection.query(sql, function (err, userList) {
								userList[0].token = generateToken({ userId: userList[0].id, type: role });
								res.json({'status':true,"message":"User registered successfully!",'data':userList[0]});
							}); 
							}); 
						});

					}else{
						res.json({'status':false,"message":'Mobile Number is already registered'});  
					}
				})
				}else{
				res.json({'status':false,"message":'Email is already registered'});  
				}
			})
		}else{
            res.json({'status':false,"message":"All fields are required"});

		}
      }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const order_managament_user_update = async (req, res) => {
    try {
        const saltRounds = 10;
        const { id, name, password, latitude, longitude, group_id, zip_code, country, state, city, address, area } = req.body;
            const checkIfUserExists = "SELECT id FROM users WHERE id = '" + id + "'";
            dbConnection.query(checkIfUserExists, async function (error, userData) {
                if (userData.length > 0) {
                    // User exists, proceed with update
					if(req.files.profile_image){
						var profile_image = req.files.profile_image[0].key;
					}else{
						var profile_image = '';
					}
                        if (password) {
                            bcrypt.hash(password, saltRounds, function (error, hash) {
                                const updateQuery = "UPDATE users SET name = '" + name + "', password = '" + hash + "', latitude = '" + latitude + "', longitude = '" + longitude + "', zip_code = '" + zip_code + "', country = '" + country + "', state = '" + state + "', city = '" + city + "', address = '" + address + "', area = '" + area + "', profile_image = '" + profile_image + "' WHERE id = '" + id + "'";
                                dbConnection.query(updateQuery, function (err, result) {
                                    if (err) throw err;
                                    const selectQuery = "SELECT id, name, email, mobile, comment, role, status, category_id FROM users WHERE id = '" + id + "'";
                                    dbConnection.query(selectQuery, function (err, updatedUserData) {
                                        res.json({ 'status': true, "message": "User updated successfully!", 'data': updatedUserData[0] });
                                    });
                                });
                            });
                        } else {
							const sql = "SELECT password FROM users WHERE id = '" + id + "'";
							dbConnection.query(sql, function(err,result){
							const updateQuery = "UPDATE users SET name = '" + name + "', password = '" + result[0].password + "', latitude = '" + latitude + "', longitude = '" + longitude + "', zip_code = '" + zip_code + "', country = '" + country + "', state = '" + state + "', city = '" + city + "', address = '" + address + "', area = '" + area + "', profile_image = '" + profile_image + "' WHERE id = '" + id + "'";
							dbConnection.query(updateQuery, function (err, result) {
								if (err) throw err;
								const selectQuery = "SELECT id, name, email, mobile, comment, role, status, category_id FROM users WHERE id = '" + id + "'";
								dbConnection.query(selectQuery, function (err, updatedUserData) {
									res.json({ 'status': true, "message": "User updated successfully!", 'data': updatedUserData[0] });
								});
							});
						})
                        }
					
                } else {
                    res.json({ 'status': false, "message": 'User not found' });
                }
            });
        
    } catch (error) {
        res.json({ 'status': false, "message": error.message });
    }
}


//customer address API
export const customer_address = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {delievery_instruction,pickup_address,pickup_appartment,pickup_city,pickup_state,pickup_zipcode,pickup_lat,pickup_long,drop_address,drop_appartment,drop_city,drop_state,drop_zipcode,drop_lat,drop_long,billing_address,billing_appartment,billing_city,billing_state,billing_zipcode,billing_lat,billing_long} = req.body;
        if(pickup_address && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long && drop_address && drop_city && drop_state && drop_zipcode && drop_lat && drop_long && billing_address && billing_city && billing_state && billing_zipcode && billing_lat && billing_long){
        const checkIfAddressExist = "select count(id) as total from customer_address where user_id = '"+userData[0].id+"'";
        dbConnection.query(checkIfAddressExist, function (error, resultAddress) {
        	if(resultAddress[0].total == 0){
        if(pickup_address && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long){
	        var sql = "INSERT INTO customer_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+pickup_address+"', '"+pickup_appartment+"','"+pickup_city+"','"+pickup_state+"','"+pickup_zipcode+"','"+pickup_lat+"','"+pickup_long+"')";
	        dbConnection.query(sql, function (error, result) {
	        });
    	}
    	if(drop_address && drop_city  && drop_state && drop_zipcode && drop_lat && drop_long){
	        var sql = "INSERT INTO customer_drop_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+drop_address+"', '"+drop_appartment+"','"+drop_city+"','"+drop_state+"','"+drop_zipcode+"','"+drop_lat+"','"+drop_long+"')";
	        dbConnection.query(sql, function (error, result) {
	        });
    	}
    	if(billing_address && billing_city  && billing_state && billing_zipcode && billing_lat && billing_long){
	        var sql = "INSERT INTO customer_billing_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+billing_address+"', '"+billing_appartment+"','"+billing_city+"','"+billing_state+"','"+billing_zipcode+"','"+billing_lat+"','"+billing_long+"')";
	        dbConnection.query(sql, function (error, result) {
	        });
    	}
    	if(delievery_instruction != ''){
    		const delieverySql = "select count(id) as delieveryCount from booking_instructions where user_id = '"+userData[0].id+"'"
	        dbConnection.query(delieverySql, function (error, delieveryresult) {
	        if(delieveryresult[0].delieveryCount == 0){
				var sql = "INSERT INTO booking_instructions (user_id,delievery_instruction) VALUES ('"+userData[0].id+"','"+delievery_instruction+"')";
				dbConnection.query(sql, function (error, result) {
				});
	        }else{
	        	var sql = "update booking_instructions set delievery_instruction='"+delievery_instruction+"' where  user_id ='"+userData[0].id+"'";
				dbConnection.query(sql, function (error, result) {
				});
	        }
	        })
	    }else{
	    	var sql = "INSERT INTO booking_instructions (user_id) VALUES ('"+userData[0].id+"')";
				dbConnection.query(sql, function (error, result) {
				});
	    }

	        res.json({'status':true,"message":"Address added successfully!"});
	}else{
		if(pickup_address && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long){
			var sql = "update customer_address set address='"+pickup_address+"', appartment='"+pickup_appartment+"',city='"+pickup_city+"',state='"+pickup_state+"',zip='"+pickup_zipcode+"',latitude='"+pickup_lat+"',longitude='"+pickup_long+"' where user_id = '"+userData[0].id+"'";
			dbConnection.query(sql, function (error, result) {
			});
		}
		if(drop_address && drop_city  && drop_state && drop_zipcode && drop_lat && drop_long){
			var sql = "update customer_drop_address set address='"+drop_address+"', appartment='"+drop_appartment+"',city='"+drop_city+"',state='"+drop_state+"',zip='"+drop_zipcode+"',latitude='"+drop_lat+"',longitude='"+drop_long+"' where user_id = '"+userData[0].id+"'";
			dbConnection.query(sql, function (error, result) {
			});
		}
		if(billing_address && billing_city  && billing_state && billing_zipcode && billing_lat && billing_long){
			var sql = "update customer_billing_address set address='"+billing_address+"', appartment='"+billing_appartment+"',city='"+billing_city+"',state='"+billing_state+"',zip='"+billing_zipcode+"',latitude='"+billing_lat+"',longitude='"+billing_long+"' where user_id = '"+userData[0].id+"'";
			dbConnection.query(sql, function (error, result) {
			});
		}
		if(delievery_instruction !=''){
    		
	        	var sql = "update booking_instructions set delievery_instruction='"+delievery_instruction+"' where  user_id ='"+userData[0].id+"'";
				dbConnection.query(sql, function (error, result) {    
	        })
	    }
	    res.json({'status':true,"message":"Address updated successfully!"});

	}
   })
    }else{
            res.json({'status':false,"message":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//customer login API
export const customer_login = async(req,res)=>{
	try { 
		const {email,password,type} = req.body;
		if(email && password && type){
			const checkIfEmailExist = "select * from users where email = '"+email+"' and role = '"+type+"' and is_deleted = 0";
			dbConnection.query(checkIfEmailExist, function (error, data) {
				if(data.length > 0){
					if(data[0].status == 1){
					bcrypt.compare(password, data[0].password, function(error, result) {
						if(result == true){
							data.forEach(element =>
							{
								const {id,name,email,mobile,comment,role,status,category_id,isAdmin,role_id,zip_code,customer_id} = element;
								
								const initi = {
									"id":id,"name":name,"email":email,"mobile":mobile,"comment":comment,"role":role,"status":status,'category_id':category_id,"role_id":role_id,"isAdmin":isAdmin,"zip_code":zip_code,"customer_id":customer_id,'token': generateToken({ userId: id, type: type }),
								}
								const get_address_count = "select count(id)  as total from customer_address where user_id = '"+id+"'";
								dbConnection.query(get_address_count, function (error, addressresult) {
								if(addressresult[0].total > 0){
									var addresscount = 1
								}else{
									var addresscount = 0
								}
								res.json({'status':true,"message":"Logged in successfully!",'data': initi,'address_count':addresscount});
							
							});
							});
						}else{
							res.json({'status':false,"message":"Incorrect password!"});
						}
					});
				}else{
					res.json({'status':false,"message":"Your account has been deactivated, please connect with admin!"});
				}
				}else{
							res.json({'status':false,"message":"User not found!"});
						
				}
			});
		}else{
			res.json({'status':false,"message":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}

// generate token


export const generate_token = async (req, res) => {
	try {
	  const userData = res.user;
	  const user_id=req.body.id;
	  const isAdmin = userData[0].isAdmin;
	  const role_id = userData[0].role_id;
  
	  if (isAdmin !== 1) {
		return res.json({ 'status': false, "message": "Not assigned as admin role" });
	  } else {
		const sql = "SELECT permission FROM wc_roles_permissions WHERE role_id = ? and  permission=1";
		dbConnection.query(sql, [role_id], async function (error, data3) {
		  if (error) {
			return res.json({ 'status': false, "message": error.message });
		  }
		  console.log("(data3",data3,user_id);
		  if (data3.length>0 && data3[0].permission == 1) {
			const getUserQuery = "SELECT * FROM users WHERE id = ?";
			dbConnection.query(getUserQuery, [user_id], async function (error, data2) {
			  if (error) {
				return res.json({ 'status': false, "message": error.message });
			  }
			  console.log("dAta2",data2)
			  if (data2.length > 0 && data2[0].is_deleted == 0) {
				// const { email, password, role } = data2[0];
  
				// const checkIfEmailExistQuery = "SELECT * FROM users WHERE email = ? AND role = ?";
				// dbConnection.query(checkIfEmailExistQuery, [email, role], async function (error, data) {
				//   if (error) {
				// 	return res.json({ 'status': false, "message": error.message });
				//   }
  
				//   if (data.length > 0) {
					if (data2[0].status === 1) {
				
						const { id, name, email, mobile, comment, role, status, category_id, isAdmin, role_id, zip_code, customer_id } = data2[0];
  
						const initi = {
						  "id": id, "name": name, "email": email, "mobile": mobile, "comment": comment, "role": role,
						  "status": status, 'category_id': category_id, "role_id": role_id, "isAdmin": isAdmin, "zip_code": zip_code,
						  "customer_id": customer_id, 'token': generateToken({ userId: id, type: role }),
						};
  
						const getAddressCountQuery = "SELECT COUNT(id) AS total FROM customer_address WHERE user_id = ?";
						dbConnection.query(getAddressCountQuery, [id], function (error, addressResult) {
						  if (error) {
							return res.json({ 'status': false, "message": error.message });
						  }
  
						  const addressCount = (addressResult && addressResult[0] && addressResult[0].total) || 0;
						  res.json({ 'status': true, "message": "Logged in successfully!", 'data': initi, 'address_count': addressCount });
						});
					 
					} else {
					  res.json({ 'status': false, "message": "Your account has been deactivated, please connect with admin!" });
					}
				//   } else {
				// 	res.json({ 'status': false, "message": "User not found!" });
				//   }
				// });
			  } else {
				res.json({ 'status': false, "message": "All fields are required" });
			  }
			});
		  } else {
			console.log("You are not authorised");
			res.json({ 'status': false, "message": "You are not authorised" });
		  }
		});
	  }
	} catch (error) {
	  res.json({ 'status': false, "message": error.message });
	}
  };
//customer forgot password API
export const forgot_password = async(req,res)=>{
	try { 
		const {email} = req.body;
		if(email){
			const checkIfEmailExist = "select * from users where email = '"+email+"'";

			dbConnection.query(checkIfEmailExist, function (err, data) {
				if(data.length > 0){
					var otp = 123456
					const mailOptions = 
					{
					from: 'ankuchauhan68@gmail.com',
					to: email,
					subject: "Verify Your Email",
					html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
						<div style="margin:50px auto;width:70%;padding:20px 0">
						<div style="border-bottom:1px solid #eee">
						<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">WeClea</a>
						</div>
						<p style="font-size:1.1em">Hi ${data[0].name},</p>
						<p>Thank you for choosing WeClea. Use the following OTP to complete your forgot password procedures.</p>
						<h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"> ${otp}</h2>
						<p style="font-size:0.9em;">Regards,<br />WeClea</p>
						<hr style="border:none;border-top:1px solid #eee" />
						<div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
						<p>WeClea Inc</p>
						<p>USA</p>
						</div>
						</div>
						</div>`,
					};

					transport.sendMail(mailOptions, function (error, info) 
					{
						if (error) 
						{
							res.json({'status':false,"message":error});
						} 
						else
						 {
							
							const updateUser = "UPDATE users SET otp = '"+otp+"' WHERE id = '"+data[0].id+"';"
						
							dbConnection.query(updateUser, function (error, datas) 
							{
								if(error)throw error;
								res.json({'status':true,"message":"Email send successfully!"});
							})
							
						}
					});
				}
				else
				{
					res.json({'status':false,"message":"User not found!"});
				}
			});
		}
		else
		{
			res.json({'status':false,"message":"All fields are required"});
		}
	}
	catch (error) 
	{ 
		res.json({'status':false,"message":error.message});  
	}
}

//customer verify OTP API
export const verify_otp = async(req,res)=>{
	try { 
		const {email,otp} = req.body;
		if(email && otp){
			const checkIfEmailExist = "select * from users where email = '"+email+"' and otp = '"+otp+"'";
			dbConnection.query(checkIfEmailExist, function (error, data) {
				// console.log('data',data)
				if(data.length > 0){
					res.json({'status':true,"message":"OTP verify successfully",'data':data});
				}else{
					res.json({'status':false,"message":"Incorrect OTP details!"});
				}
			});
		}else{
			res.json({'status':false,"message":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}

//customer change password API
export const change_password = async(req,res)=>{
	try { 
      	const saltRounds = 10;
		const {email,password} = req.body;
		if(email && password){
			const checkIfEmailExist = "select * from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist, function (error, data) {
				// console.log('data',data)
				if(data.length > 0){
					bcrypt.hash(password, saltRounds, function(error, hash) {
						const updateUser = "UPDATE users SET password = '"+hash+"' WHERE email = '"+email+"';"
						
						dbConnection.query(updateUser, function (error, datas) {
							if(error)throw error;
							res.json({'status':true,"message":"Password updated successfully!",'data':data[0]});
						});
					});
				}else{
					res.json({'status':false,"message":"User not found!"});
				}
			});
		}else{
			res.json({'status':false,"message":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}


//get user profile API
export const get_user_profile = async(req,res)=>{
     try { 
        const userData = res.user;
        const { buy_loads} = req.body;
            var sql = "select * from users where id = '"+userData[0].id+"' ";
            dbConnection.query(sql, function (error, result) {
            if (error) throw error;
				// var resData = [];
				result.forEach(element =>
				{
					const {id,name,dob,email,mobile,category_id} = element;
					if(result[0].profile_image){
						var img = process.env.S3_URL+result[0].profile_image;
					}else{
						var img = process.env.S3_URL+'/uploads/profile.jpg';

					}
					let initi = {
					"id":id,"name":name,"dob":dob,'category_id':category_id,"email":email,"mobile":mobile,'profile_img':img
					}
					const get_address_count = "select count(id)  as total from customer_address where user_id = '"+userData[0].id+"'";
					dbConnection.query(get_address_count, function (error, addressresult) {
					if(addressresult[0].total > 0){
						var addresscount = 1
					}else{
						var addresscount = 0
					}
					res.json({'status':true,"message":"Profile get successfully!",'data':initi,'address_count':addresscount});
				});
				});
            });
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_password = async(req,res)=>{
	    try { 
        	const userData = res.user;
      		const saltRounds = 10;
          	const { oldpassword, newpassword } = req.body;
        if(oldpassword, newpassword){
        	bcrypt.compare(oldpassword, userData[0].password, function(error, result) {
				if(result == true){
					bcrypt.hash(newpassword, saltRounds, function(error, hash) {
						var sql = "update users set password = '"+hash+"' where id = '"+userData[0].id+"'";
						dbConnection.query(sql, function (error, result) {
							if (error) throw error;
							res.json({'status':true,"message":"Your password has been updated successfully"});
						}); 
					});	
				}else{
					res.json({'status':false,"message":"Incorrect current password!"});

				}
        	})
						
			
		}else{
            res.json({'status':false,"message":"All field is required"});
		}
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

//update customer profile API
export const edit_user_profile = async(req,res)=>{
     try { 
        const userData = res.user;
        const {name,dob,category_id} = req.body;
        if(name && category_id){
			
			// const checkIfMobileExist = "select count(id) as total from users where id = '"+userData[0].id+"' and mobile = '"+mobile+"'";
			// dbConnection.query(checkIfMobileExist, function (error, data) {
			// if(data[0].total == 1 ){
				if(req.file){
					var userProfile = req.file.key;
				}else{
				var userProfile = userData[0].profile_image;
				}
				var sql = "update users set name = '"+name+"', profile_image ='"+userProfile+"', dob ='"+dob+"',category_id = '"+category_id+"' where id = '"+userData[0].id+"'";
				dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"Your profile has been updated!"});
				}); 
			// }else{
			// 	res.json({'status':false,"message":'Mobile Number is already registered'});  

			// }
			// });
				
				
		
		}else{
            res.json({'status':false,"message":"All fields are required"});
		}
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//update customer profile API
export const update_user_status = async(req,res)=>{
     try {
        const {status,user_id} = req.body;
				var sql = "update users set status = '"+status+"' where id = '"+user_id+"'";
				dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"Employee profile has been updated!"});
				}); 
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//update user profile API
export const register_employee = async(req,res)=>{
     try {
     	const saltRounds = 10;
        const {name,email,password,latitude,longitude,role,address,mobile} = req.body;
        if(name  && email && password && latitude && mobile && longitude && role && address){		
		bcrypt.hash(password, saltRounds, function(error, hash) {
		var sql = "INSERT INTO users (name, email,password,mobile,role,latitude,longitude,address) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+role+"','"+latitude+"','"+longitude+"','"+address+"')";
		dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"registered successfully!"});
				}); 
		});		
		}else{
            res.json({'status':false,"message":"All fields are required"});
		}
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//update user profile API
export const update_employee = async(req,res)=>{
     try {
        const {id,name,email,latitude,longitude,address,mobile} = req.body;
        if(name && id && email && latitude && mobile && longitude && address){

	    var sql = "update users set name='"+name+"',email='"+email+"',latitude='"+latitude+"',longitude='"+longitude+"',mobile='"+mobile+"',address='"+address+"' where  id ='"+id+"'";
		dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"updated successfully!"});
				}); 	
		}else{
            res.json({'status':false,"message":"All fields are required"});
		}
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


//DELETE user profile API
export const delete_employee = async(req,res)=>{
     try {
        const {id} = req.body;
        if(id){
        var sql = "delete from users where id = '"+id+"'";		
		dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"deleted successfully!"});
				}); 	
		}else{
            res.json({'status':false,"message":"All fields are required"});
		}
      
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

//notification verify OTP API
export const get_notification = async(req,res)=>{
	try {	
        	const userData = res.user;
			const notificationSQL = "select * from notifications where user_id = '"+userData[0].id+"'";
			dbConnection.query(notificationSQL, function (error, data) {
					res.json({'status':true,"message":"Notification List",'data':data});
			});
		
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}

//newsletter API
export const newsletter = async(req,res)=>{
	try {
			const {email} = req.body;
			if(email){
			var sql = "INSERT INTO newsletters (email) VALUES ('"+email+"')";
			dbConnection.query(sql, function (err, result) {
				res.json({'status':true,"message":"subscribed successfully"});
			});
			}else{
				res.json({'status':false,"message":"All fields are required"});
			}
		
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}

//get address API
export const  user_registered_address = async(req,res)=>{
	try {
        	const userData = res.user;

			var sql = "select customer_address.address,customer_address.appartment,customer_address.city,customer_address.state,customer_address.zip,customer_address.latitude,customer_address.longitude, customer_billing_address.address as billing_address,customer_billing_address.appartment as billing_appartment,customer_billing_address.city as billing_city,customer_billing_address.state as billing_state,customer_billing_address.zip as billing_zip,customer_billing_address.latitude as billing_lat,customer_billing_address.longitude as billing_long, customer_drop_address.address as drop_address,customer_drop_address.appartment as drop_appartment,customer_drop_address.city as drop_city,customer_drop_address.state as drop_state,customer_drop_address.zip as drop_zip,customer_drop_address.latitude as drop_lat,customer_drop_address.longitude as drop_long,booking_instructions.delievery_instruction from customer_address left join customer_drop_address on customer_address.user_id =customer_drop_address.user_id left join customer_billing_address on customer_billing_address.user_id = customer_address.user_id left join booking_instructions on customer_address.user_id = booking_instructions.user_id where customer_address.user_id = '"+userData[0].id+"'";
			dbConnection.query(sql, function (err, result) {
				res.json({'status':true,"message":"subscribed successfully",'data':result});
			});
			
		
	}catch (error) {
		res.json({'status':false,"message":error.message});  
	}
}

export const order_list = async (req, res) => {
	try {
	var datetime = new Date();
    const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
	const list =
		"SELECT b.id, b.order_id,b.driver_id,b.folder_id,b.order_id AS Folder, b.order_id AS Nearby_driver, b.category_id, b.delievery_day, CONCAT(b.date, ' ', b.time) AS Date_Time, b.total_loads, b.status, b.order_status, b.order_status AS order_images, b.order_type, cda.address, bins.delievery_instruction ,users.name,users.email,users.mobile FROM bookings AS b left JOIN customer_drop_address AS cda ON b.user_id = cda.user_id left JOIN booking_instructions AS bins ON b.user_id = bins.user_id left join users on b.user_id = users.id WHERE b.cron_status = 1 and b.order_type != 3 and b.order_type != 6 order by id desc";
	  console.log('list',list)
	  const data = await new Promise((resolve, reject) => {
		dbConnection.query(list, (error, data) => {
		  if (error) {reject(error);
		  } else {
			resolve(data);
		  }
		});
	  });
	  console.log(data,"data1")
	  const driverData = [];
	  const folderData = [];
	  const imagesData = [];
  
	  for (const item of data) {
		if (item.Nearby_driver) {
		  const driver_list = `SELECT id, name, SQRT(POW(69.1 * (30.7320 - latitude), 2) + POW(69.1 * ((longitude - 76.7726) * COS(30.7320 / 57.3)), 2)) AS distance FROM users   WHERE role = 2 and status = 1  ORDER BY distance ASC`;
  
		  const driverResults = await new Promise((resolve, reject) => {
			dbConnection.query(driver_list, (error, Data) => {
			  if (error) {
				reject(error);
			  } else {
				resolve(Data);
			  }
			});
		  });
		  console.log(driverResults,"data2")
		  driverData.push(driverResults);
		  item.Nearby_driver = driverResults;
		}
		if (item.Folder) {
			const Folder_list = `SELECT id, name FROM users WHERE role = 3 and status = 1 `;
	
			const folderResults = await new Promise((resolve, reject) => {
			  dbConnection.query(Folder_list, (error, Dataa) => {
				if (error) {
				  reject(error);
				} else {
				  resolve(Dataa);
				}
			  });
			});
			console.log(folderResults,"data3")
			folderData.push(folderResults);
			item.Folder = folderResults;
		  }
  
		if (item.delievery_day === 0) {
		  item.delievery_day = "Same Day";
		} else if (item.delievery_day === 1) {
		  item.delievery_day = "Next Day";
		}
  
		if (item.status === 0) {
		  item.status = "Inactive";
		} else if (item.status === 1) {
		  item.status = "Active";
		}
  
		console.log(item.order_status)
  
		if (item.order_status === 1) {
		  item.order_status = "Wash";
		} else if (item.order_status === 2) {
		  item.order_status = "Dry";
		} else if (item.order_status === 3) {
		  item.order_status = "Fold";
		} else if (item.order_status === 4) {
		  item.order_status = "Pack";
		} else if (item.order_status === 5) {
		  item.order_status = "Order Collected";
		} else if (item.order_status === 6) {
		  item.order_status = "Completed";
		} else if (item.order_status === 7) {
		  item.order_status = "Order Not Found";
		} else if (item.order_status === 8) {
		  item.order_status = "Order Pickup";
		} else {
		  item.order_status = "NA";
		}
		const imagesQuery= `SELECT bi.pickup_images,bi.wash_images,bi.dry_images,bi.fold_images,bi.pack_images,bi.drop_image,bi.extra_load_images FROM booking_images AS bi left JOIN bookings AS b ON bi.booking_id = b.id WHERE bi.pickup_images IS NOT NULL and b.id = ${item.id} `
		if (item.order_images === 1) {
			const imagesResults = await new Promise((resolve, reject) => {
			  dbConnection.query(imagesQuery, (error, Data) => {
				if (error) {
				  reject(error);
				} else {
				  const separatedStrings = Data[0].wash_images.split(", ");
				  const imageList = [];
		  
				  separatedStrings.forEach(val => {
					const subImages = val.split(',').map(subVal => {
					  return `${process.env.S3_URL}${subVal.trim()}`;
					});
					const subImageObjects = subImages.map(subImagePath => ({
					  path: subImagePath,
					  type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					}));
		  
					imageList.push(subImageObjects);
				  });
				  const flattenedImageList = [].concat(...imageList);
		  
				  resolve(flattenedImageList);
				}
			  });
			});
		  
			imagesData.push(imagesResults);
			item.order_images = imagesResults;
		  } else if (item.order_images === 2) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];

				  	if(Data[0].dry_images){

					const separatedStrings = Data[0].dry_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 3) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].fold_images){
					const separatedStrings = Data[0].fold_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 4) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].pack_images){
					const separatedStrings = Data[0].pack_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 6) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];

				  	if(Data[0].drop_image){
					const separatedStrings = Data[0].drop_image.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
					}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		}else if (item.order_images === 8) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const separatedStrings = Data[0].pickup_images.split(", ");
					const imageList = [];
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else {
		  item.order_images = "No_images";
		}
  
		if (item.order_type === 1) {
		  item.order_type = "One Time Order";
		} else if (item.order_type === 2) {
		  item.order_type = "Subscription Order";
		} else if (item.order_type === 3) {
		  item.order_type = "Dry Clean Order";
		}
  
		if (item.delievery_instruction) {
		  item.delievery_instruction = 1;
		} else {
		  item.delievery_instruction = 0;
		}
	  }
  
	  res.json({ status: true, message: "List retrieved successfully", data });
	} catch (error) {
	  res.json({ status: false, message: error.message });
	}
  };
  
  export const order_list_dry_clean = async (req, res) => {
	try {
	var datetime = new Date();
    const currentFinalDate = dateFormat.format(datetime,'YYYY-MM-DD');
	const list =
		"SELECT b.id, b.order_id,b.driver_id,b.folder_id,b.order_id AS Folder, b.order_id AS Nearby_driver, b.category_id, b.delievery_day, CONCAT(b.date, ' ', b.time) AS Date_Time, b.total_loads, b.status, b.order_status, b.order_status AS order_images, b.order_type, cda.address, bins.delievery_instruction ,users.name,users.email,users.mobile FROM bookings AS b left JOIN customer_drop_address AS cda ON b.user_id = cda.user_id left JOIN booking_instructions AS bins ON b.user_id = bins.user_id left join users on b.user_id = users.id WHERE b.payment_status = 1 and b.order_type = 3 and b.date = '"+currentFinalDate+"' order by id desc";
	  const data = await new Promise((resolve, reject) => {
		dbConnection.query(list, (error, data) => {
		  if (error) {reject(error);
		  } else {
			resolve(data);
		  }
		});
	  });
	  console.log(data,"data1")
	  const driverData = [];
	  const folderData = [];
	  const imagesData = [];
  
	  for (const item of data) {
		if (item.Nearby_driver) {
		  const driver_list = `SELECT id, name, SQRT(POW(69.1 * (30.7320 - latitude), 2) + POW(69.1 * ((longitude - 76.7726) * COS(30.7320 / 57.3)), 2)) AS distance FROM users   WHERE role = 2 ORDER BY distance ASC`;
  
		  const driverResults = await new Promise((resolve, reject) => {
			dbConnection.query(driver_list, (error, Data) => {
			  if (error) {
				reject(error);
			  } else {
				resolve(Data);
			  }
			});
		  });
		  console.log(driverResults,"data2")
		  driverData.push(driverResults);
		  item.Nearby_driver = driverResults;
		}
		if (item.Folder) {
			const Folder_list = `SELECT id, name FROM users WHERE role = 3`;
	
			const folderResults = await new Promise((resolve, reject) => {
			  dbConnection.query(Folder_list, (error, Dataa) => {
				if (error) {
				  reject(error);
				} else {
				  resolve(Dataa);
				}
			  });
			});
			console.log(folderResults,"data3")
			folderData.push(folderResults);
			item.Folder = folderResults;
		  }
  
		if (item.delievery_day === 0) {
		  item.delievery_day = "Same Day";
		} else if (item.delievery_day === 1) {
		  item.delievery_day = "Next Day";
		}
  
		if (item.status === 0) {
		  item.status = "Inactive";
		} else if (item.status === 1) {
		  item.status = "Active";
		}
  
		console.log(item.order_status)
  
		if (item.order_status === 9) {
		  item.order_status = "tagging";
		} else if (item.order_status === 10) {
		  item.order_status = "Spotting";
		} else if (item.order_status === 11) {
		  item.order_status = "Cleaning";
		} else if (item.order_status === 4) {
		  item.order_status = "Package";
		} else if (item.order_status === 12) {
			item.order_status = "Inspect";
		  } else if (item.order_status === 13) {
			item.order_status = "Press";
		  } else if (item.order_status === 5) {
		  item.order_status = "Order Collected";
		} else if (item.order_status === 6) {
		  item.order_status = "Completed";
		} else if (item.order_status === 7) {
		  item.order_status = "Order Not Found";
		} else if (item.order_status === 8) {
		  item.order_status = "Order Pickup";
		} else {
		  item.order_status = "NA";
		}
		const imagesQuery= `SELECT bi.pickup_images,bi.tagging_images,bi.spoting_images,bi.cleaning_images,bi.inspect_images,bi.press_images,bi.package_images,bi.drop_image,bi.extra_load_images FROM dry_clean_booking_images AS bi left JOIN bookings AS b ON bi.booking_id = b.id WHERE bi.pickup_images IS NOT NULL and b.id = ${item.id} `
		if (item.order_images === 9) {
			const imagesResults = await new Promise((resolve, reject) => {
			  dbConnection.query(imagesQuery, (error, Data) => {
				if (error) {
				  reject(error);
				} else {
				  const separatedStrings = Data[0].tagging_images.split(", ");
				  const imageList = [];
		  
				  separatedStrings.forEach(val => {
					const subImages = val.split(',').map(subVal => {
					  return `${process.env.S3_URL}${subVal.trim()}`;
					});
					const subImageObjects = subImages.map(subImagePath => ({
					  path: subImagePath,
					  type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					}));
		  
					imageList.push(subImageObjects);
				  });
				  const flattenedImageList = [].concat(...imageList);
		  
				  resolve(flattenedImageList);
				}
			  });
			});
		  
			imagesData.push(imagesResults);
			item.order_images = imagesResults;
		  } else if (item.order_images === 10) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];

				  	if(Data[0].spoting_images){

					const separatedStrings = Data[0].spoting_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 11) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].cleaning_images){
					const separatedStrings = Data[0].cleaning_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 12) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].inspect_images){
					const separatedStrings = Data[0].inspect_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 13) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].press_images){
					const separatedStrings = Data[0].press_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 4) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];
				  	if(Data[0].package_images){
					const separatedStrings = Data[0].package_images.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
				}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else if (item.order_images === 6) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const imageList = [];

				  	if(Data[0].drop_image){
					const separatedStrings = Data[0].drop_image.split(", ");
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
					}
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		}else if (item.order_images === 8) {
			const imagesResults = await new Promise((resolve, reject) => {
				dbConnection.query(imagesQuery, (error, Data) => {
				  if (error) {
					reject(error);
				  } else {
					const separatedStrings = Data[0].pickup_images.split(", ");
					const imageList = [];
			
					separatedStrings.forEach(val => {
					  const subImages = val.split(',').map(subVal => {
						return `${process.env.S3_URL}${subVal.trim()}`;
					  });
					  const subImageObjects = subImages.map(subImagePath => ({
						path: subImagePath,
						type: path.extname(subImagePath) === '.mov' || path.extname(subImagePath) === '.mp4' ? 'video' : 'image',
					  }));
			
					  imageList.push(subImageObjects);
					});
					const flattenedImageList = [].concat(...imageList);
			
					resolve(flattenedImageList);
				  }
				});
			  });
			
			  imagesData.push(imagesResults);
			  item.order_images = imagesResults;
		} else {
		  item.order_images = "No_images";
		}
  
		if (item.order_type === 1) {
		  item.order_type = "One Time Order";
		} else if (item.order_type === 2) {
		  item.order_type = "Subscription Order";
		} else if (item.order_type === 3) {
		  item.order_type = "Dry Clean Order";
		}
  
		if (item.delievery_instruction) {
		  item.delievery_instruction = 1;
		} else {
		  item.delievery_instruction = 0;
		}
	  }
  
	  res.json({ status: true, message: "List retrieved successfully", data });
	} catch (error) {
	  res.json({ status: false, message: error.message });
	}
  };

export const driver_list = async (req, res) => {
	try {
	  const list = "SELECT id, name, email, mobile,status,address,latitude,longitude FROM users WHERE role = 2";
	  dbConnection.query(list, function (error, data) {
		if (error) throw error;
		res.json({status: true, message: "List retrived succesfully", data: data});           
	  });
	} catch (error) {   
	  res.json({ status: false, message: error.message });   
	}   
  };  

  export const folder_list = async (req, res) => {
	try {
	  const list = "SELECT id,name, email, mobile,status,address,latitude,longitude FROM users WHERE role = 3";
	  dbConnection.query(list, function (error, data) {
		if (error) throw error;
		res.json({status: true, message: "List retrived succesfully", data: data});           
	  });
	} catch (error) {   
	  res.json({ status: false, message: error.message });   
	}   
  };  

export const customer_list = async (req, res) => {
	try {
	  const list = "SELECT u.id, u.customer_id, u.name, u.mobile,u.dob,u.email,u.status, ca.address FROM users AS u JOIN customer_address AS ca ON u.id = ca.user_id WHERE u.role = 1";
  
	  dbConnection.query(list, async function (error, data) {
		if (error) {
		  return res.json({ status: false, message: error.message });
		} else {
		  const userData = data;
			
		  const customerIds = data.map((row) => row.customer_id);
		  const mappedPaymentMethods = [];
  
		  for (const customerId of customerIds) {
			const paymentMethods = await stripe.paymentMethods.list({
			  customer: customerId,
			  type: "card",
			});
  
			const mappedMethods = paymentMethods.data.map((paymentMethod) => ({
			  cardId: paymentMethod.id,
			  customer_id:paymentMethod.customer,
			  brand: paymentMethod.card.brand,
			  last4: paymentMethod.card.last4,
			}));
  
			mappedPaymentMethods.push(...mappedMethods);
		  }
		  const combinedData = userData.map((user) => {
			const userPaymentMethods = mappedPaymentMethods.filter(
			  (method) => method.customer_id === user.customer_id
			);
			return {
				id:user.id,
				name:user.name,
				mobile:user.mobile,
				email:user.email,
				Dob:user.dob,
				Status:user.status,
				address:user.address,
			  cardDetails: userPaymentMethods,
			};
		  });
  
		  res.json({
			status: true,
			message: "Details retrieved successfully!",
			data: combinedData,
		  });
		}
	  });
	} catch (error) {
	  res.json({ status: false, message: error.message });
	}
  };
  

  export const customer_order_histroy = async (req, res) => {
	try {
		const userData = res.user;
		const user_id = userData[0].id;
		const userIdQuery = `
				SELECT  b1.id,b1.user_id FROM bookings AS b1
				JOIN users AS u ON u.id = b1.user_id
				WHERE u.id = ?`;
		dbConnection.query(userIdQuery,[user_id],async (error, userIdResult) => {
			if (error) {
			  return res.json({ status: false, message: error.message });
			}
			const userIds = userIdResult.map((row) => row.user_id);
			const bookingIds = userIdResult.map((row) => row.id);
	
			console.log(userIds, bookingIds);
			const query = ` SELECT b.id AS booking_Id,b.total_loads,bt.deliever_date,bt.deliever_time ,bi.drop_image
		  FROM bookings AS b
		  JOIN users AS u ON b.user_id = u.id
		  JOIN booking_images AS bi ON b.id = bi.booking_id
		  JOIN booking_timing AS bt ON b.id = bt.booking_id
		  WHERE  b.order_status = '6' AND b.user_id IN (?) AND b.id IN (?)
			ORDER BY deliever_date DESC`;
	
			dbConnection.query(
			  query,[ userIds, bookingIds],(error, data) => {
				console.log(data);
				if (error) {
				  return res.json({ status: false, message: error.message });
				} else if (data.length < 0) {
				  return res.json({ status: false, message: "data not found" });
				} else {
				  const resData = [];
				 // const imageArray = [];
				  if (data?.length > 0) {
					for (const elem of data) {
					  const { booking_Id,total_loads,deliever_date,deliever_time,drop_image } = elem;
					  const separatedStrings = drop_image.split(", ")
					  const imagesUrl=separatedStrings.map((val) => {
					  return `${process.env.S3_URL}${val}`;
					 });
					  resData.push({
						booking_Id,
						total_loads,
						deliever_date,
						deliever_time,
						imagesUrl,
					  });
					}
				  }
				  return res.json({
					status: true,
					message: "Updated successfully!",
					data: resData,
				  });
				}
			  }
			);
		  }
		);
	  } catch (error) {
	  res.json({ status: false, message: error.message });
	}
  };
    export const contact_us = async (req, res) => {
		try {
			const {name,email,message} = req.body;
			if(name  && email && message){
				var sql = "INSERT INTO contact_us (name, email,message) VALUES ('"+name+"', '"+email+"','"+message+"')";
				dbConnection.query(sql, function (error, result) {
				if (error) throw error;
					res.json({'status':true,"message":"We will connect you shortly!"});
				});
			}else{
				res.json({'status':false,"message":"All fields are required"});
			}
		} catch (error) {
		  	res.json({ status: false, message: error.message });
		}
	}

	export const get_deleivery_instruction = async (req, res) => {
		try {
				const userData = res.user;
				var sql = "select delievery_instruction from booking_instructions where user_id = '"+userData[0].id+"'";
				dbConnection.query(sql, function (error, result) {
				if (error) throw error;
				if(result){
					var finalResult = result[0]
				}else{
					var finalResult = result

				}
					res.json({'status':true,"message":"Delievery instruction list",'data':finalResult});
				});
			
		} catch (error) {
		  	res.json({ status: false, message: error.message });
		}
	}

	export const dry_clean_history = async (req, res) => {
		try {
		  const list = "SELECT order_id,name, order_status, date,time from bookings WHERE role = 3";
		  dbConnection.query(list, function (error, data) {
			if (error) throw error;
			res.json({status: true, message: "List retrived succesfully", data: data});           
		  });
		} catch (error) {   
		  res.json({ status: false, message: error.message });   
		}   
	  };  

	  export const driver_data=async(req,res)=>{
		try {
			const driver_id= req.body.driver_id;
			const user = "SELECT id,name, email, mobile,address,latitude,longitude FROM users WHERE id = ?";
			dbConnection.query(user,[driver_id], function (error, data) {
			  if (error) throw error;
				const order= "SELECT id,date,order_id,order_status,order_type from bookings where driver_id=?";
				dbConnection.query(order,[driver_id],async function(error,data2){
					if(error) throw error;

					const totalCountToday = data2.filter(row => isToday(row.date)).length;
					const totalCountThisWeek = data2.filter(row => isThisWeek(row.date)).length;
					const totalCountThisMonth = data2.filter(row => isThisMonth(row.date)).length;
			
					var order_status = data2.map((row) => {
						if (row.order_status === 9) {
						  return "tagging";
						} else if (row.order_status === 10) {
						  return "Spotting";
						} else if (row.order_status === 11) {
						  return "Cleaning";
						} else if (row.order_status === 1) {
						  return "wash";
						} else if (row.order_status === 2) {
						  return "Dry";
						} else if (row.order_status === 3) {
						  return "Fold";
						} else if (row.order_status === 4) {
						  return "Package";
						} else if (row.order_status === 12) {
						  return "Inspect";
						} else if (row.order_status === 13) {
						  return "Press";
						} else if (row.order_status === 5) {
						  return "Order Collected";
						} else if (row.order_status === 6) {
						  return "Completed";
						} else if (row.order_status === 7) {
						  return "Order Not Found";
						} else if (row.order_status === 8) {
						  return "Order Pickup";
						} else {
						  return "NA";
						}
					  });
			  
					  var order_type = data2.map((row) => {
						if (row.order_type === 1) {
						  return "Laundry";
						} else if (row.order_type === 2) {
						  return "Laundry";
						} else if (row.order_type === 3) {
						  return "DryClean";
						} else {
						  return "NA";
						}
					  });
			  
					  const result = {
						user: data[0],
						booking_count: {
						  totalCountToday,
						  totalCountThisWeek,
						  totalCountThisMonth,
						},
						booking_details: data2.map((row, index) => ({
						  id: row.id,
						  date: row.date,
						  order_id: row.order_id,
						  order_status: order_status[index],
						  order_type: order_type[index],
						})),
					  };
			  
					  res.json({ status: true, message: "data retrieved successfully", data: result });
				})
			});

		} catch (error) {
			res.json({ status: false, message: error.message });
		}
	  }

	  export const folder_data=async(req,res)=>{
		try {
			const folder_id= req.body.folder_id;
			const user = "SELECT id,name, email, mobile,address,latitude,longitude FROM users WHERE id = ?";
			dbConnection.query(user,[folder_id], function (error, data) {
			  if (error) throw error;
				const order= "SELECT id,date,order_id,order_status,order_type from bookings where folder_id=?";
				dbConnection.query(order,[folder_id],async function(error,data2){
					if(error) throw error;

					const totalCountToday = data2.filter(row => isToday(row.date)).length;
					const totalCountThisWeek = data2.filter(row => isThisWeek(row.date)).length;
					const totalCountThisMonth = data2.filter(row => isThisMonth(row.date)).length;
			
					var order_status = data2.map((row) => {
						if (row.order_status === 9) {
						  return "tagging";
						} else if (row.order_status === 10) {
						  return "Spotting";
						} else if (row.order_status === 11) {
						  return "Cleaning";
						} else if (row.order_status === 1) {
						  return "wash";
						} else if (row.order_status === 2) {
						  return "Dry";
						} else if (row.order_status === 3) {
						  return "Fold";
						} else if (row.order_status === 4) {
						  return "Package";
						} else if (row.order_status === 12) {
						  return "Inspect";
						} else if (row.order_status === 13) {
						  return "Press";
						} else if (row.order_status === 5) {
						  return "Order Collected";
						} else if (row.order_status === 6) {
						  return "Completed";
						} else if (row.order_status === 7) {
						  return "Order Not Found";
						} else if (row.order_status === 8) {
						  return "Order Pickup";
						} else {
						  return "NA";
						}
					  });
			  
					  var order_type = data2.map((row) => {
						if (row.order_type === 1) {
						  return "Laundry";
						} else if (row.order_type === 2) {
						  return "Laundry";
						} else {
						  return "NA";
						}
					  });
			  
					  const result = {
						user: data[0],
						booking_count: {
						  totalCountToday,
						  totalCountThisWeek,
						  totalCountThisMonth,
						},
						booking_details: data2.map((row, index) => ({
						  id: row.id,
						  date: row.date,
						  order_id: row.order_id,
						  order_status: order_status[index],
						  order_type: order_type[index],
						})),
					  };
			  
					  res.json({ status: true, message: "data retrieved successfully", data: result });
				})
			});

		} catch (error) {
			res.json({ status: false, message: error.message });
		}
	  }

	  export const order_managament_user_history = async (req, res) => {
		try {
		 const list =
      "SELECT b.id, b.order_id, b.category_id, b.delievery_day, CONCAT(b.date, ' ', b.time) AS Date_Time, b.total_loads, b.status, b.order_status, b.order_type, u.name AS user_name, d.name AS driver_name, f.name AS folder_name FROM bookings AS b LEFT JOIN users AS u ON b.user_id = u.id LEFT JOIN users AS d ON b.driver_id = d.id LEFT JOIN users AS f ON b.folder_id = f.id WHERE b.cron_status = 1 AND b.order_status = 6 ORDER BY b.id DESC";

    const data = await new Promise((resolve, reject) => {
      dbConnection.query(list, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
		  
		  const order_status = data.map((row) => {
			if (row.order_status === 9) {
			  return "tagging";
			} else if (row.order_status === 10) {
			  return "Spotting";
			} else if (row.order_status === 11) {
			  return "Cleaning";
			} else if (row.order_status === 1) {
			  return "wash";
			} else if (row.order_status === 2) {
			  return "Dry";
			} else if (row.order_status === 3) {
			  return "Fold";
			} else if (row.order_status === 4) {
			  return "Package";
			} else if (row.order_status === 12) {
			  return "Inspect";
			} else if (row.order_status === 13) {
			  return "Press";
			} else if (row.order_status === 5) {
			  return "Order Collected";
			} else if (row.order_status === 6) {
			  return "Completed";
			} else if (row.order_status === 7) {
			  return "Order Not Found";
			} else if (row.order_status === 8) {
			  return "Order Pickup";
			} else {
			  return "NA";
			}
		  });
	  
		  const order_type = data.map((row) => {
			if (row.order_type === 1 || row.order_type === 2 || row.order_type === 4) {
			  return "Laundry";
			} else if (row.order_type === 3) {
			  return "DryClean";
			} else {
			  return "NA";
			}
		  });

		  const status = data.map((row) => {
			if (row.status === 0 ) {
			  return "inactive";
			} else if (row.status === 1) {
			  return "active";
			} else {
			  return "NA";
			}
		  });

		  const delievery_day = data.map((row) => {
			if (row.delievery_day === 0 ) {
			  return "same day";
			} else if (row.delievery_day === 1) {
			  return "next day";
			} else {
			  return "NA";
			}
		  });
	  
		  res.json({
			status: true,
			message: "data retrieved successfully",
			data: data.map((row, index) => ({
			  ...row,
			  order_status: order_status[index],
			  order_type: order_type[index],
			  status: status[index],
			  delievery_day:delievery_day[index]
			})),
		  });
		} catch (error) {
		  res.json({ status: false, message: error.message });
		}
	  };


	  export const delete_account = async (req, res) => {
		try {
			const userData = res.user;
			const user_id = userData[0].id;
	
			const sql = "UPDATE users SET is_deleted = ? WHERE id = ?";
			dbConnection.query(sql, [1, user_id], function (updateerror, updateResult) {
				if (updateerror) {
					return res.status(500).json({ status: false, message: 'Error deleting account', error: updateerror.message });
				}
				res.json({ status: true, message: 'Account deleted successfully' });
			});
		} catch (error) {
			res.status(500).json({ status: false, message: 'Error deleting account', error: error.message });
		}
	};

	export const delete_customer_account = async(req,res)=>{
		try { 
			const {email,password} = req.body;
			if(email && password){
				const checkIfEmailExist = "select * from users where email = '"+email+"'";
				dbConnection.query(checkIfEmailExist, function (error, data) {
					if(data.length > 0){
						if(data[0].status == 1){
						bcrypt.compare(password, data[0].password, function(error, result) {
							if(result == true){
								const sql = "UPDATE users SET is_deleted = ? WHERE email = ?";
									dbConnection.query(sql, [1,data[0].email ], function (updateerror, updateResult) {
										if (updateerror) {
										return res.status(500).json({ status: false, message: 'Error deleting account', error: updateerror.message });
										}
									// res.json({ status: true, message: 'Account deleted successfully' });
									res.render('Success');
									// res.render('Terms') });
										});
							}else{
								// res.json({'status':false,"message":"Incorrect password!"});
								res.render('Error',{message:"Incorrect password!"});
							}
						});
					}else{
						// res.json({'status':false,"message":"Your account has been deactivated, please connect with admin!"});
						res.render('Error',{message:"Your account has been deactivated, please connect with admin!"});
					}
					}else{
								// res.json({'status':false,"message":"User not found!"});
								res.render('Error',{message:"User not found!"});
							
					}
				});
			}else{
				// res.json({'status':false,"message":"All fields are required"});
				res.render('Error',{message:"All fields are required"});
			}
		}catch (error) {
			// res.json({'status':false,"message":error.message});  
			res.render('Error');
		}
	}
	
export default {
	user_registered_address,
	customer_register,
	contact_us,
	get_notification,
	customer_address,
	customer_login,
	generate_token,
	forgot_password,
	verify_otp,
	newsletter,
	change_password,
	edit_user_profile,
	update_password,
	get_user_profile,
	driver_list,
	customer_list,
	folder_list,
	order_list,
	order_list_dry_clean,
	register_employee,
	update_employee,
	delete_employee,
	update_user_status,
	customer_order_histroy,
	get_deleivery_instruction,
	order_managament_user_singup,
	order_managament_user_update,
	driver_data,
	folder_data,
	order_managament_user_history,
	delete_account,
	delete_customer_account
}