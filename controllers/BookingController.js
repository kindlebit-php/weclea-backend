import dbConnection from'../config/db.js';
import dateFormat from 'date-and-time';
//customer booking API

export const customer_booking = async(req,res)=>{
     try { 
     	const userData = res.user;
        const {	delievery_day,date,total_loads,order_type,frequency} = req.body;
        if(	delievery_day && date && total_loads && order_type){
        if(order_type == '1'){
            var sql = "select available_loads from users where id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (err, result) {
                if(total_loads > result[0].available_loads){
                    res.json({'status':false,"messagae":'Insufficient loads,Please buy loads'});  
                }else{
                    let dateObject = new Date();
                    let hours = dateObject.getHours();
                    let minutes = dateObject.getMinutes();
                    const current_time = hours + ":" + minutes;
                    var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+date+"', '"+current_time+"','"+total_loads+"','"+order_type+"')";
                    dbConnection.query(sql, function (err, result) {
                        if (err) throw err;
                        res.json({'status':true,"messagae":"Booking added successfully!"});
                    }); 
                }
            });
        }else if(frequency != ''){
            var currentDate = new Date(date);
            const currentFinalDate = dateFormat.format(currentDate,'YYYY-MM-DD');
            const lastdate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
            const endFinalDate = dateFormat.format(lastdate,'YYYY-MM-DD');

            let allDates = getDatesBetween(new Date(currentFinalDate), new Date(endFinalDate),frequency);
            // console.log(allDates);
            var sql = "select available_loads from users where id = '"+userData[0].id+"'";
            dbConnection.query(sql, function (err, result) {
                if(total_loads > result[0].available_loads){
                    res.json({'status':false,"messagae":'Insufficient loads,Please buy loads'});  
                }else{
                    var resData = [];
                    allDates.forEach(element =>
                    {
                        var frequencyDate = new Date(element);
                        const frequencyDBDate = dateFormat.format(frequencyDate,'YYYY-MM-DD');
                        let dateObject = new Date();
                        let hours = dateObject.getHours();
                        let minutes = dateObject.getMinutes();
                        const current_time = hours + ":" + minutes;
                        var sql = "INSERT INTO bookings (user_id,delievery_day,date,time,total_loads,order_type,frequency) VALUES ('"+userData[0].id+"','"+delievery_day+"', '"+frequencyDBDate+"', '"+current_time+"','"+total_loads+"','"+order_type+"','"+frequency+"')";
                        dbConnection.query(sql, function (err, result) {
                        if (err) throw err;
                        });
                    }) 
                        res.json({'status':true,"messagae":"Booking added successfully!"});

                }
            });
        }
    	}else{
            res.json({'status':false,"messagae":"All fields are required"});
    	}
    }catch (error) {
        res.json({'status':false,"messagae":error});  
    }
}
function getDatesBetween(startDate, endDate,frequency) {
  const currentDate = new Date(startDate.getTime());
  const dates = [];
  while (currentDate <= endDate) {
  console.log('frequencyss',frequency)
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + Number(frequency));
    console.log(currentDate)
  }
  return dates;
}

export default {
	customer_booking
}