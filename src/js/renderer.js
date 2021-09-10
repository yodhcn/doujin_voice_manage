import * as dlobjMoudules from './commentMain.js'
import * as pubilcMoudules from './pubilcMoudules.js'
const ipc = require('electron').ipcRenderer
const DLobj = dlobjMoudules.DLobj
const previousBtn = pubilcMoudules.previousBtn
const homePageBtn = pubilcMoudules.homePageBtn
const nextBtn = pubilcMoudules.nextBtn
const pageSize = pubilcMoudules.pageSize
const whichPage = pubilcMoudules.WHICHPAGE
const getNum = pubilcMoudules.GET_NUM
const selectPathBtn = pubilcMoudules.selectPathBtn
const searchBtn = pubilcMoudules.searchBtn
const searchVal = pubilcMoudules.searchVal
const refreshBtn = pubilcMoudules.refreshBtn
pubilcMoudules.loadingClose()

ipc.on('selected-directory', (e, path) => {

    if (path.length !== 0) {

        localStorage.setItem('path', path[0])

        DLobj.currentPath = localStorage.getItem('path')

        DLobj.getList(DLobj.currentPath)

    }
})

const openFileDialog = (e) => {

    ipc.send('open-file-dialog')

}
selectPathBtn.addEventListener('click', openFileDialog)

const refreshFunc = (e) => {


    DLobj.getList(DLobj.currentPath)

}
const previousFunc = (e) => {

    if (DLobj.currentPage === 1) {

        e.preventDefault()
        
    }
    else
    {   
        DLobj.currentPage = DLobj.currentPage - 1
        
        DLobj.callMain()
    }
}
const nextFunc = (e) => {

    let paged = Math.ceil(DLobj.dataTotal / DLobj.pageSize)

    if (DLobj.currentPage === paged){

        e.preventDefault()
    }
    else
    {
        DLobj.currentPage = DLobj.currentPage + 1

        DLobj.callMain()
    }

}
const whichPageFn = () => {

    let val = searchVal.value

    if (val.match(whichPage)) {

        let paged = Math.ceil(DLobj.dataTotal / DLobj.pageSize)

        let userPaged = parseInt(val.match(getNum).filter(Boolean).toString())

        DLobj.currentPage = userPaged < paged ? userPaged : paged

        DLobj.callMain()

    }
    else {

        DLobj.searchEvent(searchVal.value.toUpperCase())
    }
}

refreshBtn.addEventListener('click', refreshFunc)

searchVal.addEventListener('keydown', e => {

    if (e.key === 'Enter') {

        whichPageFn()

    }

})

searchVal.addEventListener('input', e => {
    
    if (searchVal.value == "") {

        DLobj.getList(DLobj.currentPath)
    
    }

})

searchBtn.addEventListener('click', whichPageFn)

nextBtn.addEventListener('click', nextFunc)

previousBtn.addEventListener('click', previousFunc)

homePageBtn.addEventListener('click',e => {

    DLobj.currentPage = 1

    pubilcMoudules.btnAnimation(false)

    DLobj.callMain()
})

window.addEventListener('keydown',e => {
    if (e.ctrlKey && e.key === "f") {
        
        document.getElementById('rj-search').focus()
    }
    if (e.key === "Escape"){
        document.getElementById('rj-search').blur()
        pageSize.blur()
    }
    if (document.activeElement.tagName !== "INPUT"){
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

pageSize.addEventListener('keydown',e => {

    let condition = parseInt(pageSize.value) === 30 || parseInt(pageSize.value) === 50

    if (e.key === 'Enter' && condition){
        
        DLobj.pageSize = parseInt(pageSize.value)

        DLobj.currentPage = 1
        
        DLobj.callMain()

    }
})

DLobj.getList(DLobj.currentPath)

