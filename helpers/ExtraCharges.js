export const chargesDeduction_card = async (cardNumber, expMonth, expYear, cvc, booking_id, amount, card_status) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (cardNumber && expMonth && expYear && cvc && booking_id && amount && card_status) {
          if ((cvc.length !== 3 && cvc.length !== 4) || cvc === "000" || cvc === "0000") {
            return resolve({ status: false, message: "Your card security code is invalid" });
          }
  
          // Create Payment Method
          const createCard = await stripe.tokens.create({
            card: {
              number: cardNumber,
              exp_month: expMonth,
              exp_year: expYear,
              cvc: cvc,
            },
          });
  
          const paymentMethod = await stripe.paymentMethods.create({
            type: "card",
            card: {
              token: createCard.id,
            },
          });
  
          if (card_status === 0) {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount * 100,
              currency: "usd",
              customer: customerId,
              payment_method: paymentMethod.id,
              off_session: true,
              confirm: true,
              description: "Payment by client"
            });
  
            if (paymentIntent.status === "succeeded") {
              const updateStatus = `UPDATE bookings SET payment_status = '1' WHERE id = '${booking_id}'`;
              dbConnection.query(updateStatus, async function (error, updateStatus) {
                if (error) {
                 return resolve({ status: false, message: "error updating payment status" });
                } else if (updateStatus.length === 0) {
                 return resolve({ status: false, message: "data does not exist" });
                } else {
                 return resolve({ status: true, message: "Payment successful" });
                }
              });
            } else {
             return resolve({ status: false, message: "Payment failed" });
            }
          } else {
            // Attach Payment Method
            const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethod.id, {
              customer: customerId,
            });
  
            // Update Customer
            const updatedCustomer = await stripe.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: attachedPaymentMethod.id,
              },
            });
  
            // Payment
            const customerData = await stripe.customers.retrieve(customerId);
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount * 100,
              currency: "usd",
              customer: customerId,
              payment_method: customerData.invoice_settings.default_payment_method,
              off_session: true,
              confirm: true,
              description: "Payment by client",
            });
  
            if (paymentIntent.status === "succeeded") {
              const updateStatus = `UPDATE bookings SET payment_status = '1' WHERE id = '${booking_id}'`;
              dbConnection.query(updateStatus, async function (error, updateStatus) {
                if (error) {
                return  resolve({ status: false, message: "error updating payment status" });
                } else if (updateStatus.length === 0) {
                 return resolve({ status: false, message: "data does not exist" });
                } else {
                return   resolve({ status: true, message: "Payment successful" });
                }
              });
            } else {
             return resolve({ status: false, message: "Payment failed" });
            }
          }
        } else {
         return resolve({ status: false, message: "All fields are required" });
        }
      } catch (error) {
       return resolve({ status: false, message: error.message });
      }
    });
  };
  