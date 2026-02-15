import { useState, useEffect } from 'react';
import { Zap, Activity, Gauge, Trash2, RefreshCw, Layers, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LockScreen from './LockScreen';

export default function GamingMode({ setActiveTab }: { setActiveTab: any }) {
  // --- States ---
  const [isGaming, setIsGaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Data & Sorting
  const [processes, setProcesses] = useState<any[]>([]);
  const [loadingProcs, setLoadingProcs] = useState(false);
  const [totalRamFreed, setTotalRamFreed] = useState(0);
  const [totalCpuFreed, setTotalCpuFreed] = useState(0);

  // Sort State
  const [sortBy, setSortBy] = useState<'cpu' | 'mem'>('mem');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- 1. Check Subscription ---
  useEffect(() => {
    const checkStatus = async () => {
      // @ts-ignore
      if (window.electronAPI) {
        try {
          // @ts-ignore
          const result = await window.electronAPI.getSubscriptionStatus();
          if (result.status === 'expired') setIsLocked(true);
        } catch (e) { console.error(e); }
      }
      setIsLoadingStatus(false);
    };
    checkStatus();
  }, []);

  // --- 2. Fetch Processes ---
  const fetchProcesses = async () => {
    if (isLocked) return;
    setLoadingProcs(true);
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      const list = await window.electronAPI.getProcesses();
      setProcesses(list);

      // @ts-ignore
      const totalMem = list.reduce((acc, p) => acc + parseFloat(p.mem), 0);
      // @ts-ignore
      const totalCpu = list.reduce((acc, p) => acc + parseFloat(p.cpu), 0);
      setTotalRamFreed(totalMem);
      setTotalCpuFreed(totalCpu);
    }
    setLoadingProcs(false);
  };

  // --- 3. Sorting Logic ---
  const handleSort = (column: 'cpu' | 'mem') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedProcesses = [...processes].sort((a, b) => {
    const valA = parseFloat(a[sortBy]);
    const valB = parseFloat(b[sortBy]);
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const killApp = async (pid: number) => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      await window.electronAPI.killProcess(pid);
      fetchProcesses();
    }
  };

  const toggleGamingMode = async () => {
    if (isLocked) return;
    setLoading(true);
    const newState = !isGaming;
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      await window.electronAPI.setGamingMode(newState);
      setTimeout(() => { setIsGaming(newState); setLoading(false); }, 1000);
    } else {
      setTimeout(() => { setIsGaming(newState); setLoading(false); }, 1000);
    }
  };

  useEffect(() => {
    if (!isLocked && !isLoadingStatus) {
      fetchProcesses();
      const interval = setInterval(fetchProcesses, 5000);
      return () => clearInterval(interval);
    }
  }, [isLocked, isLoadingStatus]);

  if (isLoadingStatus) return <div className="h-full flex items-center justify-center text-zinc-500">Checking access...</div>;

  return (
    <div className="relative h-full flex flex-col overflow-hidden">

      {/* 🔒 OVERLAY (خففنا الضباب بزاف) */}
      {isLocked && (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-500">
          <LockScreen onUnlock={() => setActiveTab('subscription')} />
        </div>
      )}

      {/* 🖥️ المحتوى (Main Content) */}
      <div className={`flex flex-col h-full gap-4 transition-all duration-500 ${isLocked ? 'blur-[2px] opacity-80 pointer-events-none' : ''}`}>

        {/* ROW 1: Summary + Power Plan (حدا بعضياتهم) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">

          {/* Card 1: Summary (Takes 2/3 width) */}
          <div className="lg:col-span-2 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-5 flex items-center justify-between relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Performance Summary
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                {isGaming ? 'Ultimate Performance Active' : 'Balanced Mode'}
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">+{isLocked ? '24' : Math.floor(totalRamFreed * 1.5)}%</p>
                <p className="text-[10px] text-zinc-500 uppercase">Boost</p>
              </div>
              <div className={`p-3 rounded-full ${isGaming ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700/50 text-zinc-500'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            {isGaming && <div className="absolute inset-0 bg-green-500/5 animate-pulse" />}
          </div>

          {/* Card 2: Power Plan (Takes 1/3 width) */}
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center items-start shadow-md relative">
            <div className="flex justify-between w-full items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> Power Plan
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Max FPS Mode</p>
              </div>
              <button
                onClick={toggleGamingMode}
                disabled={loading}
                className={`w-10 h-6 rounded-full transition-all duration-300 relative ${isGaming ? 'bg-yellow-400' : 'bg-zinc-700 hover:bg-zinc-600'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isGaming ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            {isGaming && (
              <div className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Active
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Process Killer Table (ياخد الطول المتبقي كامل) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-md flex-1 min-h-0">
          {/* Table Header (Fixed) */}
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-400" /> High Resource Processes
              </h3>
            </div>
            <button onClick={fetchProcesses} className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors group">
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white ${loadingProcs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900/50 border-b border-zinc-800/50 shrink-0">
            <div className="col-span-6">App Name</div>
            <div className="col-span-2 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('cpu')}>
              CPU {sortBy === 'cpu' && (sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
            </div>
            <div className="col-span-3 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('mem')}>
              RAM {sortBy === 'mem' && (sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Scrollable Body (هنا فين كاين السكرول بوحدو) */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent bg-zinc-900/30">
            {isLocked ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-b border-zinc-800/30 opacity-70">
                  <div className="col-span-6 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-800 animate-pulse"></div>
                    <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                  <div className="col-span-2 text-right"><div className="w-8 h-3 bg-zinc-800 rounded inline-block"></div></div>
                  <div className="col-span-3 text-right"><div className="w-12 h-3 bg-zinc-800 rounded inline-block"></div></div>
                </div>
              ))
            ) : sortedProcesses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Activity className="w-8 h-8 opacity-20" />
                <span>System Optimized.</span>
              </div>
            ) : (
              sortedProcesses.map((proc: any) => (
                <div key={proc.pid} className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-b border-zinc-800/30 hover:bg-zinc-800/50 transition-colors group">
                  <div className="col-span-6 flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-800 rounded text-zinc-400 group-hover:text-yellow-400 group-hover:bg-zinc-700 transition-colors">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate" title={proc.name}>{proc.name}</span>
                  </div>
                  <div className={`col-span-2 text-right text-xs font-mono ${parseFloat(proc.cpu) > 10 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {proc.cpu}%
                  </div>
                  <div className={`col-span-3 text-right text-xs font-mono ${parseFloat(proc.mem) > 500 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    {proc.mem} MB
                  </div>
                  <div className="col-span-1 text-right flex justify-end">
                    <button
                      onClick={() => killApp(proc.pid)}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Kill Process"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}