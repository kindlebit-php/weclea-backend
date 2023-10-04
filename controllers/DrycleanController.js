import dbConnection from'../config/db.js';
export const get_category = async (req, res) => {
    try {
    const category = `SELECT id, title, price FROM dry_clean_services WHERE status = '1' `;
      dbConnection.query(category, function (error, data) {
        if (error) throw error;
        res.json({
          status: true,
          message: "Category retrieved successfully!",
          data: data,
        });
      });

    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };

  export const Add_To_Cart = async (req, res) => {
    try {
      const { cartItems, booking_id } = req.body;
      let totalAmount = 0;
  
      for (const item of cartItems) {
        const { id, price, quantity } = item;
  
        const existingCartItem = 'SELECT * FROM cart WHERE service_id = ? AND booking_id = ?';
        dbConnection.query(existingCartItem, [id, booking_id], function ( error, data ) { 
          if (error) {
            return res.json({ status: false, message: error.message });
          }
  
          if (data.length > 0) {
            const update_cart =
              'UPDATE cart SET quantity = ?, amount = ? WHERE service_id = ? AND booking_id = ?';
            dbConnection.query(update_cart,[quantity, price * quantity, id, booking_id],
              function (updateError) {
                if (updateError) {return res.json({ status: false, message: updateError.message });
                }
                totalAmount += price * quantity;
              }
            );
          } else {
            const insertService ='INSERT INTO cart (service_id, price, quantity, amount, booking_id) VALUES (?, ?, ?, ?, ?)';
            dbConnection.query(insertService,[id, price, quantity, price * quantity, booking_id],function (insertError) {
                if (insertError) {
                  return res.json({status: false,message: insertError.message});
                } else {
                  totalAmount += price * quantity;
                }
              }
            );
          }
        });
      }
  
      res.status(200).json({ message: 'Items added to cart successfully', totalAmount });
    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };
  
  
  

  export default {get_category ,Add_To_Cart}
  