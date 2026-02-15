const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const si = require('systeminformation');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');
const { createClient } = require('@supabase/supabase-js');
const { autoUpdater } = require('electron-updater');

// --- 🌐 SUPABASE CONFIGURATION ---
const supabaseUrl = 'https://shskabspsedvaoweydvb.supabase.co';
const supabaseKey = 'sb_publishable_e33gjWLMkOh0ufvb9VIpgg_nk17u5it';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- المتغيرات العالمية ---
let tray = null;
let mainWindow = null;
let isQuiting = false;

// --- ✅ UPDATER HELPERS ---
function sendUpdate(channel, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
}

function setupAutoUpdater() {
    // updates كيتجرّبو/كيخدمو غير فـ packaged build
    if (!app.isPackaged) return;

    autoUpdater.autoDownload = false;

    autoUpdater.on('checking-for-update', () => sendUpdate('update:checking'));
    autoUpdater.on('update-available', (info) => sendUpdate('update:available', info));
    autoUpdater.on('update-not-available', (info) => sendUpdate('update:none', info));
    autoUpdater.on('download-progress', (p) => sendUpdate('update:progress', p));
    autoUpdater.on('update-downloaded', (info) => sendUpdate('update:downloaded', info));
    autoUpdater.on('error', (err) => sendUpdate('update:error', String(err)));
}

// --- 📅 مدد الاشتراكات بالأيام ---
const PLAN_DURATIONS = {
    '1 Month': 30,
    '3 Months': 90,
    '6 Months': 180,
    '12 Months': 365,
    'Premium': 9999 // Lifetime
};

// --- 🔒 HWID GENERATOR ---
const getHWID = async () => {
    try {
        const uuidData = await si.uuid();
        return uuidData.os || os.hostname();
    } catch (e) {
        return os.hostname();
    }
};

// --- 🔒 LOCAL CONFIG ---
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'sys-config.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
        }
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

// --- 📁 Helper Functions for Cleaner ---
const getDirInfo = (dirPath) => {
    let size = 0; let count = 0;
    try {
        if (!fs.existsSync(dirPath)) return { size: 0, count: 0 };
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    const subInfo = getDirInfo(filePath);
                    size += subInfo.size; count += subInfo.count;
                } else { size += stats.size; count++; }
            } catch (e) { }
        });
    } catch (e) { }
    return { size, count };
};

const clearDir = (dirPath) => {
    try {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
                const curPath = path.join(dirPath, file);
                try {
                    if (fs.lstatSync(curPath).isDirectory()) fs.rmSync(curPath, { recursive: true, force: true });
                    else fs.unlinkSync(curPath);
                } catch (e) { }
            });
        }
    } catch (e) { }
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'resources/icon.ico')
    });

    // ✅ DEV vs PRODUCTION
    if (app.isPackaged) {
        // إذا فاش build لقيتي path غلط، غادي نصلحو فـ Step الجاي (غير صيفط ليا build output structure)
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }

    // الخلفية: فاش يكليكي على X كيتخبى
    mainWindow.on('close', function (event) {
        if (!isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    // ==========================================
    // ---------- 🚀 IPC HANDLERS 🚀 ----------
    // ==========================================

    // --- 🌟 UPDATES (GitHub Releases via electron-updater) ---
    ipcMain.handle('get-app-version', () => app.getVersion());

    // ✅ حافظنا على نفس الاسم باش preload ما يتكسرش: checkUpdate() => 'check-update'
    // ✅ وحافظنا على نفس شكل result القديم: latest / update_available / error
    ipcMain.handle('check-update', async () => {
        if (!app.isPackaged) {
            return { status: 'dev', message: 'Updates work only in packaged build.' };
        }

        return new Promise(async (resolve) => {
            const cleanup = () => {
                autoUpdater.removeListener('update-available', onAvailable);
                autoUpdater.removeListener('update-not-available', onNone);
                autoUpdater.removeListener('error', onError);
            };

            const onAvailable = (info) => {
                cleanup();
                resolve({
                    status: 'update_available',
                    message: `Version ${info?.version || 'new'} is available!`
                });
            };

            const onNone = () => {
                cleanup();
                resolve({ status: 'latest', message: 'You are on the latest version.' });
            };

            const onError = (err) => {
                cleanup();
                resolve({ status: 'error', message: String(err) });
            };

            autoUpdater.on('update-available', onAvailable);
            autoUpdater.on('update-not-available', onNone);
            autoUpdater.on('error', onError);

            try {
                await autoUpdater.checkForUpdates();
            } catch (e) {
                onError(e);
            }
        });
    });

    // هادو جداد (غادي نزيدو ليهم preload/UI من بعد)
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

    // --- 🔥 1. SUBSCRIPTION (Auto-Sync Logic) ---
    ipcMain.handle('get-subscription-status', async () => {
        const config = loadConfig();
        const hwid = await getHWID();

        // 1. حساب المدفوع
        if (config.licenseKey && config.plan) {
            try {
                const { data, error } = await supabase
                    .from('licenses')
                    .select('activated_at, status')
                    .eq('key', config.licenseKey)
                    .single();

                if (data && !error) {
                    if (data.status !== 'active') {
                        return { status: 'expired', daysLeft: 0, plan: 'License Revoked' };
                    }
                    if (data.activated_at) {
                        config.activationDate = data.activated_at;
                        saveConfig(config);
                    }
                }
            } catch (e) { }

            if (config.activationDate) {
                const startDate = new Date(config.activationDate).getTime();
                const durationDays = PLAN_DURATIONS[config.plan] || 30;
                const expiryDate = startDate + (durationDays * 24 * 60 * 60 * 1000);
                const now = Date.now();

                if (now > expiryDate) {
                    return { status: 'expired', daysLeft: 0, plan: `${config.plan} (Expired)` };
                } else {
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    return { status: 'pro', daysLeft: daysLeft, plan: config.plan };
                }
            }
            return { status: 'pro', daysLeft: 'Unlimited', plan: config.plan };
        }

        // 2. حساب الـ Free Trial
        let { data: trial } = await supabase.from('trials').select('*').eq('hwid', hwid).single();
        if (!trial) {
            const { data: newTrial } = await supabase.from('trials').insert({ hwid: hwid }).select().single();
            trial = newTrial;
        }
        const installDate = trial ? new Date(trial.created_at).getTime() : config.installDate;
        const diffDays = Math.ceil(Math.abs(Date.now() - installDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 7) return { status: 'expired', daysLeft: 0, plan: 'Free Trial' };
        else return { status: 'trial', daysLeft: (7 - diffDays), plan: 'Free Trial' };
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
                    .update({ hwid: hwid, status: 'active', activated_at: nowISO })
                    .eq('key', key);
                if (updateError) return { success: false, error: 'Activation failed' };
            }

            const config = loadConfig();
            config.licenseKey = key;
            config.plan = license.plan || 'Premium';
            config.activationDate = license.activated_at || nowISO;
            saveConfig(config);

            return { success: true };
        } catch (e) { return { success: false, error: 'Connection Error' }; }
    });

    ipcMain.handle('remove-license', async () => {
        const config = loadConfig();
        config.licenseKey = null; config.plan = null; config.activationDate = null;
        saveConfig(config); return { success: true };
    });

    // --- 2. LIVE STATS & TRAY (🔥 UPDATED WITH TEMPERATURE 🔥) ---
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
            const netDown = (rx * 8 / 1000 / 1000).toFixed(2);
            const netUp = (tx * 8 / 1000 / 1000).toFixed(2);

            const cpuTemp = (cpuTempData && cpuTempData.main) ? cpuTempData.main.toFixed(0) : '--';

            let gpuTemp = '--';
            if (graphicsData && graphicsData.controllers && graphicsData.controllers.length > 0) {
                const gpuWithTemp = graphicsData.controllers.find(c => c.temperatureGpu);
                if (gpuWithTemp) {
                    gpuTemp = gpuWithTemp.temperatureGpu.toFixed(0);
                }
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('sys-data', {
                    ramUsed, ramTotal, cpuUsage, netDown, netUp,
                    cpuTemp, gpuTemp
                });
            }

            if (tray) {
                const tooltipTable =
                    `🚀 SystemMax Optimizer
━━━━━━━━━━━━━━━━━
⚡ CPU : ${cpuUsage}% (${cpuTemp}°C)
🎮 GPU : ${gpuTemp}°C
🧠 RAM : ${ramUsed} / ${ramTotal} GB
⬇️ DL  : ${netDown} Mb/s
⬆️ UP  : ${netUp} Mb/s
━━━━━━━━━━━━━━━━━`;
                tray.setToolTip(tooltipTable);
            }
        } catch (e) {
            console.error("Stats Error:", e);
        }
    }, 2000);

    // --- 3. NETWORK HANDLERS ---
    ipcMain.handle('check-ping', async (event, host) => {
        return new Promise((resolve) => {
            if (!host) return resolve('--');
            const start = Date.now(); const socket = new net.Socket(); socket.setTimeout(2000);
            socket.connect(443, host, () => { resolve((Date.now() - start).toString()); socket.destroy(); });
            socket.on('error', () => {
                const socket80 = new net.Socket(); const start80 = Date.now(); socket80.setTimeout(1000);
                socket80.connect(80, host, () => { resolve((Date.now() - start80).toString()); socket80.destroy(); });
                socket80.on('error', () => { resolve('999'); socket80.destroy(); });
                socket80.on('timeout', () => { resolve('999'); socket80.destroy(); });
            });
            socket.on('timeout', () => { resolve('999'); socket.destroy(); });
        });
    });

    ipcMain.handle('set-dns', async (event, dnsData) => {
        let psCommand = dnsData.id === 'Automatic'
            ? `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Set-DnsClientServerAddress -ResetServerAddresses`
            : `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Set-DnsClientServerAddress -ServerAddresses "${dnsData.primary}","${dnsData.secondary}"`;
        return new Promise(resolve => exec(`powershell -Command "${psCommand}"`, (error) => resolve(error ? "Failed" : "Success")));
    });

    ipcMain.handle('get-current-dns', async () => {
        const psCommand = `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses`;
        return new Promise(resolve => exec(`powershell -Command "${psCommand}"`, (error, stdout) => resolve(error ? [] : stdout.trim().split(/\s+/))));
    });

    ipcMain.handle('get-ip-info', async () => {
        try {
            const response = await fetch('http://ip-api.com/json');
            const data = await response.json();
            return { ip: data.query, isp: data.isp, country: data.countryCode };
        }
        catch (error) { return { ip: 'Unknown', isp: 'Unknown', country: '--' }; }
    });

    ipcMain.handle('toggle-booster', async (event, enabled) => {
        const commands = enabled
            ? ['netsh int tcp set global autotuninglevel=normal', 'netsh int tcp set global rss=enabled']
            : ['netsh int tcp set global autotuninglevel=disabled', 'netsh int tcp set global rss=default'];
        for (const cmd of commands) await new Promise(resolve => exec(cmd, resolve));
        return enabled;
    });

    ipcMain.handle('reset-network', async () => {
        const commands = ['netsh winsock reset', 'netsh int ip reset', 'ipconfig /release', 'ipconfig /renew', 'ipconfig /flushdns'];
        try { for (const cmd of commands) await new Promise(resolve => exec(cmd, resolve)); return "Success"; }
        catch (error) { return "Error"; }
    });

    // --- 4. GAMING HANDLERS ---
    ipcMain.handle('set-gaming-mode', async (event, enable) => {
        const cmd = enable
            ? `powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 && powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61`
            : `powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e`;
        try { await new Promise(resolve => exec(cmd, resolve)); return enable ? "Enabled" : "Disabled"; }
        catch (e) { return "Error"; }
    });

    ipcMain.handle('get-processes', async () => {
        try {
            const processes = await si.processes();
            return processes.list
                .filter(p => p.mem > 1)
                .sort((a, b) => b.mem - a.mem)
                .slice(0, 15)
                .map(p => ({ name: p.name, pid: p.pid, mem: (p.mem).toFixed(1), cpu: (p.cpu).toFixed(1) }));
        }
        catch (e) { return []; }
    });

    ipcMain.handle('kill-process', async (event, pid) => {
        try { process.kill(pid); return "Killed"; } catch (e) { return "Error"; }
    });

    // --- 5. SYSTEM CLEANER HANDLERS ---
    ipcMain.handle('optimize-system', async () => {
        try {
            await new Promise(resolve => exec('ipconfig /flushdns', resolve));
            clearDir(os.tmpdir());
            return "Optimization Complete";
        } catch (e) { return "Error"; }
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

// 🌟 تشغيل التطبيق والـ Tray
app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();

    const iconPath = path.join(__dirname, 'resources/icon.ico');
    let trayIcon;
    if (fs.existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
    } else {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open SystemMax', click: () => { mainWindow.show(); } },
        { type: 'separator' },
        { label: 'Quit', click: () => { isQuiting = true; app.quit(); } }
    ]);

    tray.setToolTip('SystemMax Optimizer');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
