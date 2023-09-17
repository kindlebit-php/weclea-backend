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
        const {name,email,password,mobile,comment,role,latitude,longitude} = req.body;
        if(name && email && password  && mobile && comment && role){
        	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			const stripeCustomer = await stripe.customers.create({
			email: email,
			name: name,
			description: "Opening stripe account",
			phone: mobile
			});
			const customer_id=stripeCustomer.id;
			dbConnection.query(checkIfEmailExist, function (err, data) {
				// console.log(data[])
				if(data[0].total == 0){
					const checkIfMobileExist = "select count(id) as mobiletotal from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist, function (err, mobiledata) {
					if(mobiledata[0].mobiletotal == 0){
					
					bcrypt.hash(password, saltRounds, function(err, hash) {
						var sql = "INSERT INTO users (name, email,password,mobile,customer_id,comment,role,latitude,longitude) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+customer_id+"','"+comment+"','"+role+"','"+latitude+"','"+longitude+"')";
						dbConnection.query(sql, function (err, result) {
							if (err) throw err;
							var sql = "select * from users where id = '"+result.insertId+"'";
							dbConnection.query(sql, function (err, userList) {
							var resData = [];
							userList.forEach(element =>
							{
							const {id,name,email,mobile,comment,role,status} = element;

							let initi = {
							"id":id,"name":name,"email":email,"mobile":mobile,"comment":comment,"role":role,"status":status,'token': generateToken({ userId: id, type: role }),
							}
							resData.push(initi);
							});
								res.json({'status':true,"messagae":"data insert successfully!",'data':resData});
							}); 
							}); 
						});
					}else{
						res.json({'status':false,"messagae":'Mobile Number is already registered'});  
						
					}
					});
				}else{
					res.json({'status':false,"messagae":'Email is already registered'});  
				
				}
			})
        	
    	}else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}

//customer address API
export const customer_address = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {pickup_address,pickup_appartment,pickup_city,pickup_state,pickup_zipcode,pickup_comment,pickup_lat,pickup_long,drop_address,drop_appartment,drop_city,drop_state,drop_zipcode,drop_comment,drop_lat,drop_long,billing_address,billing_appartment,billing_city,billing_state,billing_zipcode,billing_comment,billing_lat,billing_long} = req.body;
        if(pickup_address && pickup_appartment && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long && drop_address && drop_appartment && drop_city && drop_state && drop_zipcode && drop_comment && drop_lat && drop_long && billing_address && billing_appartment && billing_city && billing_state && billing_zipcode && billing_comment && billing_lat && billing_long){
        
        if(pickup_address && pickup_appartment && pickup_city  && pickup_state && pickup_zipcode && pickup_lat && pickup_long){
	        var sql = "INSERT INTO customer_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+pickup_address+"', '"+pickup_appartment+"','"+pickup_city+"','"+pickup_state+"','"+pickup_zipcode+"','"+pickup_comment+"','"+pickup_lat+"','"+pickup_long+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	        });
    	}
    	if(drop_address && drop_appartment && drop_city  && drop_state && drop_zipcode && drop_lat && drop_long){
	        var sql = "INSERT INTO customer_drop_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+drop_address+"', '"+drop_appartment+"','"+drop_city+"','"+drop_state+"','"+drop_zipcode+"','"+drop_comment+"','"+drop_lat+"','"+drop_long+"')";
	       await dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	        });
    	}
    	if(billing_address && billing_appartment && billing_city  && billing_state && billing_zipcode && billing_lat && billing_long){
	        var sql = "INSERT INTO customer_billing_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+billing_address+"', '"+billing_appartment+"','"+billing_city+"','"+billing_state+"','"+billing_zipcode+"','"+billing_comment+"','"+billing_lat+"','"+billing_long+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	        });
    	}
	            res.json({'status':true,"messagae":"Address added successfully!"});

    }else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}

//customer drop-off address API
export const customer_drop_address = async(req,res)=>{
       try { 
     	const userData = res.user;
        const {address,appartment,city,state,zipcode,comment,lat,long} = req.body;
        if(address && appartment && city  && state && zipcode && lat && long){
	        var sql = "INSERT INTO customer_drop_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+address+"', '"+appartment+"','"+city+"','"+state+"','"+zipcode+"','"+comment+"',"+lat+"','"+long+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	            res.json({'status':true,"messagae":"Address added successfully!"});
	        });
    	}else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}

//customer billing address API
export const customer_billing_address = async(req,res)=>{
        try { 
     	const userData = res.user;
        const {address,appartment,city,state,zipcode,comment,lat,long} = req.body;
        if(address && appartment && city  && state && zipcode && lat && long){
	        var sql = "INSERT INTO customer_billing_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+address+"', '"+appartment+"','"+city+"','"+state+"','"+zipcode+"','"+comment+"',"+lat+"','"+long+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	            res.json({'status':true,"messagae":"Address added successfully!"});
	        });
    	}else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}

//customer login API
export const customer_login = async(req,res)=>{
	try { 
		const {email,password,type} = req.body;
		if(email && password && type){
			const checkIfEmailExist = "select * from users where email = '"+email+"' and role = '"+type+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				if(data.length > 0){
					if(data[0].status == 1){
					bcrypt.compare(password, data[0].password, function(err, result) {
						if(result == true){
							var resData = [];
							data.forEach(element =>
							{
								const {id,name,email,mobile,comment,role,status} = element;
								
								let initi = {
									"id":id,"name":name,"email":email,"mobile":mobile,"comment":comment,"role":role,"status":status,'token': generateToken({ userId: id, type: type }),
								}
								resData.push(initi);
							});
							res.json({'status':true,"messagae":"Logged in successfully!",'data': resData});
						}else{
							res.json({'status':false,"messagae":"Incorrect password!"});
						}
					});
				}else{
					res.json({'status':false,"messagae":"Your account has been deactivated, please connect with admin!"});
				}
				}else{
							res.json({'status':false,"messagae":"User not found!"});
						
				}
			});
		}else{
			res.json({'status':false,"messagae":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"messagae":error.message});  
	}
}

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
							res.json({'status':false,"messagae":error});
						} 
						else
						 {
							
							const updateUser = "UPDATE users SET otp = '"+otp+"' WHERE id = '"+data[0].id+"';"
						
							dbConnection.query(updateUser, function (err, datas) 
							{
								if(err)throw err;
								res.json({'status':true,"messagae":"Email send successfully!"});
							})
							
						}
					});
				}
				else
				{
					res.json({'status':false,"messagae":"User not found!"});
				}
			});
		}
		else
		{
			res.json({'status':false,"messagae":"All fields are required"});
		}
	}
	catch (error) 
	{ 
		res.json({'status':false,"messagae":error.message});  
	}
}

//customer verify OTP API
export const verify_otp = async(req,res)=>{
	try { 
		const {email,otp} = req.body;
		if(email && otp){
			const checkIfEmailExist = "select * from users where email = '"+email+"' and otp = '"+otp+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				// console.log('data',data)
				if(data.length > 0){
					res.json({'status':true,"messagae":"OTP verify successfully",'data':data});
				}else{
					res.json({'status':false,"messagae":"Incorrect OTP details!"});
				}
			});
		}else{
			res.json({'status':false,"messagae":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"messagae":error.message});  
	}
}

//customer change password API
export const change_password = async(req,res)=>{
	try { 
      	const saltRounds = 10;
		const {email,password} = req.body;
		if(email && password){
			const checkIfEmailExist = "select * from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				// console.log('data',data)
				if(data.length > 0){
					bcrypt.hash(password, saltRounds, function(err, hash) {
						const updateUser = "UPDATE users SET password = '"+hash+"' WHERE email = '"+email+"';"
						
						dbConnection.query(updateUser, function (err, datas) {
							if(err)throw err;
							res.json({'status':true,"messagae":"Password updated successfully!",'data':data});
						});
					});
				}else{
					res.json({'status':false,"messagae":"User not found!"});
				}
			});
		}else{
			res.json({'status':false,"messagae":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"messagae":error.message});  
	}
}


//get user profile API
export const get_user_profile = async(req,res)=>{
     try { 
        const userData = res.user;
        const { buy_loads} = req.body;
            var sql = "select * from users where id = '"+userData[0].id+"' ";
            dbConnection.query(sql, function (err, result) {
            if (err) throw err;
				var resData = [];
				result.forEach(element =>
				{
					const {id,name,email,mobile} = element;
					if(result[0].profile_image){
						var img = process.env.BASE_URL+'/uploads/'+result[0].profile_image;
					}else{
						var img = process.env.BASE_URL+'/uploads/profile.png';

					}
					let initi = {
					"id":id,"name":name,"email":email,"mobile":mobile,'profile_img':img
					}
					resData.push(initi);
				});
				res.json({'status':true,"messagae":"Price get successfully!",'data':resData});
            });
      
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}

//get user profile API
export const edit_user_profile = async(req,res)=>{
     try { 
        const userData = res.user;
        const saltRounds = 10;
        const {name,email,password,mobile} = req.body;
        if(name && email && password  && mobile){

       	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				if(data[0].total > 0 ){
					res.json({'status':false,"messagae":'Email is already registered'});  
				}else{
					const checkIfMobileExist = "select count(id) as total from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist, function (err, data) {
					if(data[0].total == 0 ){
					// profileUpload.single('profile_image')
					if(req.file){
					
						var userProfile = req.file.originalname;
					}else{
						var userProfile = userData[0].profile_image;
					}
					bcrypt.hash(password, saltRounds, function(err, hash) {
						var sql = "update users set name = '"+name+"', profile_image ='"+userProfile+"' ,email = '"+email+"',password = '"+hash+"', mobile = '"+mobile+"' where id = '"+userData[0].id+"'";
						dbConnection.query(sql, function (err, result) {
							if (err) throw err;
								res.json({'status':true,"messagae":"data updated successfully!"});
							}); 
						});
					}else{
						res.json({'status':false,"messagae":'Mobile Number is already registered'});  

					}
					});
				
				}
			})
		}else{
            res.json({'status':false,"messagae":"All fields are required"});
		}
      
    }catch (error) {
        res.json({'status':false,"messagae":error.message});  
    }
}
export default {
	customer_register,
	customer_address,
	customer_login,
	customer_billing_address,
	customer_drop_address,
	forgot_password,
	verify_otp,
	change_password,
	edit_user_profile,
	get_user_profile
}