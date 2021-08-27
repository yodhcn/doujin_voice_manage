import * as pubilcMoudules from './pubilcMoudules.js'
const fs = require('fs')
const path = require('path')
const { shell } = require('electron')
const ipc = require('electron').ipcRenderer

const RJ_REGEX = new RegExp("[BRV][JE][0-9]{6}", "gi")
const selectPathBtn = document.getElementById('select-path')
const voiceList = document.getElementById('voice-list')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const countEle = document.getElementById('count')
const refreshBtn = document.getElementById('refresh')
let curPath = localStorage.getItem('path') ? localStorage.getItem('path') : 'H:\\Voices'
pubilcMoudules.loadingClose()

selectPathBtn.addEventListener('click', e => {
    e.preventDefault()
    ipc.send('open-file-dialog')
})
refreshBtn.addEventListener('click',e => {
    e.preventDefault()
    getList(curPath)
})
ipc.on('selected-directory', (e, path) => {
    console.log(e)
    if (path.length !== 0) {
        localStorage.setItem('path', path[0])
        curPath = localStorage.getItem('path')
        getList(curPath)
    }
})
//获取本地文件目录
const getList = (voicePath) => {
    fs.readdir(voicePath, (err, localDirList) => {
        if (err) throw err
        pubilcMoudules.loadingShow()
        getListElement(localDirList, voicePath)
    })
    // fs.watch(voicePath, (e) => {
    //     if (e === "rename" || e === "change") {
    //         getList(voicePath)
    //     }
    // })
}
//通过本地文件名获取dlsite api的数据
const getListElement = async (localDirList, voicePath) => {
    let voiceComments = []
    let urls = []
    for (const item of localDirList) {
        if (item.match(RJ_REGEX)) {
            let rj = item.match(RJ_REGEX)[0]
            let url = "https://www.dlsite.com/home/api/=/product.json?workno=" + rj
            urls.push(url)
        } else {
            voiceComments.push({
                "fileName": item,
                "product_id": "",
                "product_name": item,
                "age_category_string": "未知",
                "work_type_string": "未知",
                "chinese":"未知"
            })
        }
    }
    const texts = await Promise.all(urls.map(async url => {
        const res = await fetch(url)
        return res.json()
    }))
    const result = texts.flat(Infinity)
    let dlsiteComments = result.map(item => {
        item.age_category_string = item.age_category_string.replace('adult', 'R18')
        item.age_category_string = item.age_category_string.replace('general', '全年龄')
        item.age_category_string = item.age_category_string.replace('r15', 'R15')
        for (const fileName of localDirList) {
            if (fileName.match(RJ_REGEX)) {
                let rj = fileName.match(RJ_REGEX)[0]
                if (rj == item.product_id) {
                    item.fileName = fileName
                }
            }
        }
        return item
    })
    voiceComments.push(dlsiteComments)
    voiceComments = voiceComments.flat(Infinity)
    getHtml(voiceComments, voicePath)
}
//渲染页面
const getHtml = (dlsiteData, voicePath) => {
    outputHtml(dlsiteData, voicePath)
    const eventFunc = (val) => {
        let newArr = selectMatchItem(dlsiteData, val)
        outputHtml(newArr, voicePath)
    }
    searchVal.addEventListener('keydown', e => {
        if (e.key == 'Enter'){
            e.preventDefault()
            eventFunc(searchVal.value)
        }
    })
    searchVal.addEventListener('input', e => {
        e.preventDefault()
        eventFunc(searchVal.value)
    })
    searchBtn.addEventListener('click', e => {
        e.preventDefault()
        eventFunc(searchVal.value)
    })
}
const outputHtml = (currentData, voicePath) => {
    try {
        let count = currentData.length
        countEle.innerHTML = `共${count}条结果`
        if (count === 0) return pubilcMoudules.loadingClose(), voiceList.innerHTML = ""
        let dlsiteUrl = []
        let voiceHtml = `${currentData.map((item,index) => {
            let fileType = fs.lstatSync(path.join(voicePath, item.fileName)).isDirectory() ? '打开目录' : '打开文件'
            let buttonEle = item.product_id ? `<button class=text-style-btn id=${item.product_id}>打开网址</button>` : ''
            if(item.product_id){
                dlsiteUrl.push(`https://www.dlsite.com/maniax/work/=/product_id/${item.product_id}.html`)
            }
            item.chinese = item.fileName.match('汉化' || '中文') ? 'Yes' : 'No'
            return `<li>
        <div class=img-style><img src=${pubilcMoudules.getImgSrc(item.product_id)}></img></div>
        <div class=text-style>
            <button class=text-style-btn id=openDir${index}>${fileType}</button>
            ${buttonEle}
            <div class=text-style-div><span class=title-style>RJ号:</span> ${item.product_id ? item.product_id : '无'}</div>
            <div class=text-style-div><span class=title-style>标题:</span> ${item.product_name}</div>
            <div class=text-style-div><span class=title-style>年龄:</span> ${item.age_category_string}</div>
            <div class=text-style-div><span class=title-style>类型:</span> ${item.work_type_string}</div>
            <div class=text-style-div><span class=title-style>汉化:</span> ${item.chinese}</div>
        </div>
        </li>`}).join('')}`
        voiceList.innerHTML = voiceHtml
        pubilcMoudules.loadingClose()
        pubilcMoudules.ctrlF(searchVal)
        openDirFile(currentData, dlsiteUrl,voicePath)
    } catch (error) {
        return
    }
}
//搜索查询
const selectMatchItem = (lists, keyWord) => {
    let reg = new RegExp(pubilcMoudules.escapeRegex(keyWord), 'gi')
    let resArr = []
    lists.filter(item => {
        if(reg.test(item.age_category_string) || reg.test(item.fileName)){
            resArr.push(item)
        }
    })  
    return resArr
}
//打开目录或者文件
const openDirFile = (currentData, dlsiteUrl,voicePath) => {
    currentData.map((item, index) => {
        let openDirBtn = document.getElementById(`openDir${index}`)
        openDirBtn.addEventListener('click', (e) => {
            e.preventDefault()
            shell.openPath(path.join(voicePath, item.fileName))
        })
    })
    dlsiteUrl.map(url => {
        let urlId = url.match(RJ_REGEX)[0]
        let dlsiteUrlBtn = document.getElementById(urlId)
        dlsiteUrlBtn.addEventListener('click', (e) => {
            e.preventDefault()
            shell.openExternal(url)
        })
    })
}

getList(curPath)
