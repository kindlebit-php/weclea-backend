import dotenv from "dotenv";
dotenv.config();
import dbConnection from'../config/db.js';
import Stripe from "stripe";
import { date } from "../helpers/date.js";
import { customer_loads_subscription } from "./LoadController.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

// Add & Attach Card Api

export const Attach_Card = async (req, res) => {
  try {

    // validation 
    const userData = res.user;
    const customerId = userData[0].customer_id;
    console.log(customerId)
    const { cardNumber, expMonth, expYear, cvc } = req.body;
    if (cardNumber && expMonth && expYear && cvc) {
      if (
        (cvc.length !== 3 && cvc.length !== 4) ||
        cvc === "000" ||
        cvc === "0000"
      ) {
       return res.json({
          status: true,
          messagae: "Your card security code is invalid",
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
      return res.json({data:customerId,status: true,messagae: "card attached successfully"});
    } else {
        return res.json({ status: true, messagae: "All fields are required" });
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


//Customer payment api

export const customer_payment = async (req, res) => {
  const userData = res.user;
  const userId = userData[0].id;
  const { purchase_id } = req.body;

  try {

    const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
    dbConnection.query(purchase_data, async function (err, data) {
      if (err) {
        return res.json({ status: false, message: 'Error retrieving purchase data' });
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
      dbConnection.query(user_data, async function (err, userData) {
        if (err) {
          return res.json({ status: false, message: 'Error retrieving user data' });
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
            amount: purchaseAmount * 100,
            currency: 'usd',
            customer: customerId,
            payment_method: customerData.invoice_settings.default_payment_method,
            off_session: true,
            confirm: true,
            description: 'Payment by client',
          });
          if(paymentIntent.status === 'succeeded') {
            const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
            dbConnection.query(updateStatus, async function (err, updateStatus) {
              if (err) {
                return res.json({ status: false, message: 'Error updating payment status' });
              }

              const currentDate = date();
              const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
                userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;

              dbConnection.query(sql, function (err, result) {
                if (err) {
                  return res.json({ status: false, message: err.message });
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
     res.status(200).json({ status: true, messagae: "Bank account added successfully"});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};



export const ACH_Payment=async(req,res)=>{
  const userData = res.user;
  const userId = userData[0].id;
  const { purchase_id } = req.body;
  try {
    const purchase_data = `SELECT * FROM customer_loads_subscription WHERE id = '${purchase_id}'`;
    dbConnection.query(purchase_data, async function (err, data) {
      if (err) {
        return res.json({ status: false, message: 'Error retrieving purchase data' });
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
      dbConnection.query(user_data, async function (err, userData) {
        if (err) {
          return res.json({ status: false, message: 'Error retrieving user data' });
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
    if( paymentIntent.status === 'succeeded') {
      const updateStatus = `UPDATE customer_loads_subscription SET payment_status = '1' WHERE id = '${purchase_id}'`;
      dbConnection.query(updateStatus, async function (err, updateStatus) {
        if (err) {
          return res.json({ status: false, message: 'Error updating payment status' });
        }

        const currentDate = date();
        const sql = `INSERT INTO payment (user_id, amount, payment_id, date) VALUES ('${
          userData[0].id}', '${purchaseAmount}', '${paymentIntent.id}', '${currentDate}')`;

        dbConnection.query(sql, function (err, result) {
          if (err) {
            return res.json({ status: false, message: err.message });
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
    res.status(500).json({ error: error.message });
  }
}

export default {
  Attach_Card,
  get_all_cards,
  customer_payment,
  Add_Bank_Account,
  ACH_Payment
};
