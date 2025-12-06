import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Replace with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripePayment = ({ totalAmount, onPaymentSuccess }) => {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/api/payment/create-payment-intent`,
          { amount: totalAmount },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent", err);
      }
    };
    createPaymentIntent();
  }, [totalAmount]);

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#f97316',
      colorBackground: '#1f2937',
      colorText: '#f3f4f6',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="w-full">
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm onPaymentSuccess={onPaymentSuccess} totalAmount={totalAmount} />
        </Elements>
      ) : (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">Loading secure payment...</span>
        </div>
      )}
    </div>
  );
};

export default StripePayment;
