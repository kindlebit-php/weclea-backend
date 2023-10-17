import dbConnection from'../../config/db.js';

//get loads API
export const get_page_content = async(req,res)=>{
      try { 
        	const loads = "select * from wc_page_content";
			dbConnection.query(loads, function (error, data) {
			if (error) throw error;
				res.json({'status':true,"message":"Success",'data':data});
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
export default {
	get_page_content,
	get_faq_content
}