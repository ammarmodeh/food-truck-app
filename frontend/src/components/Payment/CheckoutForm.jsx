import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { motion } from 'framer-motion';

const CheckoutForm = ({ onPaymentSuccess, totalAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/orders',
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent.id);
      setIsProcessing(false);
    } else {
      setErrorMessage("Unexpected state");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <PaymentElement options={{ theme: 'night', labels: 'floating' }} />
      </div>

      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}

      <motion.button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full bg-button-bg-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 ${(!stripe || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={{ scale: (!stripe || isProcessing) ? 1 : 1.02 }}
        whileTap={{ scale: (!stripe || isProcessing) ? 1 : 0.98 }}
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${totalAmount.toFixed(2)}`}
      </motion.button>
    </form>
  );
};

export default CheckoutForm;
