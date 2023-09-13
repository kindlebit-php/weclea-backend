import dbConnection from'../config/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from "../config/generateToken.js";
import transport from "../helpers/mail.js";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


//customer register API
export const customer_register = async(req,res)=>{
      try { 
      	const saltRounds = 10;
        const {name,email,password,mobile,comment} = req.body;
        if(name && email && password  && mobile && comment ){
        	const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			const stripeCustomer = await stripe.customers.create({
				email: email,
				name: name,
				description: "Opening stripe account",
				phone: mobile
			  });
				const customer_id=stripeCustomer.id;
			  console.log(customer_id)
			dbConnection.query(checkIfEmailExist, function (err, data) {
				if(data[0].total > 0 ){
					res.json({'status':false,"messagae":'Email is already registered'});  
				}else{
					const checkIfMobileExist = "select count(id) as total from users where mobile = '"+mobile+"'";
					dbConnection.query(checkIfMobileExist, function (err, data) {
					if(data[0].total > 0 ){
						res.json({'status':false,"messagae":'Mobile Number is already registered'});  
					}
					bcrypt.hash(password, saltRounds, function(err, hash) {
						var sql = "INSERT INTO users (name, email,password,mobile,customer_id,comment,role) VALUES ('"+name+"', '"+email+"','"+hash+"','"+mobile+"','"+customer_id+"','"+comment+"','1')";
						dbConnection.query(sql, function (err, result) {
							if (err) throw err;
								res.json({'status':true,"messagae":"data insert successfully!"});
							}); 
						});
					});
				
				}
			})
        	
    	}else{
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}

//customer address API
export const customer_address = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {address,appartment,city,state,zipcode,comment,lat,long} = req.body;
        if(address && appartment && city  && state && zipcode && lat && long){
	        var sql = "INSERT INTO customer_address (user_id,address, appartment,city,state,zip,comment,latitude,longitude) VALUES ('"+userData[0].id+"','"+address+"', '"+appartment+"','"+city+"','"+state+"','"+zipcode+"','"+comment+"',"+lat+"','"+long+"')";
	        dbConnection.query(sql, function (err, result) {
	        if (err) throw err;
	            res.json({'status':true,"messagae":"Address added successfully!"});
	        });
    	}else{
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
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
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
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
            res.json({'status':true,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}

//customer login API
export const customer_login = async(req,res)=>{
	try { 
		const {login_id,password,type} = req.body;
		if(login_id && password && type){
			const checkIfEmailExist = "select * from users where email = '"+login_id+"' and role = '"+type+"'";
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
							res.json({'status':true,"messagae":"Incorrect password!"});
						}
					});
				}else{
					res.json({'status':true,"messagae":"Your account has been deactivated, please connect with admin!"});
				}
				}else{
					const checkIfEmailExist = "select * from users where mobile = '"+login_id+"' and role = '"+type+"'";
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
									res.json({'status':true,"messagae":"Incorrect password!"});
								}
							});
						}else{
							res.json({'status':true,"messagae":"Your account has been deactivated, please connect with admin!"});

						}
						}else{
							res.json({'status':true,"messagae":"User not found!"});
						}
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

//customer forgot password API
export const forgot_password = async(req,res)=>{
	try { 
		const {login_id} = req.body;
		if(login_id){
			const checkIfEmailExist = "select * from users where email = '"+login_id+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				if(data.length > 0){
					var otp = 123456
					const mailOptions = 
					{
					from: 'ankuchauhan68@gmail.com',
					to: login_id,
					subject: "Verify Your Email",
					html: `<h2>Hello ${data[0].name}! 
					Thanks for registering on our site.</h2>
					<h4>Please verify your email to continue...</h4>
					<h2> OTP=  ${otp} <h2>`,
					};

					transport.sendMail(mailOptions, function (error, info) 
					{
						if (error) 
						{
							res.json({'status':true,"messagae":error});
						} 
						else
						 {
							
							const updateUser = "UPDATE users SET otp = '"+otp+"' WHERE id = '"+data[0].id+"';"
						
							dbConnection.query(updateUser, function (err, datas) 
							{
								if(err)throw err;
								res.json({'status':true,"messagae":"Email send successfully!",'data':data});
							})
							
						}
					});
				}
				else
				{
					res.json({'status':true,"messagae":"User not found!"});
				}
			});
		}
		else
		{
			res.json({'status':true,"messagae":"All fields are required"});
		}
	}
	catch (error) 
	{ 
		res.json({'status':false,"messagae":error});  
	}
}

//customer verify OTP API
export const verify_otp = async(req,res)=>{
	try { 
		const {login_id,otp} = req.body;
		if(login_id && otp){
			const checkIfEmailExist = "select * from users where email = '"+login_id+"' and otp = '"+otp+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				// console.log('data',data)
				if(data.length > 0){
					res.json({'status':true,"messagae":"OTP verify successfully",'data':data});
				}else{
					res.json({'status':true,"messagae":"Incorrect login details!"});
				}
			});
		}else{
			res.json({'status':true,"messagae":"All fields are required"});
		}
	}catch (error) {
		res.json({'status':false,"messagae":error});  
	}
}

//customer change password API
export const change_password = async(req,res)=>{
	try { 
      	const saltRounds = 10;
		const {login_id,password} = req.body;
		if(login_id && password){
			const checkIfEmailExist = "select * from users where email = '"+login_id+"'";
			dbConnection.query(checkIfEmailExist, function (err, data) {
				// console.log('data',data)
				if(data.length > 0){
					bcrypt.hash(password, saltRounds, function(err, hash) {
						const updateUser = "UPDATE users SET password = '"+hash+"' WHERE email = '"+login_id+"';"
						
						dbConnection.query(updateUser, function (err, datas) {
							if(err)throw err;
							res.json({'status':true,"messagae":"Password updated successfully!",'data':data});
						});
					});
				}else{
					res.json({'status':true,"messagae":"User not found!"});
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
	customer_register,
	customer_address,
	customer_login,
	customer_billing_address,
	customer_drop_address,
	forgot_password,
	verify_otp,
	change_password
}