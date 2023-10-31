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


/********  Rating feedback suggesstion  ***********/
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
      try { 
        	const loads = "select * from wc_email_template  where wc_rating_feeback.isDelete=0 order by wc_rating_feeback.create_date desc";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
			})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const update_emailTemplate = async(req,res)=>{
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
export const create_emailTemplate = async(req,res)=>{
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

export const delete_emailTemplate = async(req,res)=>{
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

export const update_emailTemplate_status = async(req,res)=>{
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

/****** end feedback section*******/
export default {
	get_emailTemplate,
	get_emailTemplate_detail,
	update_emailTemplate,
	create_emailTemplate,
	delete_emailTemplate,
	update_emailTemplate_status


}