require('dotenv').config({
    path: require('path').join(
        require('electron').app.isPackaged
            ? process.resourcesPath
            : __dirname,
        '.env'
    )
});

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const si = require('systeminformation');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');
const { createClient } = require('@supabase/supabase-js');
const { autoUpdater } = require('electron-updater');

let tray = null;
let mainWindow = null;
let isQuiting = false;

/* =========================================================
   EARLY BOOT FIXES
========================================================= */

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        try {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
            }
        } catch (_) { }
    });
}

const APP_NAME = 'SystemMax Optimizer';
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const localUserData = path.join(localAppData, APP_NAME);

try { app.setPath('userData', localUserData); } catch (_) { }

const cacheDir = path.join(localUserData, 'Cache');
const gpuCacheDir = path.join(localUserData, 'GPUCache');
try { fs.mkdirSync(cacheDir, { recursive: true }); } catch (_) { }
try { fs.mkdirSync(gpuCacheDir, { recursive: true }); } catch (_) { }

try { app.setPath('cache', cacheDir); } catch (_) { }
app.commandLine.appendSwitch('disk-cache-dir', cacheDir);
app.commandLine.appendSwitch('gpu-disk-cache-dir', gpuCacheDir);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('in-process-gpu');

// --- 🧾 Logger ---
function logToFile(...args) {
    try {
        const logPath = path.join(app.getPath('userData'), 'systemmax.log');
        const line = `[${new Date().toISOString()}] ${args
            .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
            .join(' ')}\n`;
        fs.appendFileSync(logPath, line);
    } catch (e) { }
}

process.on('uncaughtException', (err) => { logToFile('uncaughtException:', String(err?.stack || err)); });
process.on('unhandledRejection', (err) => { logToFile('unhandledRejection:', String(err?.stack || err)); });

logToFile('BOOT', {
    isPackaged: app.isPackaged,
    execPath: process.execPath,
    userData: (() => { try { return app.getPath('userData'); } catch { return 'n/a'; } })(),
    resourcesPath: process.resourcesPath
});

// --- 🌐 SUPABASE — Issue 3: env variables ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logToFile('WARNING: Supabase env vars missing! Check .env file.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// --- Path helper ---
function getAssetPath(...p) {
    return app.isPackaged ? path.join(process.resourcesPath, ...p) : path.join(__dirname, ...p);
}

// --- Updater ---
function sendUpdate(channel, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function setupAutoUpdater() {
    if (!app.isPackaged) return;
    autoUpdater.autoDownload = false;
    autoUpdater.on('checking-for-update', () => sendUpdate('update:checking'));
    autoUpdater.on('update-available', (info) => sendUpdate('update:available', info));
    autoUpdater.on('update-not-available', (info) => sendUpdate('update:none', info));
    autoUpdater.on('download-progress', (p) => sendUpdate('update:progress', p));
    autoUpdater.on('update-downloaded', (info) => sendUpdate('update:downloaded', info));
    autoUpdater.on('error', (err) => sendUpdate('update:error', String(err)));
}

const PLAN_DURATIONS = {
    '1 Month': 30,
    '3 Months': 90,
    '6 Months': 180,
    '12 Months': 365,
    'Premium': 9999
};

const getHWID = async () => {
    try {
        const uuidData = await si.uuid();
        return uuidData.os || os.hostname();
    } catch (e) {
        return os.hostname();
    }
};

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'sys-config.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) { }
    const initialConfig = {
        installDate: Date.now(),
        licenseKey: null,
        plan: null,
        activationDate: null,
        hardwareId: os.hostname()
    };
    saveConfig(initialConfig);
    return initialConfig;
}

function saveConfig(config) {
    try { fs.writeFileSync(configPath, JSON.stringify(config)); } catch (e) { }
}

const getDirInfo = (dirPath) => {
    let size = 0, count = 0;
    try {
        if (!fs.existsSync(dirPath)) return { size: 0, count: 0 };
        fs.readdirSync(dirPath).forEach(file => {
            const filePath = path.join(dirPath, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    const sub = getDirInfo(filePath);
                    size += sub.size; count += sub.count;
                } else { size += stats.size; count++; }
            } catch (e) { }
        });
    } catch (e) { }
    return { size, count };
};

const clearDir = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) return;
        fs.readdirSync(dirPath).forEach(file => {
            const curPath = path.join(dirPath, file);
            try {
                if (fs.lstatSync(curPath).isDirectory()) fs.rmSync(curPath, { recursive: true, force: true });
                else fs.unlinkSync(curPath);
            } catch (e) { }
        });
    } catch (e) { }
};

function createWindow() {
    const iconPath = getAssetPath('resources', 'icon.ico');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        icon: iconPath
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (isMainFrame) logToFile('did-fail-load:', { errorCode, errorDescription, validatedURL });
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
        logToFile('render-process-gone:', details);
    });

    if (app.isPackaged) {
        const indexPath = getAssetPath('dist', 'index.html');
        const indexURL = pathToFileURL(indexPath).toString();
        logToFile('indexURL=', indexURL, 'exists=', fs.existsSync(indexPath));
        mainWindow.loadURL(indexURL).catch((e) => logToFile('loadURL error:', String(e)));
    } else {
        mainWindow.loadURL('http://localhost:5173').catch((e) => logToFile('loadURL error:', String(e)));
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('close', function (event) {
        if (!isQuiting) { event.preventDefault(); mainWindow.hide(); return false; }
    });

    // ==========================================
    // IPC HANDLERS
    // ==========================================

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('check-update', async () => {
        if (!app.isPackaged) return { status: 'dev', message: 'Updates work only in packaged build.' };
        return new Promise(async (resolve) => {
            const cleanup = () => {
                autoUpdater.removeListener('update-available', onAvailable);
                autoUpdater.removeListener('update-not-available', onNone);
                autoUpdater.removeListener('error', onError);
            };
            const onAvailable = (info) => { cleanup(); resolve({ status: 'update_available', message: `Version ${info?.version || 'new'} is available!` }); };
            const onNone = () => { cleanup(); resolve({ status: 'latest', message: 'You are on the latest version.' }); };
            const onError = (err) => { cleanup(); resolve({ status: 'error', message: String(err) }); };
            autoUpdater.on('update-available', onAvailable);
            autoUpdater.on('update-not-available', onNone);
            autoUpdater.on('error', onError);
            try { await autoUpdater.checkForUpdates(); } catch (e) { onError(e); }
        });
    });

    ipcMain.handle('download-update', async () => {
        if (!app.isPackaged) return { status: 'dev' };
        await autoUpdater.downloadUpdate();
        return { status: 'downloading' };
    });

    ipcMain.handle('install-update', async () => {
        if (!app.isPackaged) return { status: 'dev' };
        autoUpdater.quitAndInstall();
        return { status: 'installing' };
    });

    // --- 🔥 SUBSCRIPTION — Issue 2: Trial fix ---
    ipcMain.handle('get-subscription-status', async () => {
        const config = loadConfig();
        const hwid = await getHWID();

        // Paid license check
        if (config.licenseKey && config.plan) {
            try {
                const { data, error } = await supabase
                    .from('licenses')
                    .select('activated_at, status')
                    .eq('key', config.licenseKey)
                    .single();

                if (data && !error) {
                    if (data.status !== 'active') return { status: 'expired', daysLeft: 0, plan: 'License Revoked' };
                    if (data.activated_at) { config.activationDate = data.activated_at; saveConfig(config); }
                }
            } catch (e) { }

            if (config.activationDate) {
                const startDate = new Date(config.activationDate).getTime();
                const durationDays = PLAN_DURATIONS[config.plan] || 30;
                const expiryDate = startDate + durationDays * 24 * 60 * 60 * 1000;
                const now = Date.now();
                if (now > expiryDate) return { status: 'expired', daysLeft: 0, plan: `${config.plan} (Expired)` };
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                return { status: 'pro', daysLeft, plan: config.plan };
            }
            return { status: 'pro', daysLeft: 'Unlimited', plan: config.plan };
        }

        // ✅ Issue 2 Fix: get OLDEST trial row only (no duplicates)
        const { data: trials } = await supabase
            .from('trials')
            .select('*')
            .eq('hwid', hwid)
            .order('created_at', { ascending: true })
            .limit(1);

        let trial = trials && trials.length > 0 ? trials[0] : null;

        // Insert only if no record exists at all
        if (!trial) {
            const { data: newTrial } = await supabase
                .from('trials')
                .insert({ hwid })
                .select()
                .single();
            trial = newTrial;
        }

        const installDate = trial
            ? new Date(trial.created_at).getTime()
            : config.installDate;

        const diffDays = Math.floor((Date.now() - installDate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) return { status: 'expired', daysLeft: 0, plan: 'Trial Expired' };
        return { status: 'trial', daysLeft: 7 - diffDays, plan: 'Free Trial' };
    });

    ipcMain.handle('activate-license', async (event, key) => {
        try {
            if (!key || key.length < 8) return { success: false, error: 'Invalid Format' };
            const hwid = await getHWID();
            const { data: license, error } = await supabase.from('licenses').select('*').eq('key', key).single();
            if (error || !license) return { success: false, error: 'Key not found' };
            if (license.hwid && license.hwid !== hwid) return { success: false, error: 'Used on another PC' };

            const nowISO = new Date().toISOString();
            if (!license.hwid) {
                const { error: updateError } = await supabase
                    .from('licenses')
                    .update({ hwid, status: 'active', activated_at: nowISO })
                    .eq('key', key);
                if (updateError) return { success: false, error: 'Activation failed' };
            }

            const config = loadConfig();
            config.licenseKey = key;
            config.plan = license.plan || 'Premium';
            config.activationDate = license.activated_at || nowISO;
            saveConfig(config);
            return { success: true };
        } catch (e) {
            return { success: false, error: 'Connection Error' };
        }
    });

    ipcMain.handle('remove-license', async () => {
        const config = loadConfig();
        config.licenseKey = null; config.plan = null; config.activationDate = null;
        saveConfig(config);
        return { success: true };
    });

    // --- LIVE STATS ---
    setInterval(async () => {
        try {
            const mem = await si.mem();
            const cpu = await si.currentLoad();
            const netStats = await si.networkStats();
            const cpuTempData = await si.cpuTemperature();
            const graphicsData = await si.graphics();

            const rx = netStats.reduce((acc, iface) => acc + iface.rx_sec, 0);
            const tx = netStats.reduce((acc, iface) => acc + iface.tx_sec, 0);

            const ramUsed = (mem.active / 1024 / 1024 / 1024).toFixed(1);
            const ramTotal = (mem.total / 1024 / 1024 / 1024).toFixed(0);
            const cpuUsage = cpu.currentLoad.toFixed(0);
            const netDown = ((rx * 8) / 1000 / 1000).toFixed(2);
            const netUp = ((tx * 8) / 1000 / 1000).toFixed(2);
            const cpuTemp = cpuTempData?.main ? cpuTempData.main.toFixed(0) : '--';

            let gpuTemp = '--';
            if (graphicsData?.controllers?.length > 0) {
                const g = graphicsData.controllers.find(c => c.temperatureGpu);
                if (g) gpuTemp = g.temperatureGpu.toFixed(0);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('sys-data', { ramUsed, ramTotal, cpuUsage, netDown, netUp, cpuTemp, gpuTemp });
            }

            if (tray) {
                tray.setToolTip(
                    `🚀 SystemMax Optimizer
━━━━━━━━━━━━━━━━━
⚡ CPU : ${cpuUsage}% (${cpuTemp}°C)
🎮 GPU : ${gpuTemp}°C
🧠 RAM : ${ramUsed} / ${ramTotal} GB
⬇️ DL  : ${netDown} Mb/s
⬆️ UP  : ${netUp} Mb/s
━━━━━━━━━━━━━━━━━`
                );
            }
        } catch (e) { logToFile('Stats Error:', String(e?.stack || e)); }
    }, 2000);

    // --- NETWORK ---
    ipcMain.handle('check-ping', async (event, host) => {
        return new Promise((resolve) => {
            if (!host) return resolve('--');
            const start = Date.now();
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.connect(443, host, () => { resolve((Date.now() - start).toString()); socket.destroy(); });
            socket.on('error', () => {
                const s80 = new net.Socket(); const s80start = Date.now(); s80.setTimeout(1000);
                s80.connect(80, host, () => { resolve((Date.now() - s80start).toString()); s80.destroy(); });
                s80.on('error', () => { resolve('999'); s80.destroy(); });
                s80.on('timeout', () => { resolve('999'); s80.destroy(); });
            });
            socket.on('timeout', () => { resolve('999'); socket.destroy(); });
        });
    });

    ipcMain.handle('set-dns', async (event, dnsData) => {
        const psCommand = dnsData.id === 'Automatic'
            ? `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Set-DnsClientServerAddress -ResetServerAddresses`
            : `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Set-DnsClientServerAddress -ServerAddresses "${dnsData.primary}","${dnsData.secondary}"`;
        return new Promise(resolve => exec(`powershell -Command "${psCommand}"`, (e) => resolve(e ? 'Failed' : 'Success')));
    });

    ipcMain.handle('get-current-dns', async () => {
        const psCommand = `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses`;
        return new Promise(resolve => exec(`powershell -Command "${psCommand}"`, (e, stdout) => resolve(e ? [] : stdout.trim().split(/\s+/))));
    });

    ipcMain.handle('get-ip-info', async () => {
        try {
            const response = await fetch('http://ip-api.com/json');
            const data = await response.json();
            return { ip: data.query, isp: data.isp, country: data.countryCode };
        } catch (e) { return { ip: 'Unknown', isp: 'Unknown', country: '--' }; }
    });

    ipcMain.handle('toggle-booster', async (event, enabled) => {
        const commands = enabled
            ? ['netsh int tcp set global autotuninglevel=normal', 'netsh int tcp set global rss=enabled']
            : ['netsh int tcp set global autotuninglevel=disabled', 'netsh int tcp set global rss=default'];
        for (const cmd of commands) await new Promise(resolve => exec(cmd, resolve));
        return enabled;
    });

    ipcMain.handle('reset-network', async () => {
        const cmds = ['netsh winsock reset', 'netsh int ip reset', 'ipconfig /release', 'ipconfig /renew', 'ipconfig /flushdns'];
        try { for (const cmd of cmds) await new Promise(resolve => exec(cmd, resolve)); return 'Success'; }
        catch (e) { return 'Error'; }
    });

    // --- GAMING ---
    ipcMain.handle('set-gaming-mode', async (event, enable) => {
        const cmd = enable
            ? `powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 && powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61`
            : `powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e`;
        try { await new Promise(resolve => exec(cmd, resolve)); return enable ? 'Enabled' : 'Disabled'; }
        catch (e) { return 'Error'; }
    });

    ipcMain.handle('get-processes', async () => {
        try {
            const processes = await si.processes();
            return processes.list
                .filter(p => p.mem > 1)
                .sort((a, b) => b.mem - a.mem)
                .slice(0, 15)
                .map(p => ({ name: p.name, pid: p.pid, mem: p.mem.toFixed(1), cpu: p.cpu.toFixed(1) }));
        } catch (e) { return []; }
    });

    ipcMain.handle('kill-process', async (event, pid) => {
        try { process.kill(pid); return 'Killed'; } catch (e) { return 'Error'; }
    });

    // --- CLEANER ---
    ipcMain.handle('optimize-system', async () => {
        try {
            await new Promise(resolve => exec('ipconfig /flushdns', resolve));
            clearDir(os.tmpdir());
            return 'Optimization Complete';
        } catch (e) { return 'Error'; }
    });

    const getJunkPaths = () => ({
        temp: os.tmpdir(),
        winUpdate: 'C:\\Windows\\SoftwareDistribution\\Download',
        logs: 'C:\\Windows\\Logs',
        recycle: 'C:\\$Recycle.Bin',
        browser: path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache'),
        thumbnails: path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Windows\\Explorer')
    });

    ipcMain.handle('scan-junk', async () => {
        const paths = getJunkPaths(); const results = {};
        for (const [key, dir] of Object.entries(paths)) results[key] = getDirInfo(dir);
        return results;
    });

    ipcMain.handle('clean-junk', async (event, categories) => {
        const paths = getJunkPaths(); let totalFreed = 0;
        for (const cat of categories) {
            if (paths[cat]) {
                totalFreed += getDirInfo(paths[cat]).size;
                if (cat === 'recycle') exec('PowerShell.exe -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
                else clearDir(paths[cat]);
            }
        }
        return (totalFreed / 1024 / 1024).toFixed(2);
    });
}

// 🌟 APP READY
app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();

    const iconPath = getAssetPath('resources', 'icon.ico');
    const trayIcon = nativeImage.createFromPath(iconPath);

    if (!trayIcon.isEmpty()) {
        tray = new Tray(trayIcon);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open SystemMax', click: () => { if (mainWindow) mainWindow.show(); } },
            { type: 'separator' },
            { label: 'Quit', click: () => { isQuiting = true; app.quit(); } }
        ]);
        tray.setToolTip('SystemMax Optimizer');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
    } else {
        logToFile('Tray icon is empty. iconPath=', iconPath);
    }
});

app.on('before-quit', () => { isQuiting = true; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
