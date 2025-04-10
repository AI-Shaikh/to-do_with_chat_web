import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { CreditCard, Gem, BadgeCheck, Loader2, Check } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    try {
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (createError) throw createError;

      const { data: clientSecret } = await axiosInstance.post('/subscription/create-payment-intent', {
        priceId: 'price_1RAnXAER9t1bMCZZeZAfw5nu'
      });

      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) throw confirmError;

      await axiosInstance.post('/subscription', {
        paymentMethodId: paymentMethod.id,
        priceId: 'price_1RAnXAER9t1bMCZZeZAfw5nu'
      });

      toast.success('Subscription successful!');
      window.location.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-14">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Card Details</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className="size-5 text-base-content/40" />
          </div>
          <div className="border p-4 rounded-lg pl-10">
            <CardElement className="p-2" />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary w-full flex items-center gap-2"
        disabled={!stripe || loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Gem className="size-5" />
            Subscribe for ₹100/month
          </>
        )}
      </button>
      
      <div className="text-center text-sm text-base-content/60">
        <p>You'll be charged ₹100 monthly. Cancel anytime.</p>
      </div>
    </form>
  );
};

const SubscriptionPage = () => {
  return (
    <div className="flex flex-col justify-center items-center p-6 sm:p-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header with icon */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <BadgeCheck className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mt-2">Unlock Premium Features</h1>
            <p className="text-base-content/60">Upgrade your experience with our premium plan</p>
          </div>
        </div>

        {/* Subscription Form */}
        <div className="bg-base-100 rounded-xl p-6 shadow-sm border">
          <Elements stripe={stripePromise}>
            <SubscriptionForm />
          </Elements>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center">Premium Benefits</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Access to all premium features</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Priority customer support</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Advanced analytics dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Cancel anytime</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;