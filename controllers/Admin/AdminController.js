import dbConnection from'../../config/db.js';

//get loads API
//
//SELECT COUNT(id),sum(total_loads) FROM `bookings` WHERE status=1 and bookings.order_type!=3;
export const get_dashboard_content = async(req,res)=>{
    try { 
    	const loads = "SELECT COUNT(id),sum(total_loads),  FROM `bookings` WHERE status=1 and bookings.order_type!=3";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			const loads = "SELECT count(id) total_users, users.role FROM `users` WHERE status=1 GROUP by role";
			dbConnection.query(loads, function (error, users) {
			if (error) throw error;
				data[0]['users']=users
				res.json({'status':true,"message":"Success",'data':data);
			})
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const update_page_content = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select `user_id`, `section`, content from wc_page_content where section=?";
		dbConnection.query(qrySelect,[reqData.section], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
			    var updateContnetQry = "update wc_page_content set content = '"+reqData.content+"' where section = '"+reqData.section+"' ";
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
    try { 
    	const qrySelect = "select `user_id`, `section`, content from wc_faq where title=? and id!=?";
		dbConnection.query(qrySelect,[reqData.section,reqData.faq_id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var updateContnetQry = "update wc_page_content set faq_type='"+reqData.faq_type+"', title = '"+reqData.title+"',content = '"+reqData.content+"' where id = "+reqData.faq_id+" ";
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
    try { 
    	const qrySelect = "select `user_id`, `section`, content from wc_faq where title=?";
		dbConnection.query(qrySelect,[reqData.section], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var updateContnetQry = "insert wc_faq set faq_type='"+reqData.faq_type+"',title = '"+reqData.title+"',content = '"+reqData.content+"'";
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
    	const qrySelect = "select `user_id`, `section`, content from wc_faq where id=?";
		dbConnection.query(qrySelect,[reqData.section], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
			    var updateContnetQry = "delete from wc_faq id=? ";
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
export default {
	get_page_content,
	get_faq_content,
	update_page_content,
	create_faq,
	update_faq,
	delete_faq,
	get_dashboard_content
}