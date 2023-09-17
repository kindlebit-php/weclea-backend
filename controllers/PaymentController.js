import dotenv from "dotenv";
dotenv.config();
import dbConnection from'../config/db.js';
import Stripe from "stripe";
import { date } from "../helpers/date.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

// Add & Attach Card Api

export const Attach_Card = async (req, res) => {
  try {

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
      return res.json({status: true,messagae: "card attached successfully"});
    } else {
        return res.json({ status: true, messagae: "All fields are required" });
    }
  } catch (error) {
    res.json({ status: false, messagae: error });
  }
};

//Customer payment api
export const customer_payment = async (req, res) => {
  const userData = res.user;
  const customerId = userData[0].customer_id;
  const { amount } = req.body;
  try {
    const customerData = await stripe.customers.retrieve(customerId);
    if(customerData.id){
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      customer: customerId,
      payment_method: customerData.invoice_settings.default_payment_method,
      off_session: true,
      confirm: true,
      description: "Payment by client",
    });
    if(userData[0].id && amount && paymentIntent.id && date()){
      var sql = "INSERT INTO payment (user_id,amount,payment_id,date) VALUES ('"+userData[0].id+"','"+amount+"','"+paymentIntent.id+"','"+date()+"')";
      dbConnection.query(sql, function (err, result) {
        if (err) throw err;
        return res.json({status: true,messagae: "Payment successful" });
        });
    }else{
          res.json({'status':false,"messagae":"All fields are required"});
    }
}else{
    return res.json({ status: false, messagae: "Customer_id doesn't exists" });
}
  } catch (error) {
    res.json({ status: false, messagae: error.message });
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
  const customerId = userData[0].customer_id;
  const amount=req.body.amount;
  try {
    const paymentIntent=await stripe.charges.create({
      amount:amount*100,
      currency: 'usd',
      customer:customerId
    });
    if(userData[0].id && amount && paymentIntent.id && date()){
      var sql = "INSERT INTO payment (user_id,amount,payment_id,date) VALUES ('"+userData[0].id+"','"+amount+"','"+paymentIntent.id+"','"+date()+"')";
      dbConnection.query(sql, function (err, result) {
        if (err) throw err;
        return res.json({status: true,messagae: "Payment successful" });
        });
    }else{
          res.json({'status':false,"messagae":"All fields are required"});
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message });
  }
}

export default {
  Attach_Card,
  customer_payment,
  Add_Bank_Account,
  ACH_Payment
};
