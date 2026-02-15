import { useState, useEffect } from 'react';
import { Wifi, Gamepad2, AlertTriangle, RefreshCw, Server, Globe, ChevronRight, Search, Activity, ArrowDown, ArrowUp, RotateCw } from 'lucide-react';
// 👇 1. زدنا هاد Import
import LockScreen from './LockScreen';

// 👇 2. زدنا setActiveTab فالـ Props باش زر Renew يخدم
export default function NetworkTab({ setActiveTab }: { setActiveTab: any }) {
  const [activeDNS, setActiveDNS] = useState('Checking...');
  const [loadingDNS, setLoadingDNS] = useState<string | null>(null);
  const [boosterEnabled, setBoosterEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [selectedGame, setSelectedGame] = useState('lol');
  const [isGameTesting, setIsGameTesting] = useState(false);
  const [gamePings, setGamePings] = useState<Record<string, string>>({});

  const [isDnsTesting, setIsDnsTesting] = useState(false);
  const [dnsPings, setDnsPings] = useState<Record<string, string>>({});

  const [ipInfo, setIpInfo] = useState({ ip: '--', isp: 'Checking...', country: '' });
  const [netSpeed, setNetSpeed] = useState({ down: '0.00', up: '0.00' });

  // 👇 3. زدنا States ديال القفل
  const [isLocked, setIsLocked] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // --- DATABASE ---
  const gamesDatabase: any = {
    lol: {
      name: 'League of Legends',
      servers: [
        { id: 'lol_euw', name: 'EU West (Amsterdam)', region: 'Netherlands', ip: 'dynamodb.eu-west-1.amazonaws.com' },
        { id: 'lol_eune', name: 'EU Nordic & East', region: 'Frankfurt', ip: 'dynamodb.eu-central-1.amazonaws.com' },
        { id: 'lol_na', name: 'North America', region: 'Virginia', ip: 'dynamodb.us-east-1.amazonaws.com' },
        { id: 'lol_kr', name: 'Korea', region: 'Seoul', ip: 'dynamodb.ap-northeast-2.amazonaws.com' },
      ]
    },
    val: {
      name: 'Valorant',
      servers: [
        { id: 'val_eu', name: 'Europe (Frankfurt)', region: 'Germany', ip: 'dynamodb.eu-central-1.amazonaws.com' },
        { id: 'val_madrid', name: 'Europe (Madrid)', region: 'Spain', ip: 'dynamodb.eu-south-2.amazonaws.com' },
        { id: 'val_na', name: 'North America', region: 'US East', ip: 'dynamodb.us-east-1.amazonaws.com' },
        { id: 'val_latam', name: 'LATAM', region: 'Santiago', ip: 'dynamodb.sa-east-1.amazonaws.com' },
      ]
    },
    cod: {
      name: 'Call of Duty (MW3/WZ)',
      servers: [
        { id: 'cod_eu', name: 'Europe', region: 'Frankfurt', ip: 's3.eu-central-1.amazonaws.com' },
        { id: 'cod_na', name: 'North America', region: 'US East', ip: 's3.us-east-1.amazonaws.com' },
        { id: 'cod_asia', name: 'Asia', region: 'Singapore', ip: 's3.ap-southeast-1.amazonaws.com' },
      ]
    },
    apex: {
      name: 'Apex Legends',
      servers: [
        { id: 'apex_eu', name: 'Europe', region: 'Belgium', ip: 'storage.googleapis.com' },
        { id: 'apex_na', name: 'North America', region: 'Iowa', ip: 'us-central1-gce.cloud.google.com' },
      ]
    },
    cs2: {
      name: 'Counter-Strike 2',
      servers: [
        { id: 'cs_eu_w', name: 'EU West', region: 'Luxembourg', ip: 'dynamodb.eu-west-1.amazonaws.com' },
        { id: 'cs_eu_e', name: 'EU East', region: 'Vienna', ip: 'dynamodb.eu-central-1.amazonaws.com' },
        { id: 'cs_us', name: 'US East', region: 'New York', ip: 'dynamodb.us-east-1.amazonaws.com' },
      ]
    },
    fort: {
      name: 'Fortnite',
      servers: [
        { id: 'fn_eu', name: 'Europe', region: 'London', ip: 'dynamodb.eu-west-2.amazonaws.com' },
        { id: 'fn_eu_fr', name: 'Europe', region: 'Paris', ip: 'dynamodb.eu-west-3.amazonaws.com' },
        { id: 'fn_na', name: 'NA East', region: 'Virginia', ip: 'dynamodb.us-east-1.amazonaws.com' },
      ]
    },
    r6: {
      name: 'Rainbow Six Siege',
      servers: [
        { id: 'r6_eu', name: 'Europe', region: 'Netherlands', ip: 'westeurope.blob.core.windows.net' },
        { id: 'r6_na', name: 'North America', region: 'US East', ip: 'eastus.blob.core.windows.net' },
      ]
    },
    ow2: {
      name: 'Overwatch 2',
      servers: [
        { id: 'ow_eu', name: 'Europe', region: 'Amsterdam', ip: 'storage.googleapis.com' },
        { id: 'ow_na', name: 'North America', region: 'Chicago', ip: 'us-central1-gce.cloud.google.com' },
      ]
    },
    arc: {
      name: 'ARC Raiders / The Finals',
      servers: [
        { id: 'arc_eu', name: 'Europe', region: 'Frankfurt', ip: 'europe-west3-gce.cloud.google.com' },
        { id: 'arc_na', name: 'North America', region: 'US East', ip: 'us-east1-gce.cloud.google.com' },
      ]
    },
    pubg: {
      name: 'PUBG: Battlegrounds',
      servers: [
        { id: 'pubg_eu', name: 'Europe', region: 'Frankfurt', ip: 'dynamodb.eu-central-1.amazonaws.com' },
        { id: 'pubg_na', name: 'North America', region: 'Ohio', ip: 'dynamodb.us-east-2.amazonaws.com' },
      ]
    },
    gta: {
      name: 'GTA Online',
      servers: [
        { id: 'gta_auth', name: 'Rockstar Services', region: 'US East', ip: 'prod.ros.rockstargames.com' },
        { id: 'gta_eu', name: 'Europe Relay', region: 'Frankfurt', ip: 's3.eu-central-1.amazonaws.com' },
      ]
    }
  };

  const dnsOptions = [
    { id: 'Automatic', name: 'Automatic', sub: 'Default ISP', ip: null, secondary: null },
    { id: 'Google', name: 'Google DNS', sub: '8.8.8.8', ip: '8.8.8.8', secondary: '8.8.4.4' },
    { id: 'Cloudflare', name: 'Cloudflare', sub: '1.1.1.1', ip: '1.1.1.1', secondary: '1.0.0.1' },
    { id: 'OpenDNS', name: 'OpenDNS', sub: '208.67.222.222', ip: '208.67.222.222', secondary: '208.67.220.220' },
  ];

  const checkCurrentDNS = async () => {
    if ((window as any).electronAPI) {
      const currentIPs = await (window as any).electronAPI.getCurrentDns();
      if (currentIPs.includes('8.8.8.8') || currentIPs.includes('8.8.4.4')) {
        setActiveDNS('Google');
      } else if (currentIPs.includes('1.1.1.1') || currentIPs.includes('1.0.0.1')) {
        setActiveDNS('Cloudflare');
      } else if (currentIPs.includes('208.67.222.222')) {
        setActiveDNS('OpenDNS');
      } else {
        setActiveDNS('Automatic');
      }
    }
  };

  useEffect(() => {
    // 👇 4. التحقق من الاشتراك (Subscription Check)
    const checkStatus = async () => {
      if ((window as any).electronAPI) {
        try {
          const result = await (window as any).electronAPI.getSubscriptionStatus();
          if (result.status === 'expired') setIsLocked(true);
        } catch (e) { console.error(e); }
      }
      setIsLoadingStatus(false);
    };
    checkStatus();

    // تشغيل باقي الأمور فقط إذا لم يكن مقفولاً (أو في الخلفية)
    runDnsPingTest();
    checkCurrentDNS();

    if ((window as any).electronAPI) {
      (window as any).electronAPI.getIpInfo().then((info: any) => {
        setIpInfo(info);
      });

      (window as any).electronAPI.onSysData((data: any) => {
        if (data.netDown) {
          setNetSpeed({ down: data.netDown, up: data.netUp });
        }
      });
    }
  }, []);

  const runDnsPingTest = async () => {
    if (isLocked) return; // 🔒 ممنوع إيلا كان مسالي
    setIsDnsTesting(true);
    if ((window as any).electronAPI) {
      for (const dns of dnsOptions) {
        if (dns.ip) {
          setDnsPings(prev => ({ ...prev, [dns.id]: '...' }));
          const result = await (window as any).electronAPI.checkPing(dns.ip);
          setDnsPings(prev => ({ ...prev, [dns.id]: result }));
        }
      }
    }
    setIsDnsTesting(false);
  };

  const runGamePingTest = async () => {
    if (isLocked) return; // 🔒 ممنوع
    setIsGameTesting(true);
    const serversToTest = gamesDatabase[selectedGame].servers;
    const resetObj: Record<string, string> = {};
    serversToTest.forEach((s: any) => resetObj[s.id] = '...');
    setGamePings(prev => ({ ...prev, ...resetObj }));

    if ((window as any).electronAPI) {
      for (const server of serversToTest) {
        const result = await (window as any).electronAPI.checkPing(server.ip);
        setGamePings(prev => ({ ...prev, [server.id]: result }));
      }
    }
    setIsGameTesting(false);
  };

  const handleApplyDNS = async (dns: any) => {
    if (isLocked) return; // 🔒 ممنوع
    setLoadingDNS(dns.id);
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.setDns({
        id: dns.id,
        name: dns.name,
        primary: dns.ip,
        secondary: dns.secondary
      });
      setTimeout(checkCurrentDNS, 1500);
    }
    setActiveDNS(dns.id);
    setLoadingDNS(null);
  };

  const toggleBooster = async () => {
    if (isLocked) return; // 🔒 ممنوع
    const newState = !boosterEnabled;
    if ((window as any).electronAPI) await (window as any).electronAPI.toggleBooster(newState);
    setBoosterEnabled(newState);
  };

  const handleNetworkReset = async () => {
    if (isLocked) return; // 🔒 ممنوع
    if (!confirm("Internet connection will be reset. Continue?")) return;
    setIsResetting(true);
    if ((window as any).electronAPI) await (window as any).electronAPI.resetNetwork();
    setIsResetting(false);
  };

  if (isLoadingStatus) return <div className="h-full flex items-center justify-center text-zinc-500">Checking...</div>;

  return (
    // 👇 5. هيكل جديد باش نحطو الـ Overlay
    <div className="relative h-full overflow-hidden">

      {/* 🔒 OVERLAY (الطبقة ديال القفل) */}
      {isLocked && (
        <div className="absolute inset-0 z-50 animate-in fade-in duration-500">
          <LockScreen onUnlock={() => setActiveTab('subscription')} />
        </div>
      )}

      {/* 🖥️ المحتوى الأصلي ديالك (غير زدنا عليه الـ Blur فالـ Class) */}
      <div className={`space-y-6 h-full pb-6 overflow-y-auto pr-2 transition-all duration-500 ${isLocked ? 'blur-[2px] opacity-80 pointer-events-none' : ''}`}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400">Network & Gaming</h2>
            <p className="text-zinc-500 mt-1">Global Latency Test & Optimization</p>
          </div>
          <button
            onClick={handleNetworkReset}
            disabled={isResetting}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-wide"
          >
            {isResetting ? <RotateCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {isResetting ? 'Resetting...' : 'Reset Network Stack'}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Game Selector */}
          <div className="w-full md:w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Search className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Select Game</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 max-h-[450px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="p-2 flex flex-col gap-1">
                {Object.entries(gamesDatabase).map(([key, game]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedGame(key); setGamePings({}); }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all group ${selectedGame === key ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Gamepad2 className={`w-5 h-5 ${selectedGame === key ? 'text-black' : 'text-zinc-500 group-hover:text-white'}`} />
                      <span className="text-sm">{game.name}</span>
                    </div>
                    {selectedGame === key && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Server List */}
          <div className="flex-1 p-6 bg-zinc-900/30 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">{gamesDatabase[selectedGame].name}</h3>
                  <p className="text-zinc-500 text-sm">Real-time Cloud Latency (TCP)</p>
                </div>
              </div>
              <button
                onClick={runGamePingTest}
                disabled={isGameTesting}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-all font-bold text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isGameTesting ? 'animate-spin text-yellow-400' : 'text-zinc-400'}`} />
                {isGameTesting ? 'Testing...' : 'Test Servers'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {gamesDatabase[selectedGame].servers.map((server: any) => {
                const ping = gamePings[server.id];
                const pingNum = Number(ping);
                let colorClass = 'text-zinc-500';
                let barColor = 'bg-zinc-800';
                let width = '0%';
                if (ping && ping !== '...' && ping !== '999') {
                  if (pingNum < 60) { colorClass = 'text-green-400'; barColor = 'bg-green-500'; width = '90%'; }
                  else if (pingNum < 150) { colorClass = 'text-yellow-400'; barColor = 'bg-yellow-500'; width = '60%'; }
                  else { colorClass = 'text-red-400'; barColor = 'bg-red-500'; width = '30%'; }
                }
                return (
                  <div key={server.id} className="flex items-center justify-between p-4 bg-zinc-800/40 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-4 w-1/3">
                      <img
                        src={`https://flagcdn.com/24x18/${server.id.includes('eu') ? 'eu' : server.id.includes('na') || server.id.includes('us') ? 'us' : server.id.includes('kr') ? 'kr' : server.id.includes('br') ? 'br' : server.id.includes('jp') ? 'jp' : server.id.includes('sg') ? 'sg' : 'un'
                          }.png`}
                        className="rounded-sm opacity-80"
                        alt="flag"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{server.name}</h4>
                        <p className="text-xs text-zinc-500">{server.region}</p>
                      </div>
                    </div>
                    <div className="hidden md:block flex-1 mx-6 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: ping && ping !== '...' ? width : '0%' }}></div>
                    </div>
                    <div className="w-24 text-right">
                      <span className={`font-mono font-bold text-xl ${colorClass}`}>{ping || '--'}</span>
                      <span className="text-xs text-zinc-600 ml-1">ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-yellow-400" /> DNS Switcher
              </h3>
              <button onClick={runDnsPingTest} disabled={isDnsTesting} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${isDnsTesting ? 'animate-spin' : ''}`} /> Refresh Ping
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dnsOptions.map((dns: any) => (
                <button
                  key={dns.id}
                  onClick={() => handleApplyDNS(dns)}
                  disabled={loadingDNS === dns.id || activeDNS === dns.id}
                  className={`p-3 rounded-lg border text-left transition-all ${activeDNS === dns.id ? 'bg-zinc-800/80 border-green-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`font-bold text-sm ${activeDNS === dns.id ? 'text-green-400' : 'text-white'}`}>{dns.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">{dns.sub}</span>
                        {dnsPings[dns.id] && dns.ip && (
                          <span className={`text-xs font-mono font-bold ${Number(dnsPings[dns.id]) < 50 ? 'text-green-400' : 'text-orange-400'}`}>
                            • {dnsPings[dns.id]} ms
                          </span>
                        )}
                      </div>
                    </div>
                    {activeDNS === dns.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    {loadingDNS === dns.id && <RotateCw className="w-3 h-3 animate-spin text-zinc-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${boosterEnabled ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Wifi className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Internet Booster</h3>
                  <p className="text-xs text-zinc-500">Global TCP Optimization</p>
                </div>
              </div>
              <button
                onClick={toggleBooster}
                className={`w-14 h-8 rounded-full transition-colors relative ${boosterEnabled ? 'bg-yellow-400' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${boosterEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            {boosterEnabled && (
              <div className="text-xs text-yellow-400/80 bg-yellow-400/10 p-3 rounded border border-yellow-400/20">
                ✓ Windows Network Throttling Disabled<br />
                ✓ TCPIP Parameters Optimized
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            Active Connection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <p className="text-zinc-500 text-sm mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <div>
                  <p className="text-white font-bold text-sm">{ipInfo.isp !== 'Checking...' ? 'Connected' : 'Scanning...'}</p>
                  <p className="text-xs text-zinc-400">{ipInfo.isp} ({ipInfo.ip})</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <p className="text-zinc-500 text-sm mb-1">Download (Real-time)</p>
              <p className="text-white font-bold flex items-center gap-2 text-lg">
                <ArrowDown className="w-4 h-4 text-cyan-400" />
                {netSpeed.down} Mbps
              </p>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <p className="text-zinc-500 text-sm mb-1">Upload (Real-time)</p>
              <p className="text-white font-bold flex items-center gap-2 text-lg">
                <ArrowUp className="w-4 h-4 text-purple-400" />
                {netSpeed.up} Mbps
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}