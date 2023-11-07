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


/********  Permission template suggesstion  ***********/
export const updateAssignRole = async(req,res)=>{
	var arg= req.body;
	if (!arg.role_id || arg.role_id=='' || !arg.user_id  || arg.user_id=='') {
        return res.json({
            "success":false,
            "body":"",
            "message":"All field required"
        });
    }	
  	try {
  	    var updateData = {}
	    updateData['role_id'] = arg.role_id;
	    updateData['isAdmin'] = '1'
	    dbConnection.query("SELECT users.id FROM  `users` where users.id=?", [arg.user_id], function (error, rows) {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log('error', error);
	        res.json({ "success": false, "message": error.code });
	      } else {
	        dbConnection.query("UPDATE `users` SET ? where id=?", [updateData, arg.user_id], function (error, row) {
	          if (!!error) {
	            dbFunc.connectionRelease;
	            console.log('error', error);
	            res.json({ "success": false, "message": error.code });
	          } else {
	            res.json({ "success": true, "message": "Permissions updated successfully", body: row });
	          }
	        });
	      }
	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const getAssignedRoleUser = async(req,res)=>{
	var arg= req.body;	
  	try {      
  		dbConnection.query("SELECT users.id, users.name, users.email,users.status, users.role_id ,wc_role.role as role_name, users.profile_image,users.mobile,users.isAdmin FROM  `users` LEFT join wc_role on wc_role.id=users.role_id where users.role_id>0", function (error, row) {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log('error', error);
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "Permissions updated successfully",  body: row });
	      }
	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const assignRole = async(req,res)=>{
	var arg= req.body;	
	if (!arg.role_id || arg.role_id=='' || !arg.user_id  || arg.user_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }
  	try {  
  	    var updateData = {}
	    updateData['role_id'] = arg.role_id;
	    updateData['isAdmin'] = '1'
	    dbConnection.query("SELECT users.role_id FROM  `users` where users.id=?", [arg.user_id], function (error, rows) {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log('error', error);
	        res.json({ "success": false, "message": error.code });
	      } else {
	        var msg = "Role&Permissions granted successfully";
	        if (rows.length > 0 && rows[0].role_id > 0) {
	          msg = "Role&Permissions updated successfully";
	        }
	        dbConnection.query("UPDATE `users` SET ? where id=?", [updateData, arg.user_id], function (error, row) {
	          if (!!error) {
	            dbFunc.connectionRelease;
	            console.log('error', error);
	            res.json({ "success": false, "message": error.code });
	          } else {
	            res.json({ "success": true, "message": msg, body: row });
	          }
	        });
	      }
	    })
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const getRoleAndPermissionById = async(req,res)=>{
	var arg= req.params;
   	if (!arg.role_id || arg.role_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
   	}	
  	try {    
  	    console.log('getRoleAndPermissionById', arg);
	    var role_id = arg.role_id;
	    dbConnection.query("SELECT  wc_permissions.perm_mod,wc_permissions.perm_desc,wc_role.role ,wc_roles_permissions.*,wc_roles_permissions.id roles_permissions_id,wc_permissions.id permission_id FROM wc_permissions LEFT JOIN wc_roles_permissions on wc_roles_permissions.permission=wc_permissions.id and wc_roles_permissions.role_id=? LEFT JOIN wc_role on wc_role.id=wc_roles_permissions.role_id GROUP by wc_permissions.id", [role_id], (error, roleAndPermission, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      }
	      res.json({ "success": true, "message": "success", body: roleAndPermission });
	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const getRoleAndPermission = async(req,res)=>{
	var arg= req.params;	
  	try {        
  		console.log('getRoleAndPermission', arg);
	    dbConnection.query("SELECT wc_role.* FROM wc_role  where status=1 order by id desc", (error, rows, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      } else {
	        for (var i = 0; i < rows.length; i++) {
	          var role_id = rows[i].id;
	          var k = 0;
	          dbConnection.query("SELECT wc_permissions.perm_mod, wc_permissions.perm_desc,wc_role.role ,wc_roles_permissions.*,wc_roles_permissions.id roles_permissions_id,wc_permissions.id permission_id FROM wc_permissions LEFT JOIN wc_roles_permissions on wc_roles_permissions.permission=wc_permissions.id and wc_roles_permissions.role_id=? LEFT JOIN wc_role on wc_role.id=wc_roles_permissions.role_id GROUP by wc_permissions.id", [role_id], (error, roleAndPermission, fields) => {
	            if (!!error) {
	              dbFunc.connectionRelease;
	              console.log(error)
	              res.json({ "success": false, "message": error.code });
	            }
	            rows[k].permission = roleAndPermission;
	            if (k == rows.length - 1) {
	              res.json({ "success": true, "message": "success", body: rows });
	            }
	            k++;
	          });
	        }
	      }
	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const addRoleAndPermission = async(req,res)=>{
	var arg= req.body;
	if (!arg.role_id || arg.role_id=='' || !arg.permission_id  || arg.permission_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }	
  	try {    
  		var updateData = {}
	    updateData['role_id'] = arg.role_id
	    updateData['permission'] = arg.permission_id
	    if (arg.id && arg.status == false) {
	      dbConnectionquery("DELETE FROM `wc_roles_permissions` where id=?", [arg.id], function (error, row) {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log('error', error);
	          res.json({ "success": false, "message": error.code });
	        } else {
	          res.json({ "success": true, "message": "Permissions updated successfully", body: row });
	        }
	      });
	    } else {
	      dbConnectionquery("INSERT wc_roles_permissions SET ?", [updateData], function (error, row) {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log('error', error);
	          res.json({ "success": false, "message": error.code });
	        } else {
	          res.json({ "success": true, "message": "Permissions added successfully", body: row });
	        }
	      });
	    }
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}


export const delPermissions = async(req,res)=>{
	var arg= req.params;
   	if (!arg.permission_id || arg.permission_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
   	}	
  	try {
  	    dbConnectionquery("UPDATE `wc_permissions` SET status=0 where id=?", [arg.permission_id], function (error, row) {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log('error', error);
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "Permissions deleted successfully", body: row });
	      }
	    });
	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
export const getPermissionsDetail = async(req,res)=>{
	var arg= req.params;
    if (!arg.permission_id || arg.permission_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }	
  	try {
  	    //console.log('getTestimonialDetail',arg);
	    dbConnectionquery("SELECT wc_permissions.*  FROM wc_permissions  where status=1 and id=? ", [arg.permission_id], (error, rows, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "success", body: rows });
	      }

	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}
export const getPermissions = async(req,res)=>{
	var arg= req.params;	
  	try {    
  		console.log('getPermissions', arg);
	    dbConnectionquery("SELECT wc_permissions.* FROM wc_permissions  where status=1 order by id desc", (error, rows, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "success", body: rows });
	      }
	    });
    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

export const addPermission = async(req,res)=>{
	var arg= req.body;	
	if ( !arg.perm_desc || arg.perm_desc=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }
  	try {
  	    var updateData = {}
	    updateData['perm_mod'] = arg.perm_mod
	    updateData['perm_desc'] = arg.perm_desc
	    if (arg.role_id) {
	      dbConnectionquery("UPDATE `wc_permissions` SET ? where id=?", [updateData, arg.role_id], function (error, row) {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log('error', error);
	          res.json({ "success": false, "message": error.code });
	        } else {
	          res.json({ "success": true, "message": "Permissions updated successfully", body: row });
	        }
	      });
	    } else {
	      dbConnectionquery("INSERT wc_role SET ?", [updateData], function (error, row) {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log('error', error);
	          res.json({ "success": false, "message": error.code });
	        } else {
	          res.json({ "success": true, "message": "Permissions added successfully", body: row });
	        }
	      });
	    }

    }catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}

 export const delRole = async(req,res)=>{
	var arg= req.params;
    if (!arg.role_id || arg.role_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }	
  	try {
	    dbConnectionquery("DELETE from `wc_role` where id=?", [arg.role_id], function (error, row) {
	      var updateData = {}
	      updateData['role_id'] = '0';
	      updateData['isAdmin'] = '0'
	      dbConnectionquery("UPDATE `wc_users` SET ? where role_id=?", [updateData, arg.role_id], function (error, row) {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log('error', error);
	          res.json({ "success": false, "message": error.code });
	        }
	      });
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log('error', error);
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "Role deleted successfully", body: row });
	      }
	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}
export const getRoleDetail = async(req,res)=>{
	var arg= req.params;
    if (!arg.role_id || arg.role_id=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
    }	
  	try { 
	    //console.log('getTestimonialDetail',arg);
	    dbConnectionquery("SELECT wc_role.*  FROM wc_role  where status=1 and id=? ", [arg.role_id], (error, rows, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "success", body: rows });
	      }

	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }
}
  export const getRole = async(req,res)=>{
	var arg= req.body;	
  	try { 
	    console.log('getTestimonial', arg);
	    dbConnectionquery("SELECT wc_role.* FROM wc_role  where status=1 order by id desc", (error, rows, fields) => {
	      if (!!error) {
	        dbFunc.connectionRelease;
	        console.log(error)
	        res.json({ "success": false, "message": error.code });
	      } else {
	        res.json({ "success": true, "message": "success", body: rows });
	      }

	    });
  	}catch (error) {
        res.json({'status':false,"message":error.message});  
    }

}

export const addRole = async(req,res)=>{
	var arg= req.body;	
	if (!arg.role || arg.role=='') {
      return res.json({
         "success":false,
         "body":"",
         "message":"All field required"
       });
   }
  	try { 
	    var updateData = {}
	    updateData['role'] = arg.role
	    if (arg.role_id && arg.role_id > 0) {
	      dbConnectionquery("SELECT wc_role.* FROM wc_role  where role=? and id!=? order by id desc", [arg.role, arg.role_id], (error, rows, fields) => {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log(error)
	          res.json({ "success": false, "message": error.code });
	        } else {
	          if (rows.length > 0) {
	            res.json({ "success": false, "message": arg.role + ": Role already exists. Please add a unique role." });
	          } else {
	            dbConnection.query("UPDATE `wc_role` SET ? where id=?", [updateData, arg.role_id], function (error, row) {
	              if (!!error) {
	                dbFunc.connectionRelease;
	                console.log('error', error);
	                res.json({ "success": false, "message": error.code });
	              } else {
	                res.json({ "success": true, "message": "Role updated successfully", body: row });
	              }
	            });
	          }
	        }
	      })
	    } else {
	      dbConnection.query("SELECT wc_role.* FROM wc_role  where role=? order by id desc", [arg.role], (error, rows, fields) => {
	        if (!!error) {
	          dbFunc.connectionRelease;
	          console.log(error)
	          res.json({ "success": false, "message": error.code });
	        } else {
	          if (rows.length > 0) {
	            res.json({ "success": false, "message": arg.role + ": Role already exists. Please add a unique role." });
	          } else {
	            dbConnection.query("INSERT wc_role SET ?", [updateData], function (error, row) {
	              if (!!error) {
	                dbFunc.connectionRelease;
	                console.log('error', error);
	                res.json({ "success": false, "message": error.code });
	              } else {
	                res.json({ "success": true, "message": "Role added successfully", body: row });
	              }
	            });
	          }
	        }
	      });
	    }
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
	addRole,
	getRole,
	getRoleDetail,
	delRole,
	addPermission,
	getPermissionsDetail,
	getPermissions,
	delPermissions,
	getRoleAndPermission,
	getRoleAndPermissionById,
	addRoleAndPermission,
	assignRole,
	getAssignedRoleUser,
	updateAssignRole
	


}