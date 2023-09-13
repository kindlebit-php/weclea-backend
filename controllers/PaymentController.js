import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripes = new Stripe(process.env.STRIPE_PUBLISH_KEY);

// Add & Attach Card Api

export const Attach_Card = async (req, res) => {
  try {
    const userData = res.user;
    const customerId = userData[0].customer_id;

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
  try {
    const userData = res.user;
    const customerId = userData[0].customer_id;
    const { amount } = req.body;
    if(amount){
    const customerData = await stripe.customers.retrieve(customerId);
    console.log(customerData)
    if(customerData.length>0){
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      customer: customerId,
      payment_method: customerData.invoice_settings.default_payment_method,
      off_session: true,
      confirm: true,
      description: "Payment by client",
    });
    return res.json({
      status: true,
      messagae: "Payment successfully",
    });
}else{
    return res.json({ status: true, messagae: "Customer_id doesn't exists" });
}
}else{
    return res.json({ status: true, messagae: "Please enter amount" });
}
  } catch (error) {
    res.json({ status: false, messagae: error });
  }
};

export default {
  Attach_Card,
  customer_payment,
};
