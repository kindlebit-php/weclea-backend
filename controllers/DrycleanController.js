import dbConnection from'../config/db.js';
export const get_category = async (req, res) => {
    try {
      var resData = [];
    const category = `SELECT id, title, price, image FROM dry_clean_services WHERE status = '1' `;
      dbConnection.query(category, function (error, data) {
        if (error) throw error;
          data.forEach(element =>
          {
            const {id,title,price,image} = element;
            if(image){
              var img = process.env.BASE_URL+'/uploads/'+image;
            }else{
              var img = process.env.BASE_URL+'/uploads/profile.png';
            }
            const initi = {
            "id":id,"title":title,"price":price,"image":img,
            }
            resData.push(initi);
          });
            res.json({'status':true,"message":"Category retrieved successfully!",'data': resData});
      });

    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };

  export const Add_To_Cart = async (req, res) => {
    try {
      const userData = res.user;
      // console.log(userData);
      const { id ,price,qty} = req.body;
        const category = "SELECT count(id) as total FROM cart WHERE user_id = '"+userData[0].id+"' and service_id = '"+id+"' and status = '0'";
        dbConnection.query(category, function (error, data) {
          if(data[0].total > 0){
            const updateService = "update cart set quantity = '"+qty+"' ,amount = '"+price+"' where user_id = '"+userData[0].id+"' and service_id = '"+id+"' and status = '0'";
          console.log(updateService)
           dbConnection.query(updateService, function (error, data) {
             if(error) throw error;
                res.json({'status':true,"message":"cart updated successfully"});
                
              
            });
          }else{
            const insertService = "INSERT INTO cart (user_id,service_id, quantity, amount) VALUES ( '"+userData[0].id+"', '"+id+"', '"+qty+"', '"+price+"')";
            dbConnection.query(insertService, function (insertError) {
             
              res.json({'status':true,"message":"Items added to cart successfully"});
                
            });
          }
          
       });
      
    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };
  
  
  export const delete_cart_item = async (req, res) => {
    try {
       const userData = res.user;
      const { id } = req.body;
         const updateService = "delete from cart where id = '"+id+"'";
           dbConnection.query(updateService, function (error, data) {
             if(error) throw error;
        res.json({'status':true,"message":"Item deleted successfully"});
                
              
            });
    }catch (error) {
      res.json({ status: false, message: error.message });
    }
  }
   
  export const get_cart_items = async (req, res) => {
    try {
       const userData = res.user;
        const items = "SELECT cart.id,dry_clean_services.title,cart.amount,cart.quantity FROM cart LEFT JOIN dry_clean_services ON cart.service_id = dry_clean_services.id WHERE cart.user_id = '"+userData[0].id+"' and cart.status = '0'";
        
          dbConnection.query(items, function (error, data) {
             if(error) throw error;
          res.json({'status':true,"message":"Item deleted successfully",'data':data});
                
              
            });
    }catch (error) {
      res.json({ status: false, message: error.message });
    }
  }
  

  export default {get_category ,Add_To_Cart,delete_cart_item,get_cart_items}
  