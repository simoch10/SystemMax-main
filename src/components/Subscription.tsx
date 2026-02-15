import { useState, useEffect } from 'react';
import { CreditCard, Key, Check, Star, ShieldCheck, AlertTriangle, Crown, CheckCircle, RefreshCcw } from 'lucide-react';

interface PricingPlan {
  duration: string;
  price: string;
  originalPrice?: string;
  savings?: string;
  popular?: boolean;
}

export default function Subscription() {
  const [status, setStatus] = useState<any>({ status: 'checking', daysLeft: 0, plan: '...' });
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    { duration: '1 Month', price: '€12.99' },
    { duration: '3 Months', price: '€23.99', originalPrice: '€38.97', savings: 'Save 38%', popular: true },
    { duration: '6 Months', price: '€34.99', originalPrice: '€77.94', savings: 'Save 55%' },
    { duration: '12 Months', price: '€59.99', originalPrice: '€155.88', savings: 'Save 62%' },
  ];

  const features = [
    'One-Click System Optimization',
    'DNS Speed Test & Switcher',
    'Gaming Mode with Process Killer',
    'System Cleaner & Disk Optimization',
    'Internet Booster',
    'Power Plan Optimization',
    'Real-time System Monitoring',
    'Priority Support',
    'Lifetime Updates',
  ];

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if ((window as any).electronAPI) {
      const data = await (window as any).electronAPI.getSubscriptionStatus();
      setStatus(data);
    }
  };

  const handleActivateLicense = async () => {
    if (licenseKey.length < 8) return;
    setActivating(true);
    setMessage(null);

    if ((window as any).electronAPI) {
      const result = await (window as any).electronAPI.activateLicense(licenseKey);
      if (result.success) {
        setMessage('success');
        checkStatus();
      } else {
        setMessage(result.error || 'error');
      }
    } else {
      setTimeout(() => { setMessage('Error connecting to validation server.'); setActivating(false); }, 1000);
    }
    setActivating(false);
  };

  const handleRemoveLicense = async () => {
    setRemoving(true);
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.removeLicense();
      setLicenseKey('');
      setMessage(null);
      checkStatus();
    }
    setRemoving(false);
  };

  return (
    <div className="h-full overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-zinc-700">
      <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400">Subscription</h2>
            <p className="text-zinc-500 mt-1">Choose your plan or activate license</p>
          </div>

          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${status.status === 'pro' ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' :
              status.status === 'expired' ? 'bg-red-500/10 border-red-500 text-red-400' :
                'bg-green-500/10 border-green-500 text-green-400'
            }`}>
            {status.status === 'pro' ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="font-bold">
              {status.status === 'pro' ? 'PREMIUM ACTIVE' :
                status.status === 'expired' ? 'TRIAL EXPIRED' :
                  `${status.daysLeft} DAYS LEFT (FREE TRIAL)`}
            </span>
          </div>
        </div>

        {/* --- DYNAMIC CONTENT --- */}
        {status.status === 'pro' ? (
          <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/5 border border-yellow-400/50 p-12 rounded-2xl shadow-[0_0_50px_rgba(250,204,21,0.2)] w-full text-center relative mt-8">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-black shadow-lg shadow-yellow-400/50">
              <Crown className="w-12 h-12" fill="black" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Premium Active</h2>

            {status.plan && status.plan !== 'Premium' && (
              <div className="inline-block bg-yellow-400 text-black font-bold px-6 py-2 rounded-full text-sm mb-8 shadow-lg shadow-yellow-400/20">
                {status.plan} Plan
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-lg border border-yellow-400/10">
                <CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-white">Unlimited Optimization</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-lg border border-yellow-400/10">
                <CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-white">Pro Gaming Mode</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-lg border border-yellow-400/10">
                <CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-white">Deep System Cleaning</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-lg border border-yellow-400/10">
                <CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-white">Priority Support</span>
              </div>
            </div>

            <button
              onClick={handleRemoveLicense} disabled={removing}
              className="mt-8 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all text-sm border border-zinc-700 flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${removing ? 'animate-spin' : ''}`} />
              {removing ? 'Removing...' : 'Change License Key'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-zinc-900 border border-yellow-400/30 rounded-xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Activate License Key</h3>
              </div>
              <p className="text-zinc-400 mb-6">Already have a license key? Enter it below to activate your subscription.</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="MAX-XXXX-XXXX-XXXX"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all font-mono uppercase"
                />
                <button
                  onClick={handleActivateLicense} disabled={activating || !licenseKey}
                  className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-semibold py-3 px-8 rounded-lg transition-all shadow-lg shadow-yellow-400/30 min-w-[140px] flex items-center justify-center"
                >
                  {activating ? 'Checking...' : 'Activate'}
                </button>
              </div>

              {message === 'success' && (
                <div className="mt-4 p-4 bg-green-600/20 border border-green-600 rounded-lg flex items-center gap-3 animate-in fade-in">
                  <Check className="w-5 h-5 text-green-400" /> <p className="text-green-400">License activated successfully! Refreshing...</p>
                </div>
              )}

              {message && message !== 'success' && (
                <div className="mt-4 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center gap-3 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-400" /> <p className="text-red-400">{message}</p>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h3>
              <p className="text-zinc-400">Unlock the full potential of SystemMax Optimizer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <div key={index} className={`relative rounded-xl p-6 transition-all transform hover:scale-105 flex flex-col justify-between ${plan.popular ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-2 border-yellow-400 shadow-lg shadow-yellow-400/30' : 'bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> POPULAR
                      </div>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-white mb-2">{plan.duration}</h4>
                    {plan.originalPrice && <p className="text-sm text-zinc-500 line-through">{plan.originalPrice}</p>}
                    <p className="text-4xl font-bold text-yellow-400 mb-1">{plan.price}</p>
                    {plan.savings && <p className="text-sm text-green-400 font-semibold">{plan.savings}</p>}
                  </div>
                  {/* الرابط الجديد ديال الدفع */}
                  <a
                    href="https://digitalsupportgroup.digital/payment-gateway/"
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-3 rounded-lg font-semibold transition-all text-center block ${plan.popular ? 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-400/30' : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}`}
                  >
                    Get Started
                  </a>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">All Plans Include</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- SUPPORT SECTION (رابط الدعم الجديد) --- */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-yellow-400/30 rounded-xl p-6 mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Need Help Choosing?</h3>
              <p className="text-zinc-400">
                Contact our support team for assistance or questions about licensing
              </p>
            </div>
            {/* الرابط الجديد ديال الدعم */}
            <a
              href="https://digitalsupportgroup.digital/contact-us/"
              target="_blank"
              rel="noreferrer"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-8 rounded-lg transition-all border border-zinc-700 block text-center"
            >
              Contact Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}