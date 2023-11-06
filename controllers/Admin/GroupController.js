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
export const get_group_list = async(req,res)=>{
      try { 
        	const loads = "select * from wc_emp_group order by id desc";
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
    	const loads = "select * from wc_email_template  where wc_email_template.status=0 order by wc_rating_feeback.create_date desc";
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
export const create_group = async(req,res)=>{
	const reqData = req.body;
	//wc_emp_group //`manage_name`, `profile_pic`, `location`, `country`, `group_name`, `zip_code`, 
    try { 
    	const qrySelect = "select id from wc_emp_group where `group_name`=? and status=0";
		dbConnection.query(qrySelect,[reqData.group_name], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {

				reqData.profile_pic='';
			    if (req.files) {
			        let getFile = req.files.profile_pic;//mimetype
			        var ext=path.extname(getFile['name']);
			        var filename= Date.now()+ext;
			        var fileData =getFile['data']; 
			        s3bucket.createBucket(function () {
			             var params = {
			              Bucket: BUCKET_NAME+"/weclea-bucket/profile_pic/",
			              Key: filename,
			              ACL: 'public-read',
			              Body:fileData,

			             };
			            s3bucket.upload(params, function (err, data) {
			                if (err) {
			                 console.log('error in callback');
			                 console.log(err);
			                }
			              	reqData.profile_pic=data.Location;
			              	var addContnetQry = "insert wc_emp_group set `manage_name`=?, `profile_pic`=?,location=?,country=?,group_name=?, zip_code=? ";
						    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.profile_pic, reqData.location, reqData.country, reqData.group_name, reqData.zip_code], function (error, data) {
							if (error) throw error;
								res.json({'status':true,"message":"Group has been created successfully",'data':data});
							});
			            });
			       });

				}else{
					var addContnetQry = "insert wc_emp_group set `manage_name`=?, `location=?,country=?,group_name=?, zip_code=? ";
				    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.location, reqData.country, reqData.group_name, reqData.zip_code], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"Group has been created successfully",'data':data});
					});
				}

			    
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
	get_group_list,
	create_group
	


}