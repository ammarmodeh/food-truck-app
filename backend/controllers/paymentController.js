import Stripe from 'stripe';

export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe Secret Key is missing in environment variables.');
    return res.status(500).json({ msg: 'Server error: Stripe not configured' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
