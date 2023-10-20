import dbConnection from'../../config/db.js';
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
 export const get_drycleaning_itemlist = async(req,res)=>{
      try { 
        	const loads = "select * from dry_clean_services where isDelete=0 order by updated_at desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const add_drycleaning_service = async(req,res)=>{
	try { 
		var reqData=req.body;
		console.log('reqData body',reqData,'files',req);
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
							var addContnetQry = "insert dry_clean_services set `title`=?, `price`=?, `image`=?";
						    dbConnection.query(addContnetQry,[reqData.title, reqData.price, product_image], function (error, data) {
							if (error) throw error;
								res.json({'status':true,"message":"Service has been saved successfully",'data':data});
							});	              

			          /*  });
			       	});
					*/	
		    	}else{
					
				   	var addContnetQry = "insert dry_clean_services set `title`=?, `price`=?";
				    dbConnection.query(addContnetQry,[reqData.title, reqData.price], function (error, data) {
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
		console.log('files',req.file);
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
							var addContnetQry = "update dry_clean_services set `title`=?, `price`=?, `image`=? where id=?";
						    dbConnection.query(addContnetQry,[reqData.title, reqData.price, product_image, reqData.id], function (error, data) {
							if (error) throw error;
								res.json({'status':true,"message":"Service has been saved successfully",'data':data});
							});	              

			            /*});
			       	});*/

		    	}else{
					
				   	var addContnetQry = "update dry_clean_services set `title`=?, `price`=? where id=?";
				    dbConnection.query(addContnetQry,[reqData.title, reqData.price,reqData.id], function (error, data) {
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
    	const loads = "SELECT COUNT(id) total_order,sum(total_loads) total_load  FROM `bookings` WHERE status=1 and bookings.order_type!=3";
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

/*********  User Listing*************/

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
    	const loads = "select users.*, ("+usrLoads+") total_load from users";
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
    	
    	const qry = "SELECT * FROM `bookings` WHERE user_id=?";
		dbConnection.query(qry,[reqData.user_id], function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
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
				res.json({'status':true,"message":"Success",'data':data});
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
			    var updateContnetQry = "update admin_packages set `category_id`=?, `type`=?, `loads`=?, `min_load_per_day`=?, `price`=? where id = ? ";
			    dbConnection.query(updateContnetQry,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price,reqData.id], function (error, data) {
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
			    var addContnetQry = "insert admin_packages set `category_id`=?, `type`=?, `loads`=?, `min_load_per_day`=?, `price`=? ";
			    dbConnection.query(addContnetQry,[reqData.category_id, reqData.type, reqData.loads, reqData.min_load_per_day, reqData.price], function (error, data) {
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
        	const loads = "select * from wc_faq";
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
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_faq where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
			    var updateContnetQry = "delete from wc_faq where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"FAQ has been deleted successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Record not found"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
/********* End FAQ API ************/

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
	get_userList,
	update_package_status,
	add_drycleaning_service,
	update_drycleaning_service,
	update_service_status,
	delete_service,
	get_drycleaning_itemlist
}