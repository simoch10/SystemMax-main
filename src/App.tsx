import { useEffect, useMemo, useState } from 'react';
import { Gauge, Network, Gamepad2, Trash2, CreditCard, Menu, X } from 'lucide-react';

import AppBackground from './components/AppBackground';

import Dashboard from './components/Dashboard';
import NetworkTab from './components/NetworkTab';
import GamingMode from './components/GamingMode';
import SystemCleaner from './components/SystemCleaner';
import Subscription from './components/Subscription';

type Tab = 'dashboard' | 'network' | 'gaming' | 'cleaner' | 'subscription';

type UpdateState =
  | 'idle'
  | 'checking'
  | 'none'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'dev';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ---- Update UI state (sidebar footer) ----
  const [appVersion, setAppVersion] = useState('...');
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateMsg, setUpdateMsg] = useState<string>('Licensed');
  const [dlPercent, setDlPercent] = useState<number>(0);

  const tabs = useMemo(
    () => [
      { id: 'dashboard' as Tab, label: 'Dashboard', icon: Gauge },
      { id: 'network' as Tab, label: 'Network', icon: Network },
      { id: 'gaming' as Tab, label: 'Gaming Mode', icon: Gamepad2 },
      { id: 'cleaner' as Tab, label: 'System Cleaner', icon: Trash2 },
      { id: 'subscription' as Tab, label: 'Subscription', icon: CreditCard },
    ],
    []
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'network':
        // @ts-ignore
        return <NetworkTab setActiveTab={setActiveTab} />;
      case 'gaming':
        return <GamingMode setActiveTab={setActiveTab} />;
      case 'cleaner':
        // @ts-ignore
        return <SystemCleaner setActiveTab={setActiveTab} />;
      case 'subscription':
        return <Subscription />;
      default:
        return <Dashboard />;
    }
  };

  // ---- Get app version once ----
  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore
        const v = await window.electronAPI?.getAppVersion?.();
        if (v) setAppVersion(String(v));
      } catch {
        setAppVersion('unknown');
      }
    })();
  }, []);

  // ---- Listen to updater events (from main.cjs) ----
  useEffect(() => {
    // @ts-ignore
    const cleanup = window.electronAPI?.onUpdate?.((ch: string, payload: any) => {
      if (ch === 'update:checking') {
        setUpdateState('checking');
        setUpdateMsg('Checking...');
        return;
      }

      if (ch === 'update:available') {
        setUpdateState('available');
        setUpdateMsg('Update available');
        return;
      }

      if (ch === 'update:none') {
        setUpdateState('none');
        setUpdateMsg('Up to date');
        return;
      }

      if (ch === 'update:progress') {
        setUpdateState('downloading');
        const p = Number(payload?.percent ?? 0);
        setDlPercent(Number.isFinite(p) ? p : 0);
        setUpdateMsg(`Downloading ${Math.round(p)}%`);
        return;
      }

      if (ch === 'update:downloaded') {
        setUpdateState('downloaded');
        setUpdateMsg('Ready to install');
        return;
      }

      if (ch === 'update:error') {
        setUpdateState('error');
        setUpdateMsg('Update error');
        return;
      }
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  // ---- One button, changes action حسب الحالة ----
  const handleUpdateClick = async () => {
    try {
      if (updateState === 'available') {
        setDlPercent(0);
        setUpdateState('downloading');
        setUpdateMsg('Downloading...');
        // @ts-ignore
        await window.electronAPI?.downloadUpdate?.();
        return;
      }

      if (updateState === 'downloaded') {
        setUpdateMsg('Installing...');
        // @ts-ignore
        await window.electronAPI?.installUpdate?.();
        return;
      }

      setUpdateState('checking');
      setUpdateMsg('Checking...');
      // @ts-ignore
      const res = await window.electronAPI?.checkUpdate?.();

      // main.cjs رجّع status باش يبقى UI متوافق حتى قبل ما تجي events
      const st = String(res?.status || '');
      if (st === 'dev') {
        setUpdateState('dev');
        setUpdateMsg('Build required');
      } else if (st === 'update_available') {
        setUpdateState('available');
        setUpdateMsg('Update available');
      } else if (st === 'latest') {
        setUpdateState('none');
        setUpdateMsg('Up to date');
      } else if (st === 'error') {
        setUpdateState('error');
        setUpdateMsg(res?.message ? String(res.message) : 'Update error');
      }
    } catch {
      setUpdateState('error');
      setUpdateMsg('Update error');
    }
  };

  const updateBtnLabel =
    updateState === 'available'
      ? 'Download'
      : updateState === 'downloaded'
        ? 'Install'
        : updateState === 'downloading'
          ? '...'
          : 'Update';

  const updateBtnDisabled = updateState === 'checking' || updateState === 'downloading';

  return (
    <div className="relative flex h-[100dvh] text-white overflow-hidden bg-transparent">
      <AppBackground />

      {/* زر الموبايل */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900/70 backdrop-blur-md border border-yellow-400/60 rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6 text-yellow-400" /> : <Menu className="w-6 h-6 text-yellow-400" />}
      </button>

      {/* القائمة الجانبية */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative w-64 h-full transition-transform duration-300 z-40 flex flex-col
          bg-zinc-950/70 backdrop-blur-md border-r border-white/10`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <Gauge className="w-8 h-8" />
            SystemMax
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Optimizer Pro</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-yellow-400 text-black font-semibold shadow-lg shadow-yellow-400/50'
                    : 'text-zinc-300 hover:text-yellow-300 hover:bg-white/5'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ✅ Footer: Version + Update button */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/[0.04] border border-yellow-400/20 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-300/80 truncate">Version {appVersion}</p>
                <p className="text-[11px] text-yellow-300 mt-1 truncate">{updateMsg}</p>
              </div>

              <button
                onClick={handleUpdateClick}
                disabled={updateBtnDisabled}
                className={[
                  'px-3 py-2 rounded-lg text-xs font-extrabold',
                  'border border-white/10',
                  updateState === 'available' || updateState === 'downloaded'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/10 text-white',
                  updateBtnDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/15',
                ].join(' ')}
                title={updateState === 'dev' ? 'Build the app to enable updates' : 'Check/Download/Install updates'}
              >
                {updateBtnLabel}
              </button>
            </div>

            {updateState === 'downloading' ? (
              <div className="mt-3">
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, dlPercent))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="relative z-10 flex-1 overflow-y-auto bg-transparent">
        <div className="h-full p-4 lg:p-8 pt-16 lg:pt-8">{renderContent()}</div>
      </main>

      {/* خلفية الموبايل */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

export default App;
