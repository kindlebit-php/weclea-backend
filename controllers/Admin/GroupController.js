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
    	const loads = "select * from wc_emp_group where status=0 order by id desc";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const get_county_list = async(req,res)=>{
	var reqData= req.params
    try { 
    	const loads = "select wc_county.*, wc_states.name state_name,wc_cities.name city_name from wc_county LEFT JOIN wc_cities on wc_cities.id=wc_county.city_id LEFT JOIN wc_states on wc_states.id=wc_county.state_id where wc_county.status=1 and wc_county.isDeleted=0 and wc_county.state_id=? order by wc_county.name asc;";
		dbConnection.query(loads,[reqData.state_id], function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const get_all_county_list = async(req,res)=>{
    try { 
    	const loads = "select wc_county.*,wc_states.id state_id, wc_states.name state_name,wc_cities.name city_name from wc_county LEFT JOIN wc_cities on wc_cities.id=wc_county.city_id LEFT JOIN wc_states on wc_states.id=wc_cities.state_id where  wc_county.isDeleted=0 order by wc_county.name asc";
		dbConnection.query(loads, function (error, data) {
		if (error) throw error;
			res.json({'status':true,"message":"Success",'data':data});
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const get_group_user_list = async(req,res)=>{
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
export const update_county = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_county where `name`=? and city_id=? and isDeleted=1  and id!=?";
		dbConnection.query(qrySelect,[reqData.name, reqData.city_id, reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) { 
					var addContnetQry = "update wc_county set `name`=?, city_id=?, state_id=? ,`status`=? where id=? ";
				    dbConnection.query(addContnetQry,[reqData.name, reqData.city_id,reqData.state_id , 1,reqData.id], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"County has been updated successfully",'data':data});
					});
			}else{
				res.json({'status':false,"message":"Same county already exist"});
			}
		})
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const create_county = async(req,res)=>{
	const reqData = req.body;
	console.log("create_county", reqData,req.files)
	//wc_emp_group //`manage_name`, `profile_pic`, `location`, `country`, `group_name`, `zip_code`, 
    try { 
    	const city_ids = reqData.city_id.split(',');
    	console.log("create_county=",city_ids);
    	 for (var i = 0; i < city_ids.length; i++) {
    		var city= city_ids[i];
    		console.log("create_county",city);
		  	const qrySelect = "select id from wc_county where `name`=? and `city_id`=? and isDeleted=0";
			var k=0;
			dbConnection.query(qrySelect,[reqData.name,city], function (error, data) {
			if (error) throw error;
				var x=0
				if (data.length<=0) {
	              	var addContnetQry = "insert wc_county set `name`=?, `city_id`=?,state_id=?,`status`=?";
				    dbConnection.query(addContnetQry,[reqData.name, reqData.city_id,reqData.state_id, 1], function (error, data) {
						if (error) throw error;
						console.log("create_county==",k,x);
						if (x>=k.length-1) {
							res.json({'status':true,"message":"County has been added successfully",'data':data});
						}
						x++;
					});
				    k++;
				}else{
					res.json({'status':false,"message":"Same county already exist"});
				}
				
			});
		};
    	
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}



export const update_group = async(req,res)=>{
	const reqData = req.body;
	//`rating_id`, `feedback`
    try { 
    	const qrySelect = "select id from wc_emp_group where `group_name`=? and status=0 and county=? and id!=?";
		dbConnection.query(qrySelect,[reqData.group_name, reqData.county, reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length<=0) { 
			  
			    reqData.profile_pic='';
			    if (req.files) {
			    	req.files.map(function(file) {
			            console.log("File uplaod ===>", {url: file.location, name: file.key, type: file.mimetype, size: file.size});
			       		reqData.profile_pic=file.location;
		              	var addContnetQry = "update wc_emp_group set `manage_name`=?, `profile_pic`=?,location=?,country=?,group_name=?, zip_code=?,`state`=?, `county`=?, city=? where id=?";
					    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.profile_pic, reqData.location, reqData.country, reqData.group_name, reqData.zip_code,reqData.state,reqData.county,reqData.city ,reqData.id], function (error, data) {
						if (error) throw error;
							res.json({'status':true,"message":"Group has been updated successfully",'data':data});
						});
			        });

				}else{
					var addContnetQry = "update wc_emp_group set `manage_name`=?, location=?,country=?,group_name=?, zip_code=? ,`state`=?, `county`=?, city=? where id=? ";
				    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.location, reqData.country, reqData.group_name, reqData.zip_code, reqData.state,reqData.county,reqData.city ,reqData.id], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"Group has been updated successfully",'data':data});
					});
				}


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
	console.log("create_group", reqData,req.files)
	//wc_emp_group //`manage_name`, `profile_pic`, `location`, `country`, `group_name`, `zip_code`, 
    try { 
    	const qrySelect = "select id from wc_emp_group where `group_name`=? and status=0 and county=?";
		dbConnection.query(qrySelect,[reqData.group_name, reqData.county], function (error, data) {
		if (error) throw error;
			if (data.length<=0) {

				reqData.profile_pic='';
			    if (req.files) {
			    	req.files.map(function(file) {
			            console.log("File uplaod ===>", {url: file.location, name: file.key, type: file.mimetype, size: file.size});
			       		reqData.profile_pic=file.location;
		              	var addContnetQry = "insert wc_emp_group set `manage_name`=?, `profile_pic`=?,location=?,country=?,group_name=?, zip_code=?,`state`=?, `county`=?, city=? ";
					    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.profile_pic, reqData.location, reqData.country, reqData.group_name, reqData.zip_code,reqData.state,reqData.county,reqData.city], function (error, data) {
						if (error) throw error;
							res.json({'status':true,"message":"Group has been created successfully",'data':data});
						});
			        });

				}else{
					var addContnetQry = "insert wc_emp_group set `manage_name`=?, location=?,country=?,group_name=?, zip_code=?,city=? ";
				    dbConnection.query(addContnetQry,[reqData.manage_name, reqData.location, reqData.country, reqData.group_name, reqData.zip_code,reqData.city], function (error, data) {
					if (error) throw error;
						res.json({'status':true,"message":"Group has been created successfully",'data':data});
					});
				}

			    
			}else{
				res.json({'status':false,"message":"Same County Group already exist"});
			}
		});
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const delete_group = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_emp_group where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Group has been activated successfully"
				if (reqData.isDelete==1) {
					msg= "Group has been deleted successfully"
				}
			    var updateContnetQry = "update wc_emp_group set status=? where id=? ";
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

export const get_grouped_emp_list = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from users where group_id=? or zip_code=?";
		dbConnection.query(qrySelect,[reqData.group_id,reqData.zip_code], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "Email template has been deactivated successfully"
				if (reqData.status==1) {
					msg= "Email template has been activated successfully"
				}
			    var qryStr = "select * from users where (group_id=? or zip_code=?) and (role_id>0 or role!=1)";
			    dbConnection.query(qryStr,[reqData.group_id,reqData.zip_code], function (error, data) {
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
export const update_county_status = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_county where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "County has been deactivated successfully"
				if (reqData.status==1) {
					msg= "County has been activated successfully"
				}
			    var updateContnetQry = "update wc_county set status=? where id=? ";
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

export const delete_County = async(req,res)=>{
	const reqData = req.body;
    try { 
    	const qrySelect = "select id from wc_county where id=?";
		dbConnection.query(qrySelect,[reqData.id], function (error, data) {
		if (error) throw error;
			if (data.length>0) {
				var msg= "County has been activated successfully"
				if (reqData.isDeleted==1) {
					msg= "County has been deleted successfully"
				}
			    var updateContnetQry = "update wc_county set isDeleted=? where id=? ";
			    dbConnection.query(updateContnetQry,[reqData.isDeleted,reqData.id], function (error, data) {
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
	create_group,
	update_group,
	delete_group,
	get_grouped_emp_list,
	get_county_list,
	get_all_county_list,
	create_county,
	update_county,
	update_county_status,
	delete_County
}