import * as dlobjMoudules from './dlObj.js'
import * as pubilcMoudules from './pubilcMoudules.js'
const ipc = require('electron').ipcRenderer
const DLobj = dlobjMoudules.DLobj
const previousBtn = document.getElementById('previous')
const homePageBtn = document.getElementById('homePage')
const nextBtn = document.getElementById('next')

pubilcMoudules.loadingClose()

ipc.on('selected-directory', (e, path) => {

    if (path.length !== 0) {

        localStorage.setItem('path', path[0])

        DLobj.currentPath = localStorage.getItem('path')

        DLobj.getList(DLobj.currentPath)

    }
})

const openFileDialog = (e) => {

    e.preventDefault()

    ipc.send('open-file-dialog')

}
dlobjMoudules.selectPathBtn.addEventListener('click', openFileDialog)

const refreshFunc = (e) => {

    e.preventDefault()

    DLobj.getList(DLobj.currentPath)

}
const previousFunc = (e) => {
    DLobj.currentPage = DLobj.currentPage === 1 ? DLobj.currentPage : DLobj.currentPage - 1
    if (DLobj.currentPage === 1) {
        pubilcMoudules.btnAnimation(false)
    }
    e.preventDefault()

    DLobj.mergeLocalDlList(pubilcMoudules.pagination(DLobj.currentPage, DLobj.pageSize, DLobj.dlsiteData))
}
const nextFunc = (e) => {

    pubilcMoudules.btnAnimation(true)
    DLobj.currentPage = DLobj.currentPage === Math.ceil(DLobj.dataTotal / DLobj.pageSize) ? Math.ceil(DLobj.dataTotal / DLobj.pageSize) : DLobj.currentPage + 1
    e.preventDefault()
    DLobj.mergeLocalDlList(pubilcMoudules.pagination(DLobj.currentPage, DLobj.pageSize, DLobj.dlsiteData))

}
dlobjMoudules.refreshBtn.addEventListener('click', refreshFunc)

dlobjMoudules.searchVal.addEventListener('keydown', e => {
    if (e.key == 'Enter') {

        e.preventDefault()
        DLobj.eventFunc(dlobjMoudules.searchVal.value)

    }
})

dlobjMoudules.searchVal.addEventListener('input', e => {
    if (dlobjMoudules.searchVal.value == "") {
        e.preventDefault()
        DLobj.getList(DLobj.currentPath)
    }
})

dlobjMoudules.searchBtn.addEventListener('click', e => {

    e.preventDefault()
    DLobj.eventFunc(dlobjMoudules.searchVal.value)

})

nextBtn.addEventListener('click', nextFunc)
previousBtn.addEventListener('click', previousFunc)

homePageBtn.addEventListener('click',e => {
    e.preventDefault()
    DLobj.currentPage = 1
    pubilcMoudules.btnAnimation(false)
    DLobj.mergeLocalDlList(pubilcMoudules.pagination(DLobj.currentPage, DLobj.pageSize, DLobj.dlsiteData))
})

window.addEventListener('keydown',e => {
    if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        document.getElementById('rj-search').focus()
    }
    if (document.activeElement.tagName === "BODY"){
        switch (e.key) {

            case "ArrowRight":
                nextFunc(e)
                break

            case "ArrowLeft":
                previousFunc(e)
                break
        }
    }
})

DLobj.getList(DLobj.currentPath)

