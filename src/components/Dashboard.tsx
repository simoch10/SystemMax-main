import { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  ShieldCheck,
  ArrowDown,
  ArrowUp,
  Thermometer,
  CircuitBoard,
  Gauge as GaugeIcon,
} from 'lucide-react';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function StatCard({
  title,
  icon,
  accent = 'zinc',
  right,
  value,
  unit,
  barPct,
}: {
  title: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'purple' | 'green' | 'zinc';
  right?: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  barPct: number;
}) {
  const accentMap = {
    blue: {
      ring: 'hover:border-blue-500/30',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      iconText: 'text-blue-300',
      bar: 'bg-blue-500',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.10)]',
    },
    purple: {
      ring: 'hover:border-purple-500/30',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      iconText: 'text-purple-300',
      bar: 'bg-purple-500',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.10)]',
    },
    green: {
      ring: 'hover:border-green-500/30',
      iconBg: 'bg-green-500/10 border-green-500/20',
      iconText: 'text-green-300',
      bar: 'bg-green-500',
      glow: 'shadow-[0_0_30px_rgba(34,197,94,0.10)]',
    },
    zinc: {
      ring: 'hover:border-zinc-600/40',
      iconBg: 'bg-white/5 border-white/10',
      iconText: 'text-zinc-200',
      bar: 'bg-zinc-500',
      glow: '',
    },
  }[accent];

  return (
    <div
      className={[
        'flex-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md',
        'p-5 transition-all duration-300',
        'shadow-lg shadow-black/30',
        accentMap.ring,
        accentMap.glow,
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">
          <div className={['p-2 rounded-xl border', accentMap.iconBg].join(' ')}>
            <div className={accentMap.iconText}>{icon}</div>
          </div>
          {title}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-black text-white font-mono tracking-tight tabular-nums">
          {value}
        </span>
        {unit ? <span className="text-sm text-zinc-500 mb-1 font-bold">{unit}</span> : null}
      </div>

      <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
        <div
          className={['h-full rounded-full transition-all duration-500', accentMap.bar].join(' ')}
          style={{ width: `${clamp(barPct, 0, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sysData, setSysData] = useState({
    ramUsed: '0',
    ramTotal: '16',
    cpuUsage: '0',
    netDown: '0.00',
    netUp: '0.00',
    cpuTemp: '--',
    gpuTemp: '--',
  });

  const [healthScore, setHealthScore] = useState(100);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedSession, setOptimizedSession] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);

  useEffect(() => {
    if (isOptimizing || optimizedSession) return;
    const calculateScore = () => {
      let score = 100;

      const cpu = parseInt(sysData.cpuUsage) || 0;
      if (cpu > 80) score -= 20;
      else if (cpu > 50) score -= 10;

      const used = parseFloat(sysData.ramUsed) || 0;
      const total = parseFloat(sysData.ramTotal) || 16;
      const ramPercent = (used / total) * 100;
      if (ramPercent > 90) score -= 25;
      else if (ramPercent > 70) score -= 15;

      const temp = parseInt(sysData.cpuTemp);
      if (!isNaN(temp)) {
        if (temp > 90) score -= 40;
        else if (temp > 80) score -= 20;
        else if (temp > 70) score -= 10;
      }

      if (!autoOptimize) score -= 5;

      if (score < 10) score = 10;
      if (score > 100) score = 100;

      setHealthScore(score);
    };
    calculateScore();
  }, [sysData, isOptimizing, optimizedSession, autoOptimize]);

  const getScoreColor = () => {
    if (healthScore >= 80) return '#4ade80';
    if (healthScore >= 50) return '#facc15';
    return '#ef4444';
  };

  const getTempColor = (temp: string) => {
    if (temp === '--') return 'text-zinc-500';
    const t = parseInt(temp);
    if (t < 60) return 'text-green-400';
    if (t < 80) return 'text-yellow-400';
    return 'text-red-500 animate-pulse';
  };

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI) window.electronAPI.onSysData((data: any) => setSysData(data));
  }, []);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    // @ts-ignore
    if (window.electronAPI) await window.electronAPI.optimizeSystem();
    setTimeout(() => {
      setHealthScore(100);
      setOptimizedSession(true);
      setIsOptimizing(false);
      setTimeout(() => setOptimizedSession(false), 10000);
    }, 2000);
  };

  const ramUsed = parseFloat(sysData.ramUsed) || 0;
  const ramTotal = parseFloat(sysData.ramTotal) || 16;
  const ramPct = ramTotal ? (ramUsed / ramTotal) * 100 : 0;

  const cpuPct = parseInt(sysData.cpuUsage) || 0;

  const cpuTempNum = parseInt(sysData.cpuTemp);
  const gpuTempNum = parseInt(sysData.gpuTemp);

  // للعرض فقط: نخلي الحرارة كنسبة من 100°C
  const cpuTempBar = isNaN(cpuTempNum) ? 0 : clamp((cpuTempNum / 100) * 100, 0, 100);
  const gpuTempBar = isNaN(gpuTempNum) ? 0 : clamp((gpuTempNum / 100) * 100, 0, 100);

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 gap-6 bg-transparent overflow-hidden relative">
      {/* HEADER */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="group">
          <h1 className="text-3xl lg:text-4xl font-black text-white italic tracking-tight transition-colors group-hover:text-yellow-300">
            COMMAND CENTER
          </h1>
          <div className="h-1.5 w-28 bg-yellow-400 rounded-full mt-2 shadow-[0_0_18px_rgba(250,204,21,0.35)]" />
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
            Live telemetry, health score, and one-click optimization. Clean, fast, and focused.
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/30 flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-extrabold text-sm tracking-tight">Auto-Optimize</p>
            <p className="text-xs text-zinc-500">{autoOptimize ? 'Active' : 'Disabled'}</p>
          </div>

          <button
            onClick={() => setAutoOptimize(!autoOptimize)}
            className={[
              'w-14 h-8 rounded-full relative transition-all duration-300',
              autoOptimize
                ? 'bg-green-500/90 shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                : 'bg-white/10 border border-white/10',
            ].join(' ')}
            aria-label="Toggle auto optimize"
          >
            <div
              className={[
                'absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300',
                'bg-white shadow-md',
                autoOptimize ? 'translate-x-6' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* HERO */}
        <div className="col-span-12 lg:col-span-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 lg:p-8 shadow-2xl shadow-black/40 overflow-hidden relative">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-72 h-44 sm:w-80 sm:h-48 flex-shrink-0">
              <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 100 55">
                {/* Track */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Progress Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={getScoreColor()}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * healthScore) / 100}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 12px ${getScoreColor()})` }}
                />

                {/* Needle (قصّرناه شوية باش ما يجيش فوق الرقم) */}
                <g
                  className="transition-all duration-1000 ease-out"
                  style={{
                    transformOrigin: '50px 50px',
                    transform: `rotate(${healthScore * 1.8 - 90}deg)`,
                  }}
                >
                  <path
                    d="M 50 50 L 50 16"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="drop-shadow-lg"
                  />
                  <circle cx="50" cy="50" r="5" fill="white" className="shadow-xl" />
                </g>
              </svg>

              {/* Score Value (فوق السهم) */}
              <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 text-center z-20 pointer-events-none">
                <span className="text-6xl font-black text-white italic tracking-tight drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]">
                  {healthScore}
                  <span className="text-2xl ml-1">%</span>
                </span>
                <p className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-[0.35em] mt-2">
                  System Health
                </p>
              </div>
            </div>

            <div className="mt-14 text-center space-y-4 w-full max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">
                {healthScore >= 90 ? 'System Beast Mode' : 'Performance Draining'}
              </h2>

              <button
                onClick={handleOptimize}
                disabled={isOptimizing || healthScore === 100}
                className={[
                  'w-full py-4 rounded-2xl font-black text-lg uppercase italic transition-all duration-300',
                  'flex items-center justify-center gap-3',
                  'border border-white/10',
                  healthScore === 100
                    ? 'bg-white/[0.03] text-green-400 shadow-inner'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.35)] hover:scale-[1.02]',
                  isOptimizing ? 'opacity-90' : '',
                ].join(' ')}
              >
                {isOptimizing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                {isOptimizing
                  ? 'Optimizing...'
                  : healthScore === 100
                    ? 'System Optimized'
                    : 'Boost Performance'}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span>Tip: enable Auto-Optimize to keep score maxed.</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
          <StatCard
            title="CPU"
            accent="blue"
            icon={<Cpu className="w-5 h-5" />}
            right={
              <div className={['font-mono text-sm font-bold flex items-center gap-1', getTempColor(sysData.cpuTemp)].join(' ')}>
                <Thermometer className="w-4 h-4" /> {sysData.cpuTemp}°C
              </div>
            }
            value={`${sysData.cpuUsage}%`}
            barPct={cpuPct}
          />

          <StatCard
            title="GPU"
            accent="purple"
            icon={<CircuitBoard className="w-5 h-5" />}
            right={
              <div className={['font-mono text-sm font-bold flex items-center gap-1', getTempColor(sysData.gpuTemp)].join(' ')}>
                <Thermometer className="w-4 h-4" /> {sysData.gpuTemp}°C
              </div>
            }
            value={`${sysData.gpuTemp !== '--' ? sysData.gpuTemp : '0'}°`}
            barPct={gpuTempBar}
          />

          <StatCard
            title="RAM"
            accent="green"
            icon={<HardDrive className="w-5 h-5" />}
            right={<div className="text-zinc-500 font-mono text-xs">{sysData.ramTotal} GB</div>}
            value={sysData.ramUsed}
            unit="GB"
            barPct={ramPct}
          />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="min-h-[92px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex items-center gap-5 shadow-lg shadow-black/30 hover:border-green-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Activity className="w-7 h-7 text-green-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase font-extrabold tracking-[0.18em]">Network</p>
            <p className="text-xl font-black text-white italic tracking-tight">STABLE</p>
          </div>
        </div>

        <div className="min-h-[92px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex items-center gap-5 shadow-lg shadow-black/30 hover:border-yellow-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-yellow-300" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase font-extrabold tracking-[0.18em]">Protection</p>
            <p className="text-xl font-black text-white italic tracking-tight">ACTIVE</p>
          </div>
        </div>

        <div className="min-h-[92px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 flex items-center justify-between shadow-lg shadow-black/30 hover:border-blue-500/30 transition-all">
          <div className="grid grid-cols-2 gap-7">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-[0.18em] flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-cyan-400" /> Download
              </span>
              <span className="text-xl font-black text-white font-mono tabular-nums">
                {sysData.netDown} <span className="text-[10px] text-zinc-500">Mb/s</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-[0.18em] flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-purple-400" /> Upload
              </span>
              <span className="text-xl font-black text-white font-mono tabular-nums">
                {sysData.netUp} <span className="text-[10px] text-zinc-500">Mb/s</span>
              </span>
            </div>
          </div>

          <GaugeIcon className="w-9 h-9 text-blue-500/40 shrink-0" />
        </div>
      </div>
    </div>
  );
}
