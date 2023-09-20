import dbConnection from'../config/db.js';

// Driver order api

export const get_orders = async (req, res) =>
 {
    try
     {
        const userData = res.user;
        console.log(userData)
        const order = `SELECT id,order_id, date, time FROM bookings WHERE driver_id = ${userData[0].id}`;
        dbConnection.query(order, function (err, data) {
            if (err) throw err;
            res.json({ 'status': true, 'message': 'Data retrieved successfully!', 'data': data });
        });
    } 
    catch (error)
     {
        res.json({ 'status': false, 'message': error.message });
    }
}


// Driver order detail

export const get_order_detail = async (req, res) => {
    try {

        const orderId = req.query.id; 
        const userData = res.user; 
        const userId=userData[0].id;
        console.log(userId)

        const query = `
            SELECT u.name, u.comment, ca.address, ca.appartment, ca.city, ca.state, ca.zip, ca.latitude, ca.longitude, b.total_loads
            FROM bookings AS b
            JOIN customer_address AS ca ON b.user_id = ca.user_id
            JOIN users AS u ON b.user_id = u.id
            WHERE b.id = ? AND b.user_id = ?;
        `;

        dbConnection.query(query, [orderId, userId], function (err, data) 
        {
            if (err) 
            {
                res.json({ 'status': false, "message": err.message });
            }
             else 
            {
                res.json({ 'status': true, "message": "Order details retrieved successfully!", 'data': data });
            }
        });
    } 
    catch (error) 
    {
        res.json({ 'status': false, "message": error.message });
    }
}


export default{
    get_orders,
    get_order_detail
};