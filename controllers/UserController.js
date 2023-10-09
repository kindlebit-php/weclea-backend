import dbConnection from'../config/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from "../config/generateToken.js";
import transport from "../helpers/mail.js";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
import Path from 'path'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


//customer register API
export const customer_register = async(req,res)=>{
      try { 
      	const saltRounds = 10;
        const {name,email,password,mobile,comment,role,latitude,longitude,category_id} = req.body;
        if(name && email && password  && mobile && role && category_id){
        	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			const stripeCustomer = await stripe.customers.create({
			email: email,
			name: name,
			description: "Opening stripe account",
			phone: mobile
			});
			const customer_id=stripeCustomer.id;
			dbConnection.query(checkIfEmailExist, function (error, data) {
				// console.log(data[])
				if(data[0].total == 0){
					const checkIfMobileExist = "select count(id) as mobiletotal from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist, function (error, mobiledata) {
					if(mobiledata[0].mobiletotal == 0){
					
					bcrypt.hash(password, saltRounds, function(error, hash) {
						var sql = "INSERT INTO users (name, email,password,mobile,customer_id,comment,role,latitude,longitude,category_id) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+customer_id+"','"+comment+"','"+role+"','"+latitude+"','"+longitude+"','"+category_id+"')";
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

//customer address API
export const customer_address = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {delievery_instruction,pickup_address,pickup_appartment,pickup_city,pickup_state,pickup_zipcode,pickup_lat,pickup_long,drop_address,drop_appartment,drop_city,drop_state,drop_zipcode,drop_lat,drop_long,billing_address,billing_appartment,billing_city,billing_state,billing_zipcode,billing_lat,billing_long} = req.body;
        if(pickup_address && pickup_appartment && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long && drop_address && drop_appartment && drop_city && drop_state && drop_zipcode && drop_lat && drop_long && billing_address && billing_appartment && billing_city && billing_state && billing_zipcode && billing_lat && billing_long){
        
        if(pickup_address && pickup_appartment && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long){
	        var sql = "INSERT INTO customer_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+pickup_address+"', '"+pickup_appartment+"','"+pickup_city+"','"+pickup_state+"','"+pickup_zipcode+"','"+pickup_lat+"','"+pickup_long+"')";
	        dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
	        });
    	}
    	if(drop_address && drop_appartment && drop_city  && drop_state && drop_zipcode && drop_lat && drop_long){
	        var sql = "INSERT INTO customer_drop_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+drop_address+"', '"+drop_appartment+"','"+drop_city+"','"+drop_state+"','"+drop_zipcode+"','"+drop_lat+"','"+drop_long+"')";
	       await dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
	        });
    	}
    	if(billing_address && billing_appartment && billing_city  && billing_state && billing_zipcode && billing_lat && billing_long){
	        var sql = "INSERT INTO customer_billing_address (user_id,address, appartment,city,state,zip,latitude,longitude) VALUES ('"+userData[0].id+"','"+billing_address+"', '"+billing_appartment+"','"+billing_city+"','"+billing_state+"','"+billing_zipcode+"','"+billing_lat+"','"+billing_long+"')";
	        dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
	        });
    	}
    	if(delievery_instruction != ''){
    		var sql = "INSERT INTO delievery_insterctions (user_id,longitude) VALUES ('"+userData[0].id+"','"+pickup_address+"')";
	        dbConnection.query(sql, function (error, result) {
	        if (error) throw error;
	        });
    	}
	            res.json({'status':true,"message":"Address added successfully!"});

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
			const checkIfEmailExist = "select * from users where email = '"+email+"' and role = '"+type+"'";
			dbConnection.query(checkIfEmailExist, function (error, data) {
				if(data.length > 0){
					if(data[0].status == 1){
					bcrypt.compare(password, data[0].password, function(error, result) {
						if(result == true){
							data.forEach(element =>
							{
								const {id,name,email,mobile,comment,role,status,category_id} = element;
								
								const initi = {
									"id":id,"name":name,"email":email,"mobile":mobile,"comment":comment,"role":role,"status":status,'category_id':category_id,'token': generateToken({ userId: id, type: type }),
								}
								res.json({'status':true,"message":"Logged in successfully!",'data': initi});
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

//customer forgot password API
export const forgot_password = async(req,res)=>{
	try { 
		const {email} = req.body;
		if(email){
			const checkIfEmailExist = "select * from users where email = '"+email+"'";
			console.log('checkIfEmailExist',checkIfEmailExist)
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
						var img = process.env.BASE_URL+'/uploads/'+result[0].profile_image;
					}else{
						var img = process.env.BASE_URL+'/uploads/profile.png';

					}
					let initi = {
					"id":id,"name":name,"dob":dob,'category_id':category_id,"email":email,"mobile":mobile,'profile_img':img
					}
					// resData.push(initi);
				res.json({'status':true,"message":"Profile get successfully!",'data':initi});
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

//get user profile API
export const edit_user_profile = async(req,res)=>{
     try { 
        const userData = res.user;
        const {name,dob,category_id} = req.body;
        if(name  && dob, category_id){
			
			// const checkIfMobileExist = "select count(id) as total from users where id = '"+userData[0].id+"' and mobile = '"+mobile+"'";
			// dbConnection.query(checkIfMobileExist, function (error, data) {
			// if(data[0].total == 1 ){
				if(req.file){
					var userProfile = req.file.originalname;
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
export default {
	customer_register,
	customer_address,
	customer_login,
	forgot_password,
	verify_otp,
	change_password,
	edit_user_profile,
	update_password,
	get_user_profile
}