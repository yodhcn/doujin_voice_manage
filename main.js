const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const EventEmitter = require('events')
const loadingEvents = new EventEmitter()
const createMainWindow = () => new BrowserWindow({
    width: 1000,
    height: 800,
    titleBarStyle: 'hidden',
    backgroundColor: '#336699',
    show: false,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false
    },
    autoHideMenuBar: true,
    frame: true,
    icon: path.join(__dirname, 'src/img/seashell-256.ico')
})

app.on('ready', () => {
    const window = createMainWindow()
    // window.webContents.openDevTools()
    window.once('ready-to-show', () => {
        window.show()
    })
    window.loadFile('src/loading.html')

    // Our loadingEvents object listens for 'finished'
    loadingEvents.on('finished', () => {
        window.loadFile('index.html')
    })

    setTimeout(() => loadingEvents.emit('finished'), 1500)
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// 选择文件目录并发送至渲染进程
ipc.on('open-file-dialog', (e) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if (result) e.sender.send('selected-directory', result.filePaths)
    }).catch(err => {
        console.log(err)
    })
})
