const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

// 修改现有的 createWindow() 函数
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        frame: true,
        icon: path.join(__dirname, 'src/img/seashell-256.ico')
    })

    win.loadFile('index.html')
}
app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// 选择文件目录并发送至渲染进程
ipc.on('open-file-dialog', (e) => {
    dialog.showOpenDialog({
        properties: ['openDirectory'],
        canceled: true
    }).then(result => {
        if (result) e.sender.send('selected-directory', result.filePaths)
    }).catch(err => {
        console.log(err)
    })
})
