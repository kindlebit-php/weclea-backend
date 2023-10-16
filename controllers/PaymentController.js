import dotenv from "dotenv";
dotenv.config();
import dbConnection from'../config/db.js';
import Stripe from "stripe";
import { customer_loads_subscription } from "./LoadController.js";
import { date } from "../helpers/date.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

// Add & Attach Card Api

export const Attach_Card = async (req, res) => {
  try {        

    // validation 
    const userData = res.user;
    const customerId = userData[0].customer_id;
    const { cardNumber, expMonth, expYear, cvc, purchase_id  } = req.body;
    if (cardNumber && expMonth && expYear && cvc) {
      if (
        (cvc.length !== 3 && cvc.length !== 4) ||
        cvc === "000" ||          
        cvc === "0000"
      ) {
       return res.json({
          status: true,
          message: "Your card security code is invalid",
        });
      }
      //create token
      const createCard = await stripes.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
        },
      });
      // Create Payment Method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: createCard.id,
        },
      });
      // Attach Payment Method
      const attachedPaymentMethod = await stripe.paymentMethods.attach(
        paymentMethod.id,
        {
          customer: customerId,
        }
      );

      // Update Customer
      const updateCustomer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: attachedPaymentMethod.id,
        },
      });

      return res.json({data:customerId,status: true,message: "card attached successfully"});

    } else {
        return res.json({ status: false, message: "All fields are required" });
    }
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};

// Get All Cards API

export const get_all_cards = async (req, res) => {
  try {
    const userData = res.user;
    const customerId = userData[0].customer_id;
    if (!customerId)
    return res.json({ status: false, message: "User not found!" });

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    const cards = paymentMethods.data.map((paymentMethod) => ({
      cardId: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
    }));

    res.json({'status':true,"messagae":"Cards get successfully!",CardList:cards});
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};

// payment by CardId

export const Payment_Card_Id = async (req, res) => {
  try {
    const userData = res.user;
    const userId = userData[0].id;
    const { purchase_id, cardId } = req.body;

    const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
    dbConnection.query(purchase_data, async function (error, data) {
      if (error) {
        return res.json({ status: false, message: 'error retrieving purchase data' });
      }

      if (data.length === 0) {
        return res.json({ status: false, message: 'Purchase data not found' });
      }

      const purchaseAmount = data[0].amount;
      const user_id = data[0].user_id;
      const buy_loads=data[0].buy_loads;
      const payment_status=data[0].payment_status
      
      if (payment_status == 1) {
        return res.json({ status: false, message: 'already paid' });
      }

      if (userId !== user_id) {
        return res.json({ status: false, message: 'You are not a valid user' });
      }

      const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
      dbConnection.query(user_data, async function (error, userData) {
        if (error) {
          return res.json({ status: false, message: 'error retrieving user data' });
        }

        if (userData.length === 0) {
          return res.json({ status: false, message: 'User data not found' });
        }

        const customerId = userData[0].customer_id;
        const available_loads=userData[0].available_loads;

        try {
          const customerData = await stripe.customers.retrieve(customerId);

          if (!customerData.id) {
            return res.json({ status: false, message: "Customer_id doesn't exist" });
          }

          const paymentIntent = await stripe.paymentIntents.create({
            amount: purchaseAmount * 100,
            currency: 'usd',
            customer: customerId,
            payment_method: cardId,
            off_session: true,
            confirm: true,
            description: 'Payment by client',
          });

          if (paymentIntent.status === 'succeeded') {
            const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
            dbConnection.query(updateStatus, async function (error, updateStatus) {
              if (error) {
                return res.json({ status: false, message: 'error updating payment status' });
              }
              else {
                const update_loads_availability = `
                UPDATE customer_loads_availabilty AS cla
                JOIN customer_loads_subscription AS cls ON cla.user_id = cls.user_id
                SET cla.commercial = CASE WHEN cls.category_id = 1 THEN cla.commercial + cls.buy_loads ELSE cla.commercial END,
                    cla.residential = CASE WHEN cls.category_id = 2 THEN cla.residential + cls.buy_loads ELSE cla.residential END,
                    cla.yeshiba = CASE WHEN cls.category_id = 3 THEN cla.yeshiba + cls.buy_loads ELSE cla.yeshiba END
                WHERE cls.id = ? AND cls.user_id = ?`;

dbConnection.query(update_loads_availability, [purchase_id,user_id], async function (error, results) {
if (error) {
return res.json({ status: false, message: 'Error in update_loads_availability' });
}
})
}


              const currentDate = date(); 
              const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
                userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;

              dbConnection.query(sql, function (error, result) {
                if (error) {
                  return res.json({ status: false, message: error.message });
                }
                return res.json({ status: true, message: 'Payment successful' });
              });
            });
          } else {
            return res.json({ status: false, message: 'Payment failed' });
          }
        } catch (stripeerror) {
          return res.json({ status: false, message: `Stripe error: ${stripeerror.message}` });
        }
      });
    });
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};


//Customer payment api

export const customer_payment = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const customerId = userData[0].customer_id;
  const available_loads=userData[0].available_loads;
  const { cardNumber, expMonth, expYear, cvc, purchase_id,card_status } = req.body;

  try {
    if (cardNumber && expMonth && expYear && cvc && purchase_id,card_status) {
      if (
        (cvc.length !== 3 && cvc.length !== 4) ||
        cvc === "000" ||
        cvc === "0000"
      ) {
       return res.json({
          status: false,
          message: "Your card security code is invalid",
        });
      }
      //create token
      const createCard = await stripes.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
        },
      });
      // Create Payment Method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: createCard.id,
        },
      });
      if(card_status == 0){
        const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
        dbConnection.query(purchase_data, async function (error, data) {
          if (error) {
            return res.json({ status: false, message: 'error retrieving purchase data' });
          }
    
          if (data.length === 0) {
            return res.json({ status: false, message: 'Purchase data not found' });
          }
    
          const purchaseAmount = data[0].amount;
          const user_id = data[0].user_id;
          const buy_loads=data[0].buy_loads;
          const payment_status=data[0].payment_status
      
          if (payment_status == 1) {
            return res.json({ status: false, message: 'already paid' });
          }

          if(userId !== user_id){
            return res.json({ status: false, message: 'You are not a valid user' });
          }
          const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
          dbConnection.query(user_data, async function (error, userData) {
            if (error) {
              return res.json({ status: false, message: 'error retrieving user data' });
            }
    
            if (userData.length === 0) {
              return res.json({ status: false, message: 'User data not found' });
            }
    
              const paymentIntent = await stripe.paymentIntents.create({
                amount: purchaseAmount * 100,
                currency: 'usd',
                customer: customerId,
                payment_method:paymentMethod.id,
                off_session: true,
                confirm: true,
                description: 'Payment by client',
              });
              if(paymentIntent.status === 'succeeded') {
                const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
                dbConnection.query(updateStatus, async function (error, updateStatus) {
                  if (error) {
                    return res.json({ status: false, message: 'error updating payment status' });
                  }
                  else {
                    const update_loads_availability = `
                    UPDATE customer_loads_availabilty AS cla
                    JOIN customer_loads_subscription AS cls ON cla.user_id = cls.user_id
                    SET cla.commercial = CASE WHEN cls.category_id = 1 THEN cla.commercial + cls.buy_loads ELSE cla.commercial END,
                        cla.residential = CASE WHEN cls.category_id = 2 THEN cla.residential + cls.buy_loads ELSE cla.residential END,
                        cla.yeshiba = CASE WHEN cls.category_id = 3 THEN cla.yeshiba + cls.buy_loads ELSE cla.yeshiba END
                    WHERE cls.id = ? AND cls.user_id = ?`;

                    dbConnection.query(update_loads_availability, [purchase_id,user_id], async function (error, results) {
                    if (error) {
                    return res.json({ status: false, message: 'Error in update_loads_availability' });
                               }
                            })
                          }

                  const currentDate = date();
                  const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
                    userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;
    
                  dbConnection.query(sql, function (error, result) {
                    if (error) {
                      return res.json({ status: false, message: error.message });
                    }
                    return res.json({ status: true, message: 'Payment successful' });
                  });
                });
              } else {
                return res.json({ status: false, message: 'Payment failed' });
              }
          });
        });
      }else{
      // Attach Payment Method
      const attachedPaymentMethod = await stripe.paymentMethods.attach(
        paymentMethod.id,
        {
          customer: customerId,
        }
      );

      // Update Customer
      const updateCustomer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: attachedPaymentMethod.id,
        },
      });

   
    // ****************************Payment***************************************//

    const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
    dbConnection.query(purchase_data, async function (error, data) {
      if (error) {
        return res.json({ status: false, message: 'error retrieving purchase data' });
      }

      if (data.length === 0) {
        return res.json({ status: false, message: 'Purchase data not found' });
      }

      const purchaseAmount = data[0].amount;
      const user_id = data[0].user_id;
      const buy_loads=data[0].buy_loads;
      const payment_status=data[0].payment_status
      
      if (payment_status == 1) {
        return res.json({ status: false, message: 'already paid' });
      }
      if(userId !== user_id){
        return res.json({ status: false, message: 'You are not a valid user' });
      }
      const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
      dbConnection.query(user_data, async function (error, userData) {
        if (error) {
          return res.json({ status: false, message: 'error retrieving user data' });
        }

        if (userData.length === 0) {
          return res.json({ status: false, message: 'User data not found' });
        }

        const customerId = userData[0].customer_id;
        const available_loads=userData[0].available_loads;
          const customerData = await stripe.customers.retrieve(customerId);

          if (!customerData.id) {
            return res.json({ status: false, message: "Customer_id doesn't exist" });
          }
          const paymentIntent = await stripe.paymentIntents.create({
            amount: purchaseAmount * 100,
            currency: 'usd',
            customer: customerId,
            payment_method: customerData.invoice_settings.default_payment_method,
            off_session: true,
            confirm: true,
            description: 'Payment by client',
          });
          if(paymentIntent.status === 'succeeded') {
            const update_Status = `UPDATE users SET card_status = '1' WHERE id = '${userId}'`;
            dbConnection.query(update_Status, async function (error,update_Status){
              if(error){
                return res.json({ status: false, message: 'error updating payment status' });
              } 

            })

            const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
            dbConnection.query(updateStatus, async function (error, updateStatus) {
              if (error) {
                return res.json({ status: false, message: 'error updating payment status' });
              }else {
                const update_loads_availability = `
UPDATE customer_loads_availabilty AS cla
JOIN customer_loads_subscription AS cls ON cla.user_id = cls.user_id
SET cla.commercial = CASE WHEN cls.category_id = 1 THEN cla.commercial + cls.buy_loads ELSE cla.commercial END,
    cla.residential = CASE WHEN cls.category_id = 2 THEN cla.residential + cls.buy_loads ELSE cla.residential END,
    cla.yeshiba = CASE WHEN cls.category_id = 3 THEN cla.yeshiba + cls.buy_loads ELSE cla.yeshiba END
WHERE cls.id = ? AND cls.user_id = ?`;

dbConnection.query(update_loads_availability, [purchase_id,user_id], async function (error, results) {
if (error) {
return res.json({ status: false, message: 'Error in update_loads_availability' });
}
})
}

              const currentDate = date();
              const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
                userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;

              dbConnection.query(sql, function (error, result) {
                if (error) {
                  return res.json({ status: false, message: error.message });
                }
                return res.json({ status: true, message: 'Payment successful' });
              });
            });
          } else {
            return res.json({ status: false, message: 'Payment failed' });
          }
      });
    });
  }
  } else {
    return res.json({ status: false, message: "All fields are required" });
}
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};



// Create a bank account token
export const Add_Bank_Account = async (req, res) => {
  const userData = res.user;
  const customerId = userData[0].customer_id;
  const { account_holder_name, routing_number, account_number, account_holder_type } = req.body;
  try {
    const bankToken = await stripe.tokens.create({
      bank_account: {
        account_holder_name,
        routing_number,
        account_number,
        country:"US",
        currency:"usd",
        account_holder_type,
      }
    });
    const source= await stripe.customers.createSource(customerId,{
      source:bankToken.id,
     });
    
    const verification=await stripe.customers.verifySource(customerId,source.id,{
     amounts: [32,45]
    });
   

    const updatedSource = await stripe.customers.retrieveSource(customerId,source.id);
    const verificationStatus = updatedSource.status;

    const customer= await stripe.customers.retrieve(customerId);
    const updatedData= await stripe.customers.update(customerId,{
       default_source:source.id,
     });
     res.json({ status: true, messagae: "Bank account added successfully"});
  } catch (error) {
    console.error(error.message);
     return res.json({ error: error.message });
  }
};



export const ACH_Payment=async(req,res)=>{
  const userData = res.user;
  const userId = userData[0].id;
  const { purchase_id } = req.body;
  try {
    const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
    dbConnection.query(purchase_data, async function (error, data) {
      if (error) {
        return res.json({ status: false, message: 'error retrieving purchase data' });
      }

      if (data.length === 0) {
        return res.json({ status: false, message: 'Purchase data not found' });
      }

      const purchaseAmount = data[0].amount;
      const user_id = data[0].user_id;
      if(userId !== user_id){
        return res.json({ status: false, message: 'You are not a valid user' });
      }
      const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
      dbConnection.query(user_data, async function (error, userData) {
        if (error) {
          return res.json({ status: false, message: 'error retrieving user data' });
        }

        if (userData.length === 0) {
          return res.json({ status: false, message: 'User data not found' });
        }

        const customerId = userData[0].customer_id;
          const customerData = await stripe.customers.retrieve(customerId);

          if (!customerData.id) {
            return res.json({ status: false, message: "Customer_id doesn't exist" });
          } 

    const paymentIntent= await stripe.charges.create({
      amount:purchaseAmount*100,
      currency: 'usd',
      customer:customerId
    });
    if( paymentIntent.source.status === 'verified' && paymentIntent.status === 'pending') {
      const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
      dbConnection.query(updateStatus, async function (error, updateStatus) {
        if (error) {
          return res.json({ status: false, message: 'error updating payment status' });
        }

        const currentDate = date();
        const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
          userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;

        dbConnection.query(sql, function (error, result) {
          if (error) {
            return res.json({ status: false, message: error.message });
          }
          return res.json({ status: true, message: 'Payment successful' });
        });
      });
    } else {
      return res.json({ status: false, message: 'Payment failed' });
    }
});
});
  } catch (error) {
    console.log(error.message)
    return res.json({ error: error.message });
  }
}

// Payment with Booking id

export const customer_payment_BookingId = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const customerId = userData[0].customer_id;
  const { cardNumber, expMonth, expYear, cvc, booking_id, card_status } = req.body;

  try {
    if (cardNumber && expMonth && expYear && cvc && booking_id && card_status) {
      if ((cvc.length !== 3 && cvc.length !== 4) || cvc === "000" || cvc === "0000") {
        return res.json({
          status: false,
          message: "Your card security code is invalid",
        });
      }

      // Create a token
      const createCard = await stripes.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
        },
      });
      // Create a Payment Method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: createCard.id,
        },
      });

      if (card_status === 0) {
        const booking_data = `SELECT * FROM bookings WHERE id = '${booking_id}'`;
        dbConnection.query(booking_data, async function (error, data) {
          if (error) {
            return res.json({ status: false, message: 'error retrieving booking data' });
          }

          if (data.length === 0) {
            return res.json({ status: false, message: 'booking data not found' });
          }

          const bookingAmount = data[0].total_amount;
          const user_id = data[0].user_id;
          const payment_status = data[0].payment_status;

          if (payment_status == 1) {
            return res.json({ status: false, message: 'already paid' });
          }

          if (userId !== user_id) {
            return res.json({ status: false, message: 'You are not a valid user' });
          }

          const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
          dbConnection.query(user_data, async function (error, userData) {
            if (error) {
              return res.json({ status: false, message: 'error retrieving user data' });
            }

            if (userData.length === 0) {
              return res.json({ status: false, message: 'User data not found' });
            }

            const paymentIntent = await stripe.paymentIntents.create({
              amount: bookingAmount * 100,
              currency: 'usd',
              customer: customerId,
              payment_method: paymentMethod.id,
              off_session: true,
              confirm: true,
              description: 'Payment by client',
            });

            if (paymentIntent.status === 'succeeded') {
              const updateStatus = `UPDATE bookings SET payment_status = '1' WHERE id = '${booking_id}'`;
              dbConnection.query(updateStatus, async function (error, updateStatus) {
                if (error) {
                  return res.json({ status: false, message: 'error updating payment status' });
                } else if (updateStatus.length === 0) {
                  return res.json({ status: false, message: "data does not exist" });
                } else {
                  const update_cart_status = `UPDATE cart SET status = '1' WHERE booking_id = '${booking_id}'`;
                  dbConnection.query(update_cart_status, [booking_id], async function (error, results) {
                    if (error) {
                      return res.json({ status: false, message: 'Error in update_cart_status' });
                    }
                    const currentDate = date();
                    const insertData = "INSERT INTO payment (user_id, booking_id, amount, payment_id, date) VALUES ('" + user_id + "', '" + booking_id + "','" + bookingAmount + "','" + paymentIntent.id + "','" + currentDate + "')";
                    dbConnection.query(insertData, function (err, result) {
                      if (err) throw err;
                      if (result) {
                        return res.json({ status: true, message: 'Payment successful' });
                      }
                    });
                  })
                }
              });
            } else {
              return res.json({ status: false, message: 'Payment failed' });
            }
          });
        });
      } else {
        // Attach Payment Method
        const attachedPaymentMethod = await stripe.paymentMethods.attach(
          paymentMethod.id,
          {
            customer: customerId,
          }
        );

        // Update Customer
        const updateCustomer = await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: attachedPaymentMethod.id,
          },
        });

        const booking_data = `SELECT * FROM bookings WHERE id = '${booking_id}'`;
        dbConnection.query(booking_data, async function (error, data) {
          if (error) {
            return res.json({ status: false, message: 'error retrieving booking data' });
          }

          if (data.length === 0) {
            return res.json({ status: false, message: 'booking data not found' });
          }

          const bookingAmount = data[0].total_amount;
          const user_id = data[0].user_id;
          const payment_status = data[0].payment_status;

          if (payment_status == 1) {
            return res.json({ status: false, message: 'already paid' });
          }

          if (userId !== user_id) {
            return res.json({ status: false, message: 'You are not a valid user' });
          }

          const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
          dbConnection.query(user_data, async function (error, userData) {
            if (error) {
              return res.json({ status: false, message: 'error retrieving user data' });
            }

            if (userData.length === 0) {
              return res.json({ status: false, message: 'User data not found' });
            }

            const customerId = userData[0].customer_id;
            const customerData = await stripe.customers.retrieve(customerId);

            if (!customerData.id) {
              return res.json({ status: false, message: "Customer_id doesn't exist" });
            }

            const paymentIntent = await stripe.paymentIntents.create({
              amount: bookingAmount * 100,
              currency: 'usd',
              customer: customerId,
              payment_method: customerData.invoice_settings.default_payment_method,
              off_session: true,
              confirm: true,
              description: 'Payment by client',
            });

            if (paymentIntent.status === 'succeeded') {
              const updateStatus = `UPDATE bookings SET payment_status = '1' WHERE id = '${booking_id}'`;
              dbConnection.query(updateStatus, async function (error, updateStatus) {
                if (error) {
                  return res.json({ status: false, message: 'error updating payment status' });
                } else if (updateStatus.length === 0) {
                  return res.json({ status: false, message: "data does not exist" });
                } else {
                  const update_cart_status = `UPDATE cart SET status = '1' WHERE booking_id = '${booking_id}'`;
                  dbConnection.query(update_cart_status, [booking_id], async function (error, results) {
                    if (error) {
                      return res.json({ status: false, message: 'Error in update_cart_status' });
                    }
                    const currentDate = date();
                    const insertData = "INSERT INTO payment (user_id, booking_id, amount, payment_id, date) VALUES ('" + user_id + "', '" + booking_id + "','" + bookingAmount + "','" + paymentIntent.id + "','" + currentDate + "')";
                    dbConnection.query(insertData, function (err, result) {
                      if (err) throw err;
                      if (result) {
                        return res.json({ status: true, message: 'Payment successful' });
                      }
                    });
                  })
                }
              });
            } else {
              return res.json({ status: false, message: 'Payment failed' });
            }
          });
        });
      }
    } else {
      return res.json({ status: false, message: "All fields are required" });
    }
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};



export const Payment_CardId_BookingId = async (req, res) => {
  try {
    const userData = res.user;
    const userId = userData[0].id;
    const { booking_id, cardId } = req.body;

    const booking_data = `SELECT * FROM bookings WHERE id = '${booking_id}'`;
    dbConnection.query(booking_data, async function (error, data) {
      if (error) {
        return res.json({ status: false, message: 'error retrieving booking data' });
      }

      if (data.length === 0) {
        return res.json({ status: false, message: 'booking data not found' });
      }

      const bookingAmount = data[0].total_amount;
      const user_id = data[0].user_id;
      const payment_status=data[0].payment_status
  
      if (payment_status == 1) {
        return res.json({ status: false, message: 'already paid' });
      }

      if(userId !== user_id){
        return res.json({ status: false, message: 'You are not a valid user' });
      }

      const user_data = `SELECT * FROM users WHERE id = '${user_id}'`;
      dbConnection.query(user_data, async function (error, userData) {
        if (error) {
          return res.json({ status: false, message: 'error retrieving user data' });
        }

        if (userData.length === 0) {
          return res.json({ status: false, message: 'User data not found' });
        }
        const customerId = userData[0].customer_id;
        try {
          const customerData = await stripe.customers.retrieve(customerId);
          if (!customerData.id) {
            return res.json({ status: false, message: "Customer_id doesn't exist" });
          }

          const paymentIntent = await stripe.paymentIntents.create({
            amount: bookingAmount * 100,
            currency: 'usd',
            customer: customerId,
            payment_method: cardId,
            off_session: true,
            confirm: true,
            description: 'Payment by client',
          });

          if (paymentIntent.status === 'succeeded') {
            const updateStatus = `UPDATE bookings SET payment_status = '1' WHERE id = '${booking_id}'`;
                dbConnection.query(updateStatus, async function (error, updateStatus) {
                  if (error) {
                    return res.json({ status: false, message: 'error updating payment status' });
                  } else if (updateStatus.length === 0) {
                    return res.json({ status: false, message: "data does not exist" });
                  } else {
                    const update_cart_status = `UPDATE cart SET status = '1' WHERE booking_id = '${booking_id}'`;
                    dbConnection.query(update_cart_status, [booking_id], async function (error, results) {
                      if (error) {
                        return res.json({ status: false, message: 'Error in update_cart_status' });
                      }
                      const currentDate = date();
                      const insertData = "INSERT INTO payment (user_id, booking_id, amount, payment_id, date) VALUES ('" + user_id + "', '" + booking_id + "','" + bookingAmount + "','" + paymentIntent.id + "','" + currentDate + "')";
                      dbConnection.query(insertData, function (err, result) {
                        if (err) throw err;
                        if (result) {
                          return res.json({ status: true, message: 'Payment successful' });
                        }
                      });
                    })
                  }
                });
              } else {
                return res.json({ status: false, message: 'Payment failed' });
              }
        } catch (stripeerror) {
          return res.json({ status: false, message: `Stripe error: ${stripeerror.message}` });
        }
      });
    });
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};


export const customer_extra_payment = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const customerId = userData[0].customer_id;
  console.log(customerId)
  const { cardNumber, expMonth, expYear, amount, cvc, card_status } = req.body;
  try {
    if (cardNumber && expMonth && expYear && cvc && amount && card_status !== undefined) {
      if ((cvc.length !== 3 && cvc.length !== 4) || cvc === "000" || cvc === "0000") {
        return res.json({
          status: false,
          message: "Your card security code is invalid",
        });
      }

      // Create a token
      const createCard = await stripes.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
        },
      });
      // Create a Payment Method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: createCard.id,
        },
      });

      if (card_status === 0) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethod.id,
          off_session: true,
          confirm: true,
          description: 'Payment by client',
        });
        console.log(paymentIntent)
        if (paymentIntent.status === 'succeeded') {
          const currentDate = date();
          const insertData = "INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('" + userId + "','" + amount + "','" + paymentIntent.id + "','" + currentDate + "')";
          dbConnection.query(insertData, function (err, result) {
            if (err) throw err;
            if (result) {
              return res.json({ status: true, message: 'Payment successful',paymentId:result.insertId});
            }
          });
        } else {
          return res.json({ status: false, message: 'Payment failed' });
        }
      } else {
        // Attach Payment Method
        const attachedPaymentMethod = await stripe.paymentMethods.attach(
          paymentMethod.id,
          {
            customer: customerId,
          }
        );

        // Update Customer
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: attachedPaymentMethod.id,
          },
        });

        const customerData = await stripe.customers.retrieve(customerId);

        if (!customerData.id) {
          return res.json({ status: false, message: "Customer_id doesn't exist" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: 'usd',
          customer: customerId,
          payment_method: customerData.invoice_settings.default_payment_method,
          off_session: true,
          confirm: true,
          description: 'Payment by client',
        });
        console.log(paymentIntent)
        if (paymentIntent.status === 'succeeded') {
          const currentDate = date();
          const insertData = "INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('" + userId + "','" + amount + "','" + paymentIntent.id + "','" + currentDate + "')";
          dbConnection.query(insertData, function (err, result) {
            if (err) throw err;
            else {
              const updatedStatus = 'UPDATE users SET card_status = 1 WHERE id = ?';
              dbConnection.query(updatedStatus, [userId], (err, results) => {
                if (err) {
                  return res.json({ status: false, message: 'Failed to update payment status' });
                }
                return res.json({ status: true, message: 'Payment successful',paymentId:result.insertId});
              });
             
            }
          });
        } else {
          return res.json({ status: false, message: 'Payment failed' });
        }
      }
    } else {
      return res.json({ status: false, message: "All fields are required" });
    }
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};


export const customer_extra_payment_cardId = async (req, res) => {
  try {
    const userData = res.user;
    const userId = userData[0].id;
    const customerId = userData[0].customer_id;
    const { cardId, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      customer: customerId,
      payment_method: cardId,
      off_session: true,
      confirm: true,
      description: 'Payment by client',
    });

    if (paymentIntent.status === 'succeeded') {
      const currentDate = date();
      const insertData = "INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('" + userId + "','" + amount + "','" + paymentIntent.id + "','" + currentDate + "')";
      dbConnection.query(insertData, function (err, result) {
        if (err) throw err;
        if (result) {
          return res.json({ status: true, message: 'Payment successful',paymentId:result.insertId});
        }
      });
    } else {
      return res.json({ status: false, message: 'Payment failed' });
    }
  } catch (error) {
    return res.json({ status: false, message: error.message });
  }
};


export const load_Subscription = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const customerId = userData[0].customer_id;
  const category_id = userData[0].category_id;
  const { cardNumber, expMonth, expYear, cvc, clsId, card_status } = req.body;

  try {
    const sqlQuery = 'SELECT buy_loads, amount FROM customer_loads_subscription WHERE id = ?';
    dbConnection.query(sqlQuery, [clsId], async (error, data) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data.length === 0) {
        return res.json({ status: false, message: 'Data not found' });
      } else {
        const insertData = `INSERT INTO customer_loads_subscription (user_id, category_id, type, buy_loads, amount, payment_status) VALUES (?, ?, ?, ?, ?, ?)`;
        const insertValues = [userId, category_id, 'package', data[0].buy_loads, data[0].amount, 0];
        dbConnection.query(insertData, insertValues, async (err, result) => {
          if (err) {
            return res.json({ status: false, message: 'Failed to insert data' });
          }
          const amount = data[0].amount;

          if (!cardNumber || !expMonth || !expYear || !cvc || amount === undefined || card_status === undefined) {
            return res.json({ status: false, message: 'All fields are required' });
          }

          if (cvc.length !== 3 && cvc.length !== 4) {
            return res.json({ status: false, message: 'Your card security code is invalid' });
          }

          try {
            // Create a token
            const createCard = await stripes.tokens.create({
              card: {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
              },
            });

            // Create a Payment Method
            const paymentMethod = await stripe.paymentMethods.create({
              type: 'card',
              card: {
                token: createCard.id,
              },
            });

            if (card_status === 0) {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: 'usd',
                customer: customerId,
                payment_method: paymentMethod.id,
                off_session: true,
                confirm: true,
                description: 'Payment by client',
              });

              if (paymentIntent.status === 'succeeded') {
                const updateStatus = 'UPDATE customer_loads_subscription SET payment_status = 1 WHERE id = ?';
                dbConnection.query(updateStatus, [result.insertId], (err, result) => {
                  if (err) {
                    return res.json({ status: false, message: 'Failed to update payment status' });
                  } else {
                    const total_loads = data[0].buy_loads;
              
                    if (category_id) {
                      if (category_id == 1) {
                        usrLoads = "UPDATE customer_loads_availabilty SET commercial = commercial + ? WHERE user_id = ?";
                        updateColumn = "commercial";
                      } else if (category_id == 2) {
                        usrLoads = "UPDATE customer_loads_availabilty SET residential = residential + ? WHERE user_id = ?";
                        updateColumn = "residential";
                      } else {
                        usrLoads = "UPDATE customer_loads_availabilty SET yeshiba = yeshiba + ? WHERE user_id = ?";
                        updateColumn = "yeshiba";
                      }
                      dbConnection.query(usrLoads, [total_loads, userId], function (error, result) {
                        if (error) {
                          return res.json({ status: false, message: error.message });
                        } else {
                          return res.json({ status: true, message: 'Payment successful' });
                        }
                      });
                    }
                  }
                });
                return res.json({ status: false, message: 'Payment failed' });
              }
            } else {
              // Attach Payment Method
              const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethod.id, {
                customer: customerId,
              });

              // Update Customer
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: attachedPaymentMethod.id,
                },
              });

              const customerData = await stripe.customers.retrieve(customerId);

              if (!customerData.id) {
                return res.json({ status: false, message: "Customer_id doesn't exist" });
              }

              const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: 'usd',
                customer: customerId,
                payment_method: customerData.invoice_settings.default_payment_method,
                off_session: true,
                confirm: true,
                description: 'Payment by client',
              });

              if (paymentIntent.status === 'succeeded') {
                const updateStatus = 'UPDATE customer_loads_subscription SET payment_status = 1 WHERE id = ?';
                dbConnection.query(updateStatus, [result.insertId], (err, result) => {
                  if (err) {
                    return res.json({ status: false, message: 'Failed to update payment status' });
                  } else {
                    const total_loads = data[0].buy_loads;
                    console.log(total_loads,category_id)
                    if (category_id) {
                      if (category_id == 1) {
                        usrLoads = "UPDATE customer_loads_availabilty SET commercial = commercial + ? WHERE user_id = ?";
                        updateColumn = "commercial";
                      } else if (category_id == 2) {
                        usrLoads = "UPDATE customer_loads_availabilty SET residential = residential + ? WHERE user_id = ?";
                        updateColumn = "residential";
                      } else {
                        usrLoads = "UPDATE customer_loads_availabilty SET yeshiba = yeshiba + ? WHERE user_id = ?";
                        updateColumn = "yeshiba";
                      }
                      dbConnection.query(usrLoads, [total_loads, userId], function (error, result) {
                        console.log("slkfhdsk",result)
                        if (error) {
                          return res.json({ status: false, message: error.message });
                        } else {
                          return res.json({ status: true, message: 'Payment successful' });
                        }
                      });
                    }
                  }
                });
                return res.json({ status: false, message: 'Payment failed' });
              }
            }
          } catch (stripeError) {
            console.log(stripeError.message)
            return res.json({ status: false, message: stripeError.message });
          }
        });
      }
    });
  } catch (error) {
    console.log(error.message)
    return res.json({ status: false, message: error.message });
  }
};


export const load_Subscription_cardId = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const customerId = userData[0].customer_id;
  const category_id = userData[0].category_id;
  const { clsId, cardId } = req.body;

  try {
    const sqlQuery = 'SELECT buy_loads, amount FROM customer_loads_subscription WHERE id = ?';
    dbConnection.query(sqlQuery, [clsId], async (error, data) => {
      if (error) {
        return res.json({ status: false, message: error.message });
      } else if (data.length === 0) {
        return res.json({ status: false, message: 'Data not found' });
      } else {
        const insertData = 'INSERT INTO customer_loads_subscription (user_id, category_id, type, buy_loads, amount, payment_status) VALUES (?, ?, ?, ?, ?, ?)';
        const insertValues = [userId, category_id, 'package', data[0].buy_loads, data[0].amount, 0];
        dbConnection.query(insertData, insertValues, async (err, result) => {
          if (err) {
            return res.json({ status: false, message: 'Failed to insert data' });
          }
          const amount = data[0].amount;

          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount * 100,
              currency: 'usd',
              customer: customerId,
              payment_method: cardId,
              off_session: true,
              confirm: true,
              description: 'Payment by client',
            });

            if (paymentIntent.status === 'succeeded') {
              const updateStatus = 'UPDATE customer_loads_subscription SET payment_status = 1 WHERE id = ?';
              dbConnection.query(updateStatus, [result.insertId], (err, updateResult) => {
                if (err) {
                  return res.json({ status: false, message: 'Failed to update payment status' });
                }
                return res.json({ status: true, message: 'Payment successful' });
              });
            } else {
              return res.json({ status: false, message: 'Payment failed' });
            }
          } catch (stripeError) {
            console.log(stripeError.message);
            return res.json({ status: false, message: stripeError.message });
          }
        });
      }
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ status: false, message: error.message });
  }
};



export default {
  Attach_Card,
  get_all_cards,
  Payment_Card_Id,
  customer_payment,
  Add_Bank_Account,
  ACH_Payment,
  customer_payment_BookingId,
  Payment_CardId_BookingId,
  customer_extra_payment,
  customer_extra_payment_cardId,
  load_Subscription,
  load_Subscription_cardId
};
