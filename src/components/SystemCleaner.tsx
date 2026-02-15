import { useState, useEffect } from 'react';
import { Trash2, HardDrive, FileText, Globe, Image, RefreshCw, CheckSquare, Square, FolderOpen } from 'lucide-react';
// 👇 1. زدنا هاد Import
import LockScreen from './LockScreen';

// 👇 2. زدنا setActiveTab باش زر Renew يخدم
export default function SystemCleaner({ setActiveTab }: { setActiveTab: any }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanReport, setCleanReport] = useState<string | null>(null);

  // 👇 3. زدنا States ديال القفل
  const [isLocked, setIsLocked] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Categories Definition
  const categoriesConfig: any = {
    temp: { name: 'Temporary Files', icon: FolderOpen },
    winUpdate: { name: 'Windows Update Cache', icon: FileText },
    browser: { name: 'Browser Cache', icon: Globe },
    logs: { name: 'System Logs', icon: FileText },
    recycle: { name: 'Recycle Bin', icon: Trash2 },
    thumbnails: { name: 'Thumbnail Cache', icon: Image },
  };

  // 👇 4. التحقق من الاشتراك (Subscription Check)
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

  const startScan = async () => {
    if (isLocked) return; // 🔒 ممنوع
    setIsScanning(true);
    setCleanReport(null);
    if ((window as any).electronAPI) {
      setTimeout(async () => {
        const results = await (window as any).electronAPI.scanJunk();
        setScanResults(results);
        setSelectedItems(Object.keys(results));
        setIsScanning(false);
      }, 2000);
    } else {
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const toggleItem = (key: string) => {
    if (selectedItems.includes(key)) {
      setSelectedItems(selectedItems.filter(i => i !== key));
    } else {
      setSelectedItems([...selectedItems, key]);
    }
  };

  const toggleAll = () => {
    if (selectedItems.length === Object.keys(categoriesConfig).length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(Object.keys(categoriesConfig));
    }
  };

  const cleanSelected = async () => {
    if (isLocked) return; // 🔒 ممنوع
    if (selectedItems.length === 0) return;
    setIsCleaning(true);
    if ((window as any).electronAPI) {
      const mbFreed = await (window as any).electronAPI.cleanJunk(selectedItems);
      setTimeout(() => {
        setCleanReport(mbFreed);
        setScanResults(null);
        setIsCleaning(false);
      }, 2000);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes > 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const totalSize = scanResults
    ? selectedItems.reduce((acc, key) => acc + (scanResults[key]?.size || 0), 0)
    : 0;

  if (isLoadingStatus) return <div className="h-full flex items-center justify-center text-zinc-500">Checking...</div>;

  return (
    // 👇 5. الهيكل الجديد مع Overlay
    <div className="relative h-full overflow-hidden">

      {/* 🔒 OVERLAY (الطبقة ديال القفل) */}
      {isLocked && (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-500">
          <LockScreen onUnlock={() => setActiveTab('subscription')} />
        </div>
      )}

      {/* 🖥️ المحتوى الأصلي (مع Blur) */}
      <div className={`h-full flex flex-col items-center justify-center p-6 transition-all duration-500 ${isLocked ? 'blur-[2px] opacity-80 pointer-events-none' : ''}`}>

        {!scanResults && !cleanReport ? (
          // 1. SCAN SCREEN
          <div className="max-w-xl w-full text-center">
            <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-20 h-20 mb-6 text-yellow-400">
                <HardDrive className={`w-full h-full ${isScanning ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Scan for Junk Files</h2>
              <p className="text-zinc-500 mb-10 text-lg">Scan your system for temporary files, cache, and other unnecessary data</p>

              <button
                onClick={startScan}
                disabled={isScanning}
                className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl text-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-yellow-400/20"
              >
                {isScanning ? 'Scanning System...' : 'Start System Scan'}
              </button>
            </div>
          </div>
        ) : cleanReport ? (
          // 3. SUCCESS SCREEN
          <div className="max-w-md w-full text-center animate-in zoom-in duration-300">
            <div className="bg-zinc-900 border border-green-500/30 p-10 rounded-2xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Cleanup Complete</h2>
              <p className="text-zinc-400 mb-6">You recovered <span className="text-green-400 font-bold">{cleanReport} MB</span> of space.</p>
              <button onClick={() => setCleanReport(null)} className="text-sm text-zinc-500 hover:text-white underline">
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          // 2. RESULTS SCREEN
          <div className="w-full max-w-4xl flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Scan Results <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">{Object.keys(categoriesConfig).length} categories</span></h2>
              </div>
              <button onClick={toggleAll} className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider">
                {selectedItems.length === Object.keys(categoriesConfig).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {Object.entries(categoriesConfig).map(([key, conf]: [string, any]) => {
                const data = scanResults[key] || { size: 0, count: 0 };
                const isSelected = selectedItems.includes(key);

                return (
                  <div
                    key={key}
                    onClick={() => toggleItem(key)}
                    className={`group flex items-center justify-between p-5 rounded-xl border transition-all cursor-pointer ${isSelected
                      ? 'bg-zinc-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.05)]'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    <div className="flex items-center gap-5">
                      {/* Checkbox */}
                      <div className={`transition-colors ${isSelected ? 'text-yellow-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                        {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>

                      {/* Icon */}
                      <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
                        <conf.icon className="w-6 h-6" />
                      </div>

                      {/* Text */}
                      <div>
                        <h3 className="text-lg font-bold text-white">{conf.name}</h3>
                        <p className="text-sm text-zinc-500">{data.count} items</p>
                      </div>
                    </div>

                    {/* Size */}
                    <div className={`text-xl font-bold font-mono ${isSelected ? 'text-yellow-400' : 'text-zinc-500'}`}>
                      {formatSize(data.size)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Total Space to be Freed</p>
                <div className="text-4xl font-bold text-yellow-400">{formatSize(totalSize)}</div>
                <p className="text-xs text-zinc-600 mt-1">{selectedItems.length} of {Object.keys(categoriesConfig).length} categories selected</p>
              </div>

              <button
                onClick={cleanSelected}
                disabled={isCleaning || selectedItems.length === 0}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Cleaning...
                  </>
                ) : (
                  'Clean Selected'
                )}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}