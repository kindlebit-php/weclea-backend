import dbConnection from'../../config/db.js';
import transport from "../../helpers/mail.js";
import bcrypt from 'bcrypt';
import { generateToken } from "../../config/generateToken.js";
import dotenv from "dotenv";
import AWS from 'aws-sdk';
const USER_KEY ='AKIAQN6QN5FKDLFL2AOZ';
const USER_SECRET = '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';
const BUCKET_NAME = 'weclea-bucket';

 let s3bucket = new AWS.S3({
       accessKeyId: USER_KEY,
       secretAccessKey: USER_SECRET,
       Bucket: BUCKET_NAME,
     });


/************* Dry cleaning services  ****************/ 
/*
  var postdata=req.body;
  //console.log('body',postdata);
  //console.log('files',req.files);
  //Validating the input entity
   if(!postdata['user_id'] || postdata['user_id']==""  ) {
      //return res.status(422).send(json_format.errorMessage);
      return res.json({
         "success":false,
         "data":"",
         "message":"user_id is required"
      });
   }
      postdata.profile_pic='';
      if (req.files) {
        let getFile = req.files.profile_pic;//mimetype
        var ext=path.extname(getFile['name']);
        var filename= Date.now()+'_'+postdata.user_id+ext;
        var fileData =getFile['data']; 
        s3bucket.createBucket(function () {
             var params = {
              Bucket: BUCKET_NAME+"/sixprofit/uploaded_media/"+postdata.user_id,
              Key: filename,
              ACL: 'public-read',
              Body:fileData,

             };
            s3bucket.upload(params, function (err, data) {
                if (err) {
                 console.log('error in callback');
                 console.log(err);
                }
              postdata.profile_pic=data.Location;
              userService.changeProfilePic(postdata).then((data) => {
                if(data) {
                  res.json(data);
                }
              }).catch((err) => {
                //mail.mail(err);
                res.json(err);
              });  
            });
       });
    }else{
      return res.json({
       "success":false,
       "data":"",
       "message":"Please upload the profie picture"
      });  
    }

*/
 export const get_countries = async(req,res)=>{
    try { 
		const loads = "select * from wc_countries order by name asc";
		dbConnection.query(loads, function (error, data) {
			if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_states = async(req,res)=>{
	var reqData=req.params
    try { 
    	if (reqData.country_id) {
    		const country_id= reqData.country_id
			const loads = "select * from wc_states where country_id=? order by name asc";
			dbConnection.query(loads,[country_id], function (error, data) {
				if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
				
			});
		}else{
			res.json({'status':false,"message":"Please send required parameters"});
		}
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_cities = async(req,res)=>{
    var reqData=req.params
    try { 
    	if (reqData.state_id) {
    		const state_id= reqData.state_id 
			const loads = "select * from wc_cities where state_id=? order by name asc";
			dbConnection.query(loads,[state_id], function (error, data) {
				if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});	
			});
		}else{
			res.json({'status':false,"message":"Please send required parameters"});
		}	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_county_cities = async(req,res)=>{
    var reqData=req.params;
    try { 
    	if (reqData.state_id) {
    		const state_id= reqData.state_id;
			const loads = "select wc_cities.* from wc_cities inner join wc_county on wc_county.city_id=wc_cities.id where wc_county.name=? order by wc_cities.name asc";
			dbConnection.query(loads,[state_id], function (error, data) {
				if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});	
			});
		}else{
			res.json({'status':false,"message":"Please send required parameters"});
		}	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
 export const get_drycleaning_itemlist = async(req,res)=>{
    try { 
		const loads = "select * from dry_clean_services where isDelete=0 order by updated_at desc";
		dbConnection.query(loads, function (error, data) {
			if (error) throw error;
			const dryCleanChares = `SELECT dry_clean_charges FROM settings `;
			dbConnection.query(dryCleanChares, function (error, dryCleanCharesdata) {
				if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data,"mini_order_amount":dryCleanCharesdata[0].dry_clean_charges});
			});	
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const add_drycleaning_service = async(req,res)=>{
	try { 
		var reqData=req.body;
		console.log('reqData body',reqData,'files',req.file);
		if(!reqData['title'] || reqData['title']==""  ) {
		  return res.json({
		     "success":false,
		     "data":"",
		     "message":"title is required"
		  });
		}
		const qrySelect = "select id from dry_clean_services where `title`=? and `price`=? and `isDelete`=0";
		dbConnection.query(qrySelect,[reqData.title, reqData.price], function (error, data) {
			if (error) throw error;
			if (data.length<=0) {
				var product_image='';
		      	if (req.file) {
		      		if(req.file){
						var product_image = req.file.originalname;
					}
			        /*let getFile = req.file.service_pic;//mimetype
			        var ext=path.extname(getFile['name']);
			        var filename= Date.now()+'_'+reqData.price+ext;
			        var fileData =getFile['data']; 
			        s3bucket.createBucket(function () {
			             var params = {
			              Bucket: BUCKET_NAME+"/dry_clean_services",
			              Key: filename,
			              ACL: 'public-read',
			              Body:fileData,

			             };
			            s3bucket.upload(params, function (err, data) {
			                if (err) {
			                 console.log('error in callback');
			                 console.log(err);
			                }
			                console.log("S3 AWS res==>",data)
			              	product_image=data.Location;
							//`title`, `price`, `image`,*/
							var addContnetQry = "insert dry_clean_services set `title`=?, `price`=?, `image`=?, `note`=?";
						    dbConnection.query(addContnetQry,[reqData.title, reqData.price, product_image, reqData.note], function (error, data) {
							if (error) throw error;
								res.json({'status':true,"message":"Service has been saved successfully",'data':data});
							});	              

			          /*  });
			       	});
					*/	
		    	}else{
					
				   	var addContnetQry = "insert dry_clean_services set `title`=?, `price`=? , note=?";
				    dbConnection.query(addContnetQry,[reqData.title, reqData.price, reqData.note], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"Service has been saved successfully",'data':data});
					});
				}	
			}else{
				res.json({'status':false,"message":"Same service already exist"});
			}
		});	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_drycleaning_service = async(req,res)=>{
	try { 
		var reqData=req.body;
		console.log("reqData",reqData,'files',req.file);
		if(!reqData['id'] || reqData['id']==""  ) {
		  return res.json({
		     "success":false,
		     "data":"",
		     "message":" service id is required"
		  });
		}
		const qrySelect = "select id from dry_clean_services where `title`=? and `price`=? and `isDelete`=0 and id!=?";
		dbConnection.query(qrySelect,[reqData.title, reqData.price, reqData.id], function (error, data) {
			if (error) throw error;
			if (data.length<=0) {
				var product_image='';
		      	if (req.file) {
		      		if(req.file){
						var product_image = req.file.originalname;
					}
			        /*let getFile = req.file.service_pic;//mimetype
			        var ext=path.extname(getFile['name']);
			        var filename= Date.now()+'_'+reqData.price+ext;
			        var fileData =getFile['data']; 
			        s3bucket.createBucket(function () {
			             var params = {
			              Bucket: BUCKET_NAME+"/dry_clean_services",
			              Key: filename,
			              ACL: 'public-read',
			              Body:fileData,

			             };
			            s3bucket.upload(params, function (err, data) {
			                if (err) {
			                 console.log('error in callback');
			                 console.log(err);
			                }
			                console.log("S3 AWS res==>",data)
			              	product_image=data.Location;*/
							//`title`, `price`, `image`,
							var addContnetQry = "update dry_clean_services set `title`=?, `price`=?, `image`=?, note=? where id=?";
						    dbConnection.query(addContnetQry,[reqData.title, reqData.price, product_image, reqData.note, reqData.id], function (error, data) {
							if (error) throw error;
								res.json({'status':true,"message":"Service has been saved successfully",'data':data});
							});	              

			            /*});
			       	});*/

		    	}else{
					
				   	var addContnetQry = "update dry_clean_services set `title`=?, `price`=?, note=? where id=?";
				    dbConnection.query(addContnetQry,[reqData.title, reqData.price, reqData.note,reqData.id], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"Service has been saved successfully",'data':data});
					});
				}	
			}else{
				res.json({'status':false,"message":"Same service already exist"});
			}
		});	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const delete_service = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from dry_clean_services where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Service has been activated successfully"
				if (reqData.isDelete==1) {
					msg= "Service has been deleted successfully"
				}
			    var updateContnetQry = "update dry_clean_services set isDelete=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.isDelete,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_service_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from dry_clean_services where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Service has been deactivated successfully"
				if (reqData.status==1) {
					msg= "Service has been activated successfully"
				}
			    var updateContnetQry = "update dry_clean_services set status=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.status,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


 /************ end Dry Cleaning*************/
/******** Admin Dashboard Data API *********/
export const get_dashboard_content = async(req,res)=>{
    try { 
    	const loads = "SELECT COUNT(id) total_order,sum(total_loads) total_load  FROM `bookings` WHERE status=1 and cron_status=1";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			const qry = "SELECT count(id) total_users, users.role FROM `users` WHERE status=1 GROUP by role";
			dbConnection.query(qry, function (error, users) {
				if (error){ 
					throw error;
				}else{
					data[0]['users']=users;
					res.json({'status':true,"message":"Success",'data':data});
				}
			});

		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const getGraphData=async(req,res)=>{
	try { 
    	const loads = "SELECT count(bookings.order_id) total_orders,sum(bookings.total_loads) total_loads,YEAR(bookings.created_at) years FROM `bookings` WHERE bookings.cron_status=1 and bookings.status=1 GROUP by YEAR(bookings.created_at)";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			const qry = "SELECT count(bookings.order_id) total_orders,sum(bookings.total_loads) total_loads,month(bookings.created_at) month  FROM `bookings` WHERE bookings.cron_status=1 and bookings.status=1 and Year(now())=year(created_at) GROUP by month(bookings.created_at)";
			dbConnection.query(qry, function (error, monthlyOrder) {
				if (error){ 
					throw error;
				}else{
					//
					const qry = "SELECT count(bookings.order_id) total_orders,sum(bookings.total_loads) total_loads,month(bookings.created_at) month,users.city FROM `bookings` LEFT JOIN users on users.id=bookings.driver_id WHERE bookings.cron_status=1 and bookings.status=1 GROUP by users.city";
					dbConnection.query(qry, function (error, countyOrder) {
						if (error){ 
							throw error;
						}else{
							//SELECT count(bookings.order_id) total_orders,sum(bookings.total_loads) total_loads,year(bookings.created_at) month,users.name FROM `bookings` LEFT JOIN users on users.id=bookings.user_id WHERE bookings.cron_status=1 GROUP by bookings.user_id,Year(bookings.created_at);
							const qry = "SELECT count(bookings.order_id) total_orders,sum(bookings.total_loads) total_loads,year(bookings.created_at) year,users.name FROM `bookings` LEFT JOIN users on users.id=bookings.user_id WHERE bookings.cron_status=1 GROUP by bookings.user_id,Year(bookings.created_at)";
							dbConnection.query(qry, function (error, userSalePerformance) {
								if (error){ 
									throw error;
								}else{
									res.json({'status':true,"message":"Success",'data':{yearly:data,monthlyOrder:monthlyOrder,countyOrder:countyOrder,userSalePerformance:userSalePerformance}});
								}
							});	
						}
					});	
				}
			});

		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

/*********  User Listing*************/

export const get_all_userList = async(req,res)=>{
	var reqData= req.params;
    try { 
    	const loads = "select id, email, mobile,name, role, role_id, status,profile_image,isAdmin from users";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_userList = async(req,res)=>{
	var reqData= req.params;
    try { 
    	var usrLoads = "select sum(commercial+residential+yeshiba) as total_loads from customer_loads_availabilty where user_id =users.id";
    	if(reqData.category_id){
	    	if(reqData.category_id == 1){
	            usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = users.id";
	        }else if(reqData.category_id == 2){
	            usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = users.id";
	        }else if(reqData.category_id == 3){
	            usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = users.id";
	        }
	    }
    	const loads = "select users.*,booking_instructions.pickup_instruction,booking_instructions.delievery_instruction, ("+usrLoads+") total_load from users LEFT JOIN booking_instructions on booking_instructions.user_id = users.id where users.role=1";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const get_user_history = async(req,res)=>{
	var reqData= req.params;
    try { 
    	const loads = "select users.*,customer_address.`address`, customer_address.`appartment`, customer_address.`city`, customer_address.`state`, customer_address.`zip`,customer_address.`latitude`, customer_address.`longitude` from users left join customer_address on customer_address.user_id=users.id where users.id=?";
		dbConnection.query(loads,[reqData.user_id], function (error, rows) {
			if (error) throw error;
			if (rows.length>0) {
	    		const qry = "SELECT * FROM `bookings`  WHERE user_id=?";
				dbConnection.query(qry,[reqData.user_id], function (error, data) {
					if (error) throw error;
					rows[0]['orders']=data
					res.json({'status':true,"message":"Success",'data':rows[0]});
				})
			}else{
				res.json({'status':true,"message":"Success",'data':rows});
			}	
		});	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const sendNotification=async(req,res)=>{
	var reqData=req.body;
	try{
		/*const loads = "select wc_email_template.* from wc_email_template where id=12";
		dbConnection.query(loads, function (error, rows) {
			if (error) throw error;
			if (rows.length>0) {	    
				var message= rows[0].body;
				//message =message.replace('[username]',argument.username );
		        //message =message.replace('[url]',argument.title );
		        //message =message.replace( '[subject]',argument.subject);
		        //message =message.replace('[message]',argument.message );
				*/
				const mailOptions = 
		     	{
			        from: '"WeClea" <support@weclea.com>',
			        to: reqData.emails,
			        subject: reqData.subject,
			        html: reqData.body,//message,
		        };
		        transport.sendMail(mailOptions, function (error, info) 
		        {
		        	console.log(error,info);
		        	res.json({'status':true,"message":"Success",'data':info,"error":error});

		        });
    		//}
		//})
	}catch(error){
		res.json({'status':false,"message":error.message});  
	}
}

/*********** User Listing End ************/


/******** Package Listing************/
export const get_packagesList = async(req,res)=>{
      try { 
        	const loads = "select * from admin_packages where isDelete=0 order by created_at desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				const dryCleanChares = `SELECT extra_chages FROM settings `;
        		dbConnection.query(dryCleanChares, function (error, dryCleanCharesdata) {
        			if (error) throw error;
        			res.json({'status':true,"message":"Success",'data':data,"mini_order_amount":dryCleanCharesdata[0].extra_chages});
        		})	
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_packages = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from admin_packages where `category_id`=? and `type`=? and `loads`=? and `min_load_per_day`=? and `price`=? and status=1 and id!=?";
		dbConnection.query(qrySelect,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price , reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) { ///`category_id`, `type`, `loads`, `min_load_per_day`, `price`,
			    var updateContnetQry = "update admin_packages set `category_id`=?, `type`=?, `loads`=?, `min_load_per_day`=?, `price`=?, `note`=? where id = ? ";
			    dbConnection.query(updateContnetQry,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price, reqData.note,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Package has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same Package already exist"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const create_packages = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from admin_packages where `category_id`=? and `type`=? and `loads`=? and `min_load_per_day`=? and `price`=? and status=1";
		dbConnection.query(qrySelect,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var addContnetQry = "insert admin_packages set `category_id`=?, `type`=?, `loads`=?, `min_load_per_day`=?, `price`=?, `note`=? ";
			    dbConnection.query(addContnetQry,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price, reqData.note], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Package has been saved successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same Package already exist"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const delete_packages = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from admin_packages where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Package has been activated successfully"
				if (reqData.isDelete==1) {
					msg= "Package has been deleted successfully"
				}
			    var updateContnetQry = "update admin_packages set isDelete=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.isDelete,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_package_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from admin_packages where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Package has been deactivated successfully"
				if (reqData.status==1) {
					msg= "Package has been activated successfully"
				}
			    var updateContnetQry = "update admin_packages set status=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.status,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const get_package_details = async(req,res)=>{
	const reqData = req.params;
    try { 
    	const qrySelect = "select id from admin_packages where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				
			    var updateContnetQry = "select count(id) total_subscription from customer_loads_subscription where category_id=? and payment_status=1 ";
			    dbConnection.query(updateContnetQry,[data[0].category_id], function (error, subscription) {
					if (error){ 
						throw error;
					}{
						data[0]['total_subscription']=subscription[0].total_subscription;
						res.json({'status':true,"message":"Success",'data':data});
					}
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

/*********** End Package**************/
/************ Start landing page content************/

export const get_page_content = async(req,res)=>{
      try { 
        	const loads = "select `user_id`, `section`, content from wc_page_content";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_page_content = async(req,res)=>{
	const reqData = req.body;
	console.log("content==>",reqData.content,JSON.stringify(reqData.content));
    try { 
    	const qrySelect = "select `user_id`, `section`, content from wc_page_content where section=?";
		dbConnection.query(qrySelect,[reqData.section], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
			    var updateContnetQry = "update wc_page_content set content = '"+JSON.stringify(reqData.content)+"' where section = '"+reqData.section+"' ";
			    dbConnection.query(updateContnetQry, function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Content has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"No record found"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


/************end landing page content************/

/********** Start FAQ API ****************/
export const get_faq_content = async(req,res)=>{
      try { 
        	const loads = "select * from wc_faq order by index_id asc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


export const update_faq = async(req,res)=>{
	const reqData = req.body;
	const userData = res.user;
  	const userId =1;// userData[0].id;
    try { 
    	const qrySelect = "select id from wc_faq where title=? and id!=?";
		dbConnection.query(qrySelect,[reqData.section,reqData.faq_id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var updateContnetQry = "update wc_faq set user_id='"+userId+"', faq_type='"+reqData.faq_type+"', title = '"+reqData.title+"',content = '"+reqData.content+"' where id = "+reqData.faq_id+" ";
			    dbConnection.query(updateContnetQry, function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"FAQ has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same FAQ already exist"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const create_faq = async(req,res)=>{
	const reqData = req.body;
	const userData = res.user;
	console.log(userData);
  	const userId =1;// userData[0].id;
    try { 
    	const qrySelect = "select id from wc_faq where title=?";
		dbConnection.query(qrySelect,[reqData.section], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var updateContnetQry = "insert wc_faq set user_id='"+userId+"', faq_type='"+reqData.faq_type+"',title = '"+reqData.title+"',content = '"+reqData.content+"'";
			    dbConnection.query(updateContnetQry, function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"FAQ has been saved successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same FAQ already exist"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const delete_faq = async(req,res)=>{
	var reqData = req.body;
	reqData = reqData.id;
    try { 
    	if (reqData.length>0) {
	    	for (var i = 0; i < reqData.length; i++) {
				var updateContnetQry = "delete from wc_faq where id=? ";
				var k=0
				dbConnection.query(updateContnetQry,[reqData[i].id], function (error, data) {
				if (error) throw error;
					if (k>=reqData.length-1) {
						res.json({'status':true,"message":"FAQ has been deleted successfully",'data':data});
					}
					k++;
				});	
	    	}
    	}else{
			res.json({'status':false,"message":"Record not found"});
		}
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_faq_index = async(req,res)=>{
	const reqData = req.body;
	const position = reqData.position;
	const faq_type = reqData.faq_type;
  	const index_id =1;
  	console.log('update_faq_index',position);
    try { 
    	for (var i = 0; i < position.length; i++) {
    		console.log("update wc_faq set index_id='"+i+"' where id = "+position[i]['id']+"  and faq_type = '"+faq_type+"' ");
    		var updateContnetQry = "update wc_faq set index_id="+i+" where id = "+position[i]['id']+" and faq_type = '"+faq_type+"'";
    		var k=0;
    		dbConnection.query(updateContnetQry, function (error, data) {
				if (error) throw error;
				console.log(k+"=="+position.length-1);
				if (k>=position.length-1) {
					res.json({'status':true,"message":"FAQ has been updated successfully",'data':data});
				}
				k++;
			});
    	}
    	//res.json({'status':false,"message":"Same FAQ already exist",data:reqData});
    	/*const qrySelect = "select id from wc_faq where title=? and id!=?";
		dbConnection.query(qrySelect,[reqData.section,reqData.faq_id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var updateContnetQry = "update wc_faq set index_id='"+index_id+"' where id = "+reqData.faq_id+" ";
			    dbConnection.query(updateContnetQry, function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"FAQ has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same FAQ already exist"});
			}
		})*/
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
/********* End FAQ API ************/

/********* Order listing************/
export const get_all_order = async(req,res)=>{
	var reqData= req.params
	try { 
		var LimitNum = 25
        var startNum = 0;
        var currentPage=25;
        if(reqData.start == '' || reqData.limit == ''){
              startNum = 0;
              LimitNum = 25;
        }else{
             //parse int Convert String to number 
              startNum = parseInt(reqData.start);
              LimitNum = parseInt(reqData.limit); 
              currentPage=currentPage+startNum;
        }
        var query=""
        var queryType=""
        var orderType=""
		if (reqData.searchStr  && reqData.searchStr!='all') {
		  query=" and ( bookings.date like '%"+reqData.searchStr+"%' or bookings.order_id like '%"+reqData.searchStr+"%' or users.name like '%"+reqData.searchStr+"%' or users.email like '%"+reqData.searchStr+"%') ";          
		}
		if (reqData.type  && reqData.type!='9') {
		  	queryType=" and bookings.order_status like '%"+reqData.type+"%' ";          
		}
		if (reqData.order_type  && reqData.order_type!='3' && reqData.order_type!='0') {
		  	orderType=" and bookings.order_type!='3' ";          
		}else if(reqData.order_type  && reqData.order_type=='3') {
		  	orderType=" and bookings.order_type='3' ";          
		}
        dbConnection.query("SELECT bookings.order_id,bookings.user_id,bookings.delievery_day,bookings.date,bookings.time,bookings.total_loads,bookings.order_status,bookings.order_type,bookings.order_status,(SELECT users.name FROM users WHERE id=bookings.driver_id LIMIT 1) driver_name,(SELECT users.profile_image FROM users WHERE id=bookings.driver_id LIMIT 1) driver_pic,users.name customer_name,booking_instructions.pickup_instruction,booking_instructions.delievery_instruction,users.profile_image customer_pic FROM `bookings` LEFT join booking_instructions on booking_instructions.user_id = bookings.user_id LEFT JOIN users on  users.id=bookings.user_id WHERE bookings.cron_status=1 "+queryType+" "+query+" "+orderType+" order by bookings.id desc", (error, rows) => {
            if (error) {
                 res.json({'status':false,"message":error.message}); 
            } else {

                if (rows.length>0) {
                    var totalRecords=rows.length
                    if (totalRecords>currentPage) {
                        totalRecords=true;
                    }else{
                        totalRecords=false;
                    }
                }else{
                    var totalRecords=false;
                }
				const loads = "SELECT ratings.rating_id, bookings.total_amount,bookings.id,bookings.user_id, bookings.order_id,bookings.delievery_day,bookings.date,bookings.time,bookings.total_loads,bookings.order_status,bookings.order_type,bookings.order_status,(SELECT users.name FROM users WHERE id=bookings.driver_id LIMIT 1) driver_name,(SELECT users.profile_image FROM users WHERE id=bookings.driver_id LIMIT 1) driver_pic,(SELECT users.mobile FROM users WHERE id=bookings.driver_id LIMIT 1) driver_mobile,(SELECT users.email FROM users WHERE id=bookings.driver_id LIMIT 1) driver_email,booking_instructions.pickup_instruction,booking_instructions.delievery_instruction,users.name customer_name,users.profile_image customer_pic, users.mobile customer_mobile,users.email customer_email FROM `bookings` LEFT JOIN users on  users.id=bookings.user_id LEFT join booking_instructions on booking_instructions.user_id = bookings.user_id left join ratings on ratings.booking_id=bookings.id WHERE bookings.cron_status=1   "+queryType+" "+query+" "+orderType+" order by bookings.id desc limit ? offset ?";
				dbConnection.query(loads,[LimitNum,startNum],function (error, rows) {
				if (error) throw error;
					res.json({'status':true,"message":"Success",'data':{totalRecords,rows}});
				});
			}
		});		

    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_order_detail = async(req,res)=>{
	var reqData= req.params
	if (reqData.booking_id && reqData.booking_id!='') {
	    try { 
	    	//const loads = "SELECT booking_timing.*,booking_images.*,bookings.order_id as main_order_id FROM bookings left join `booking_timing` on booking_timing.booking_id=bookings.id LEFT JOIN booking_images on booking_images.booking_id=booking_timing.booking_id WHERE booking_timing.booking_id=?";
			const loads="SELECT * FROM `booking_instructions` LEFT JOIN ratings on ratings.user_id=booking_instructions.user_id WHERE (booking_instructions.user_id=? or ratings.booking_id =?)"
			dbConnection.query(loads,[reqData.user_id,reqData.booking_id], function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data[0]});
			});
	    }catch (error) {
	        res.json({'status':false,"message":error.message});  
	    }
	}else{
		res.json({'status':false,"message":"No record found"});
	}
}
/*******************/
/********* Driver listing************/
export const get_all_driver = async(req,res)=>{
	var reqData= req.params;
	//console.log("get_all_driver",reqData)
	try { 
		var LimitNum = 25
        var startNum = 0;
        var currentPage=25;
        if(reqData.start == '' || reqData.limit == ''){
              startNum = 0;
              LimitNum = 25;
        }else{
             //parse int Convert String to number 
              startNum = parseInt(reqData.start);
              LimitNum = parseInt(reqData.limit); 
              currentPage=currentPage+startNum;
        }
        var query=""
        var queryType=""
		if (reqData.searchStr  && reqData.searchStr!='all') {
		  query=" and ( users.name like '%"+reqData.searchStr+"%' or users.email like '%"+reqData.searchStr+"%') ";          
		}
		// if (reqData.type  && reqData.type!='9') {
		//   	queryType=" and users.order_status like '%"+reqData.type+"%' ";          
		// }
        dbConnection.query("SELECT * FROM `users` WHERE users.role=2 "+query+" order by id desc", (error, rows) => {
            if (error) {
                res.json({'status':false,"message":error.message}); 
            } else {
                if (rows.length>0) {
                    var totalRecords=rows.length
                    if (totalRecords>currentPage) {
                        totalRecords=true;
                    }else{
                        totalRecords=false;
                    }
                }else{
                    var totalRecords=false;
                }
				const loads = "SELECT users.*,(select count(id) from bookings where driver_id=users.id and cron_status=1) total_order, (select order_status from bookings where driver_id=users.id and cron_status=1 order by id desc limit 1) current_order_status FROM `users` WHERE users.role=2 "+query+"  order by users.id desc limit ? offset ?";
				dbConnection.query(loads,[LimitNum,startNum],function (error, rows) {
				if (error) throw error;
					res.json({'status':true,"message":"Success",'data':{totalRecords,rows}});
				});
			}
		});		

    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_driver_detail = async(req,res)=>{
	var reqData= req.params
	console.log("get_driver_detail == ",reqData)
	if (reqData.user_id && reqData.user_id!='') {
	    try { 
	    	var LimitNum = 25
	        var startNum = 0;
	        var currentPage=25;
	        if(reqData.start == '' || reqData.limit == ''){
	            startNum = 0;
	            LimitNum = 25;
	        }else{
	            //parse int Convert String to number 
	            startNum = parseInt(reqData.start);
	            LimitNum = parseInt(reqData.limit); 
	            currentPage=currentPage+startNum;
	        }
	        var query="";
			if(reqData.searchStr  && reqData.searchStr!='all') {
			  	query=" and ( bookings.id like '%"+reqData.searchStr+"%' or bookings.date like '%"+reqData.searchStr+"%')";          
			}
	        const loads = "SELECT * FROM `bookings` LEFT JOIN users on bookings.user_id=users.id left join booking_timing on booking_timing.booking_id=bookings.id WHERE  users.id=? "+query+" order by bookings.id desc";
			dbConnection.query(loads,[reqData.user_id], function (error, data) {
				if (error) {
	                res.json({'status':false,"message":error.message}); 
	            } else {
	            	var userinfo= [];
	                if (data.length>0) {
	                    var totalRecords=data.length;
	                    if (totalRecords>currentPage) {
	                        totalRecords=true;
	                    }else{
	                        totalRecords=false;
	                    }
	                }else{
	                    var totalRecords=false;
	                }
	                const loads = "SELECT * FROM `users`  WHERE users.role=2 and users.id=?";
					dbConnection.query(loads,[reqData.user_id], function (error, userinfo) {
						if (error) throw error;
				    	const loads = "SELECT *, users.email customer_email, users.name customer_name,users.profile_image customer_pic FROM  bookings LEFT JOIN `users` on bookings.user_id=users.id left join booking_timing on booking_timing.booking_id=bookings.id WHERE  bookings.driver_id=? "+query+" order by bookings.id desc limit ? offset ?";
						dbConnection.query(loads,[reqData.user_id,LimitNum,startNum], function (error, rows) {
						if (error) throw error;

							if (userinfo.length>0) {
		                		userinfo=userinfo[0];
		                	}
							res.json({'status':true,"message":"Success",'data':{totalRecords,userinfo:userinfo,order:rows}});
						});
					});
				}	
			});	
	    }catch (error) {
	        res.json({'status':false,"message":error.message});  
	    }
	}else{
		res.json({'status':false,"message":"No record found"});
	}
}
/*******************/

/********  Rating feedback suggesstion  ***********/
export const get_ratingList = async(req,res)=>{
      try { 
        	const loads = "select * from wc_rating order by id desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_feedbackQesList = async(req,res)=>{
      try { 
        	const loads = "select * from wc_rating left join wc_rating_feeback on wc_rating_feeback.rating_id=wc_rating.id where wc_rating_feeback.isDelete=0 order by wc_rating_feeback.create_date desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_feedbackQes = async(req,res)=>{
	const reqData = req.body;
	//`rating_id`, `feedback`
    try { 
    	const qrySelect = "select id from wc_rating_feeback where `rating_id`=? and `feedback`=? and status=1 and id!=?";
		dbConnection.query(qrySelect,[reqData.rating_id, reqData.feedback, reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) { ///`category_id`, `type`, `loads`, `min_load_per_day`, `price`,
			    var updateContnetQry = "update wc_rating_feeback set `rating_id`=?, `feedback`=? where id = ? ";
			    dbConnection.query(updateContnetQry,[reqData.rating_id, reqData.feedback,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Feedback Suggestion has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same Suggestion already exist"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_admin_email = async(req,res)=>{

        try { 
            const userData = res.user;
            const {email} = req.body;

			const checkIfEmailExist = "select count(id) as total from users where email = '"+email+"'";
			dbConnection.query(checkIfEmailExist,async function (error, data) {
				if(data[0].total == 0){
					var sql = "update users set email = '"+email+"' where id = '"+userData[0].id+"'";
					dbConnection.query(sql, function (err, results) {
					res.json({'status':true,"message":"Email updated successfully"});
					}); 
				}else{
					res.json({'status':false,"message":'Email is already registered'});  
				}
			})
        }catch (error) {
            res.json({'status':false,"message":error.message});  
        }
}
export const create_feedbackQes = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_rating_feeback where `rating_id`=? and `feedback`=? and status=1";
		dbConnection.query(qrySelect,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var addContnetQry = "insert wc_rating_feeback set `rating_id`=?, `feedback`=? ";
			    dbConnection.query(addContnetQry,[reqData.rating_id, reqData.feedback], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Feedback Suggestion has been saved successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same Suggestion already exist"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const delete_feedbackQes = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_rating_feeback where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Feedback Suggestion has been activated successfully"
				if (reqData.isDelete==1) {
					msg= "Feedback Suggestion has been deleted successfully"
				}
			    var updateContnetQry = "update wc_rating_feeback set isDelete=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.isDelete,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_feedbackQes_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_rating_feeback where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Feedback Suggestion has been deactivated successfully"
				if (reqData.status==1) {
					msg= "Feedback Suggestion has been activated successfully"
				}
			    var updateContnetQry = "update wc_rating_feeback set status=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.status,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":msg,'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_extra_chagres_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from settings where id=1";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Extra Charges has been updated successfully"
				if (reqData.type=='dry') {
					msg= "Minimum order amount has been updated successfully"
				}
				if (reqData.type=='dry') {
					var updateContnetQry = "update settings set dry_clean_charges=? where id=1 ";
				    dbConnection.query(updateContnetQry,[reqData.extra_chages,1], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":msg,'data':data});
					});
				}else{
					var updateContnetQry = "update settings set extra_chages=? where id=1 ";
				    dbConnection.query(updateContnetQry,[reqData.extra_chages,1], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":msg,'data':data});
					});	
				}
			    
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
//customer login API
export const admin_login = async(req,res)=>{
	try { 
		const {email,password,type} = req.body;
		if(email && password && type){
			const checkIfEmailExist = "select * from users where email = '"+email+"' and isAdmin=1";
			dbConnection.query(checkIfEmailExist, function (error, data) {
				if(data.length > 0){
					if(data[0].status == 1){
					bcrypt.compare(password, data[0].password, function(error, result) {
						if(result == true){
							data.forEach(element =>
							{
								const {id,name,email,mobile,comment,role,status,category_id,isAdmin,role_id,zip_code} = element;
								
								const initi = {
									"id":id,"name":name,"email":email,"mobile":mobile,"comment":comment,"role":role,"status":status,'category_id':category_id,"role_id":role_id,"isAdmin":isAdmin,"zip_code":zip_code,'token': generateToken({ userId: id, type: type }),
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

/****** end feedback section*******/
export default {
	get_page_content,
	get_faq_content,
	update_page_content,
	create_faq,
	update_faq,
	delete_faq,
	get_dashboard_content,
	get_packagesList,
	update_packages,
	create_packages,
	delete_packages,
	get_package_details,
	get_all_userList,
	get_userList,
	get_user_history,
	update_package_status,
	add_drycleaning_service,
	update_drycleaning_service,
	update_service_status,
	delete_service,
	get_drycleaning_itemlist,
	update_faq_index,
	get_all_order,
	get_order_detail,
	get_all_driver,
	get_driver_detail,
	get_ratingList,
	get_feedbackQesList,
	update_feedbackQes,
	create_feedbackQes,
	delete_feedbackQes,
	update_feedbackQes_status,
	update_extra_chagres_status,
	admin_login,
	get_cities,
	get_states,
	getGraphData,
	update_admin_email,
	get_countries,
	sendNotification,
	get_county_cities

}