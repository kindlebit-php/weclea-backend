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


/********  Email template suggesstion  ***********/
export const get_emailTemplate = async(req,res)=>{
      try { 
        	const loads = "select * from wc_email_template order by id desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_emailTemplate_detail = async(req,res)=>{
	const reqData = req.params;
	if(reqData.id){
      try { 
        	const loads = "select * from wc_email_template  where  id=? ";
			dbConnection.query(loads,[reqData.id], function (error, data) {
			if (error) throw error;
				if (data.length>0) {
					res.json({'status':true,"message":"Success",'data':data[0]});
				}else{
					res.json({'status':false,"message":"No record found"});  		
				}
				
			})
	    }catch (error) {
	        res.json({'status':false,"message":error.message});  
	    }
	}else{
		res.json({'status':false,"message":"All field required"});  

	}
}
export const update_emailTemplate = async(req,res)=>{
	const reqData = req.body;
	//`rating_id`, `feedback`
    try { 
    	const qrySelect = "select id from wc_email_template where `subject`=? and status=0 and id!=?";
		dbConnection.query(qrySelect,[reqData.rating_id, reqData.feedback, reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) { ///`category_id`, `type`, `loads`, `min_load_per_day`, `price`,
			    var updateContnetQry = "update wc_email_template set `subject`=?, `body`=? where id = ? ";
			    dbConnection.query(updateContnetQry,[reqData.subject, reqData.body,reqData.id], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Email template has been updated successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same Email subject already exist"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const create_emailTemplate = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_email_template where `subject`=? and `body`=? and status=0";
		dbConnection.query(qrySelect,[reqData.subject, reqData.body], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {
			    var addContnetQry = "insert wc_email_template set `subject`=?, `body`=? ";
			    dbConnection.query(addContnetQry,[reqData.subject, reqData.body], function (error, data) {
				if (error) throw error;
					res.json({'status':true,"message":"Email template has been saved successfully",'data':data});
				});
			}else{
				res.json({'status':false,"message":"Same email template already exist"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const delete_emailTemplate = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_email_template where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Feedback Suggestion has been activated successfully"
				if (reqData.isDelete==1) {
					msg= "Feedback Suggestion has been deleted successfully"
				}
			    var updateContnetQry = "update wc_email_template set isDelete=? where id=? ";
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

export const update_emailTemplate_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_email_template where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Email template has been deactivated successfully"
				if (reqData.status==1) {
					msg= "Email template has been activated successfully"
				}
			    var updateContnetQry = "update wc_email_template set status=? where id=? ";
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

/****** end Eamil section*******/
export default {
	get_emailTemplate,
	get_emailTemplate_detail,
	update_emailTemplate,
	create_emailTemplate,
	delete_emailTemplate,
	update_emailTemplate_status


}