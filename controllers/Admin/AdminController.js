import dbConnection from'../../config/db.js';

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
			})

		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

/*********  User Listing*************/

export const get_userList = async(req,res)=>{
	var reqData= req.params;
    try { 
    	var usrLoads = "select sum(commercial+residential+yeshiba) as total_loads from customer_loads_availabilty where user_id =users.id";
    	if(reqData.category_id == 1){
            usrLoads = "select commercial as total_loads from customer_loads_availabilty where user_id = users.id";
        }else if(reqData.category_id == 2){
            usrLoads = "select residential as total_loads from customer_loads_availabilty where user_id = users.id";
        }else if(reqData.category_id == 3){
            usrLoads = "select yeshiba as total_loads from customer_loads_availabilty where user_id = users.id";
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

/*********** User Listing End ************/


/******** Package Listing************/
export const get_packagesList = async(req,res)=>{
      try { 
        	const loads = "select * from admin_packages";
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
	const reqData = req.params;
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
	const reqData = req.body;
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
	get_userList
}