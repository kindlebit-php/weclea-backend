import dbConnection from'../config/db.js';
import transport from "./mail.js";
export const temEmail = (user_id,temp_id) => {
		const userSQL = "select name, email from users where id="+user_id+"";
		dbConnection.query(userSQL, function (error, userresult) {
		const template = "select wc_email_template.* from wc_email_template where id="+temp_id+"";
		dbConnection.query(template, function (error, result) {
			if (error) throw error;
			if (result.length>0) {	    
				var message= result[0].body;
				message =message.replace('[username]',userresult[0].name );
		        //message =message.replace('[url]',argument.title );
		        //message =message.replace( '[subject]',argument.subject);
		        //message =message.replace('[message]',argument.message );

				const mailOptions = 
		     	{
			        from: 'support@weclea.com',
			        to: userresult[0].email,
			        subject: result[0].subject,
			        html: message,
		        };
		        transport.sendMail(mailOptions, function (error, info) 
		        {
		        	console.log(error,info);
		        })
    		}
		})
		})
}



  