import stripe from '../lib/stripe.js';
import User from "../models/userModel.js"

export const createSubscription = async (req, res) => {
  try {
    const { paymentMethodId, priceId } = req.body;
    const userId = req.user._id;

    // Create customer if not exists
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email: req.user.email,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent']
    });

    // Update user subscription status
    await User.findByIdAndUpdate(userId, { 
      subscription: true,
      stripeCustomerId: customer.id 
    });

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};