import * as pubilcMoudules from './pubilcMoudules.js'
const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcRenderer

const selectPathBtn = document.getElementById('select-path')
const voiceList = document.getElementById('voice-list')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const countEle = document.getElementById('count')
const refreshBtn = document.getElementById('refresh')

let currentPath = localStorage.getItem('path') || 'H:\\Voices'

pubilcMoudules.loadingClose()

ipc.on('selected-directory', (e, path) => {

    if (path.length !== 0) {

        localStorage.setItem('path', path[0])

        currentPath = localStorage.getItem('path')

        DLobj.getList(currentPath)

    }
})

const openFileDialog = (e) => {

    e.preventDefault()

    ipc.send('open-file-dialog')

}
selectPathBtn.addEventListener('click', openFileDialog)

const refreshFunc = (e) => {

    e.preventDefault()

    DLobj.getList(currentPath)

}
refreshBtn.addEventListener('click', refreshFunc)

const DLobj = {
    //获取本地文件目录
    getList(currentPath) {
        fs.readdir(currentPath, (err, localDirList) => {

            if (err) throw err

            pubilcMoudules.loadingShow()

            DLobj.mergeLocalDlList(localDirList, currentPath)

        })
    },
    //将符合dlsite的本地文件和其他文件重组
    async mergeLocalDlList(localDirList, currentPath) {

        let voiceComments = []
        let urls = []

        for (const item of localDirList) {
            if (item.match(pubilcMoudules.RJ_REGEX)) {
                const rj = item.match(pubilcMoudules.RJ_REGEX)[0]
                const url = pubilcMoudules.DL_URL + rj
                urls.push(url)
            }
            else {
                voiceComments.push({
                    fileName: item,
                    product_id: "",
                    product_name: item,
                    age_category_string: "未知",
                    work_type_string: "未知",
                    chinese: "未知"
                })
            }
        }

        const fetcResult = await pubilcMoudules.fetchUrl(urls)
        const data = fetcResult.flat(Infinity)

        let dlsiteComments = data.map(item => {
            item.age_category_string = pubilcMoudules.displace(item.age_category_string)
            for (const fileName of localDirList) {
                if (fileName.match(pubilcMoudules.RJ_REGEX)) {
                    const rj = fileName.match(pubilcMoudules.RJ_REGEX)[0]
                    if (rj == item.product_id) {
                        item.fileName = fileName
                    }
                }
            }
            return item
        })

        voiceComments.push(dlsiteComments)
        voiceComments = voiceComments.flat(Infinity)
        DLobj.getHtml(voiceComments, currentPath)

    },
    //渲染页面
    getHtml(dlsiteData, currentPath) {

        DLobj.outputHtml(dlsiteData, currentPath)

        searchVal.addEventListener('keydown', e => {
            if (e.key == 'Enter') {

                e.preventDefault()

                DLobj.eventFunc(searchVal.value, dlsiteData, currentPath)

            }
        })

        searchVal.addEventListener('input', e => {

            e.preventDefault()

            DLobj.eventFunc(searchVal.value, dlsiteData, currentPath)

        })

        searchBtn.addEventListener('click', e => {

            e.preventDefault()

            DLobj.eventFunc(searchVal.value, dlsiteData, currentPath)

        })

    },
    outputHtml(currentData, currentPath) {
        try {

            let count = currentData.length
            countEle.innerHTML = `共${count}条结果`

            if (count === 0) return pubilcMoudules.loadingClose(), voiceList.innerHTML = ""

            let voiceHtml = `${currentData.map(item => {

                let fileType = ''
                let buttonEle = ''
                let localDate = ''

                if (item.localFlag === false) {

                    fileType = `<button class=text-style-btn data-action=openHvdb data-name="${item.product_id}">打开HVDB</button>`
                    buttonEle = `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>`
                    item.chinese = 'No'

                }
                else {
                    let fPath = path.join(currentPath, item.fileName)
                    let stat = fs.statSync(fPath)
                    localDate = pubilcMoudules.timetrans(stat.mtime)

                    fileType = fs.lstatSync(fPath).isDirectory() ? `<button class=text-style-btn data-action=openDir data-name="${item.fileName}">打开目录</button>` : `<button class=text-style-btn data-action=openFile data-name="${item.fileName}">打开文件</button>`

                    buttonEle = item.product_id ? `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>` : ''

                    item.chinese = item.fileName.match('汉化' || '中文') ? 'Yes' : 'No'

                }
                return `<li>
                        <div class=img-style><img src=${pubilcMoudules.getImgSrc(item.product_id)}></img></div>
                        <div class="text-style event-menu">
                            ${fileType}
                            ${buttonEle}
                            <div class=text-style-div><span class=title-style>RJ号:</span> ${item.product_id || '无'}</div>
                            <div class=text-style-div><span class=title-style>标题:</span> ${item.product_name}</div>
                            <div class=text-style-div><span class=title-style>时间:</span> ${item.regist_date || localDate}</div>
                            <div class=text-style-div><span class=title-style>年龄:</span> ${item.age_category_string}</div>
                            <div class=text-style-div><span class=title-style>类型:</span> ${item.work_type_string}</div>
                            <div class=text-style-div><span class=title-style>汉化:</span> ${item.chinese}</div>
                        </div>
                    </li>`}).join('')}`

            voiceList.innerHTML = voiceHtml

            pubilcMoudules.loadingClose()
            pubilcMoudules.ctrlF(searchVal)

            let menu = document.querySelectorAll('.event-menu')
            new pubilcMoudules.eventMenu(menu, currentPath)

        }
        catch (error) {

            return console.log(error)

        }
    },
    async eventFunc(val, dlsiteData, currentPath) {
        //判断输入值是否匹配RJ_REGEX
        if (pubilcMoudules.escapeRegex(val).match(pubilcMoudules.RJ_REGEX)) {

            pubilcMoudules.loadingShow()

            //将输入值组成dlsite url
            const url = pubilcMoudules.DL_URL
            let urls = val.match(pubilcMoudules.RJ_REGEX).map(item => {
                return url + item.toUpperCase()
            })

            const texts = await pubilcMoudules.fetchUrl(urls)
            const result = texts.flat(Infinity)

            let currentData = result.map(item => {

                //替换age_category_string属性的值为更易读的
                item.age_category_string = pubilcMoudules.displace(item.age_category_string)

                //查找本地是否存在
                const compareVal = pubilcMoudules.selectMatchItem(dlsiteData, item.product_id)
                if (compareVal.length == 1) {

                    //建立flag
                    item.localFlag = true
                    //添加本地文件名属性至返回dlsite data JSON
                    item.fileName = compareVal[0].fileName

                }
                else {

                    item.localFlag = false
                    item.fileName = '当前目录未找到'

                }

                return item
            })

            DLobj.outputHtml(currentData, currentPath)
        }
        else {

            const newArr = pubilcMoudules.selectMatchItem(dlsiteData, val)
            DLobj.outputHtml(newArr, currentPath)

        }
    }
}

DLobj.getList(currentPath)

