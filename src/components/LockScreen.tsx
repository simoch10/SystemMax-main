import { Lock, Crown, ChevronRight } from 'lucide-react';

interface LockScreenProps {
    onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
    return (
        // 👇 التغيير المهم: درنا "fixed" و "z-[100]" باش يجي فوق كلشي ويبقى لاصق فالشاشة
        <div className="fixed top-0 left-0 lg:left-64 right-0 bottom-0 z-[100] flex items-center justify-center p-4">

            {/* الخلفية الضبابية (كتبقى شادة الشاشة كاملة) */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

            {/* البطاقة (Card) - دابا غتبقى ديما فالوسط */}
            <div className="relative z-10 w-full max-w-md bg-zinc-900/90 border border-yellow-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)] text-center overflow-hidden group">

                {/* تأثير الإضاءة الفوقانية */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-yellow-500 rounded-b-full shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>

                {/* الأيقونة المتحركة */}
                <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-zinc-800 border border-yellow-500/50 rounded-full p-4 shadow-lg">
                        <Lock className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border-2 border-zinc-900">
                        <Crown className="w-3 h-3" />
                    </div>
                </div>

                {/* النصوص */}
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    Premium Feature Locked
                </h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                    This optimization tool is available exclusively for <span className="text-yellow-400 font-semibold">Premium Members</span>.
                    Upgrade now to unlock full system power.
                </p>

                {/* زر التجديد */}
                <button
                    onClick={onUnlock}
                    className="group/btn relative w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-[0_5px_20px_rgba(234,179,8,0.2)] hover:shadow-[0_5px_30px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite]"></div>

                    <span className="relative z-10">Renew Subscription</span>
                    <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <p className="mt-4 text-xs text-zinc-600">
                    Already have a key? Click above to activate.
                </p>
            </div>
        </div>
    );
};

export default LockScreen;