import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreditCard, X, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { paymentService } from '../../services/paymentService';

export const PaymentCheckoutModal = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  milestone,
  contract,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen || !milestone) return null;

  const formattedAmount = ((milestone.amountMinorUnits || 0) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: milestone.currency || 'USD',
  });

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const origin = window.location.origin;
      const res = await paymentService.createCheckoutSession({
        milestoneId: milestone._id,
        successUrl: `${origin}/projects/${milestone.projectId}?tab=financials&payment=success`,
        cancelUrl: `${origin}/projects/${milestone.projectId}?tab=financials&payment=cancelled`,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to create payment session.');
      }

      // If mock/sandbox provider session, we can immediately verify server-side
      if (res.isMock || res.session?.provider === 'mock') {
        const verifyRes = await paymentService.verifyPayment({
          sessionId: res.session?.id || res.session?.sessionId,
          paymentId: res.payment?._id,
        });

        if (verifyRes.success) {
          setSuccessResult(verifyRes.payment);
          if (onPaymentSuccess) onPaymentSuccess(verifyRes.payment);
        } else {
          throw new Error(verifyRes.message || 'Payment verification failed.');
        }
      } else if (res.session?.checkoutUrl) {
        // Stripe Hosted Checkout URL redirect
        window.location.href = res.session.checkoutUrl;
      } else {
        // Generic success
        setSuccessResult(res.payment);
        if (onPaymentSuccess) onPaymentSuccess(res.payment);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-md bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Secure Milestone Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successResult ? (
            <div className="text-center py-4 space-y-3 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Verified & Recorded!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Milestone payment of {formattedAmount} has been verified and added to the immutable financial ledger.
              </p>
              <div className="pt-2">
                <Button size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Milestone Item:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{milestone.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Recipient Developer:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {contract?.developerId?.name || 'Assigned Developer'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Total Charge:
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formattedAmount}
                  </span>
                </div>
              </div>

              {/* Security & Verification Guarantees */}
              <div className="space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-primary-500" />
                  <span>256-bit SSL encrypted & HMAC signed transactions</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified server-side signature before updating milestone state</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={handleCheckout}
                  isLoading={loading}
                  className="gap-1.5"
                >
                  Pay {formattedAmount}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentCheckoutModal;
