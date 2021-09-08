import * as pubilcMoudules from './pubilcMoudules.js'
const fs = require('fs')
const path = require('path')
const voiceList = document.getElementById('voice-list')
const countEle = document.getElementById('count')
const selectPathBtn = document.getElementById('select-path')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const refreshBtn = document.getElementById('refresh')
const nextBtn = document.getElementById('next')
const pageDiv = document.getElementById('page-div')

const DLobj = {
    currentPage:1,
    pageSize:50,
    dataTotal:0,
    pageTotal:0,
    localDirList: [],
    dlsiteData: [],
    currentPath: localStorage.getItem('path') || 'H:\\Voices',
    //获取本地文件目录
    getList() {
        fs.readdir(this.currentPath, (err, localDirList) => {

            if (err) throw err
            pubilcMoudules.loadingShow()
            this.currentPage = 1
            this.localDirList = localDirList
            this.dlsiteData = localDirList
            this.dataTotal = localDirList.length
            this.mergeLocalDlList(pubilcMoudules.pagination(this.currentPage, this.pageSize, this.dlsiteData))                
        })
    },
    //将符合dlsite的本地文件和其他文件重组
    async mergeLocalDlList(localDirList) {
        let obj = { urls: [], voiceComments: [] }
        localDirList.forEach(item => {
            if (item.match(pubilcMoudules.RJ_REGEX)) {
                const rj = item.match(pubilcMoudules.RJ_REGEX)[0]
                const url = pubilcMoudules.DL_URL + rj
                obj.urls.push(url)
            }
            else {
                obj.voiceComments.push({
                    fileName: item,
                    product_id: "",
                    product_name: item,
                    age_category_string: "未知",
                    work_type_string: "未知",
                    chinese: "未知"
                })
            }
        })

        const fetchResult = await pubilcMoudules.fetchUrl(obj.urls)
        
        let dlsiteComments = fetchResult.map(item => {
            item.age_category_string = pubilcMoudules.displace(item.age_category_string)
            localDirList.forEach(localFile => {
                if (localFile.match(pubilcMoudules.RJ_REGEX)) {
                    const rj = localFile.match(pubilcMoudules.RJ_REGEX)[0]
                    if (rj == item.product_id) {
                        item.fileName = localFile
                    }
                }
            })
            return item
        })

        const dlsiteData = [...obj.voiceComments, ...dlsiteComments]
        this.outputHtml(dlsiteData)
    },
    outputHtml(currentData) {
        try {
            pageDiv.style.display = 'block'
            countEle.innerHTML = `总数${this.dataTotal}件共${Math.ceil(this.dataTotal / this.pageSize)}页当前第${this.currentPage}页${currentData.length}条结果`
            if (currentData.length < 30){
                nextBtn.disabled = true
                nextBtn.style.cursor = 'not-allowed'
            }
            else
            {
                nextBtn.disabled = false
                nextBtn.style.cursor = 'pointer'
            }

            let voiceHtml = `${currentData.map(item => {


                let fileType = ''
                let buttonEle = ''
                let localDate = ''
                let fPath = path.join(this.currentPath, item.fileName)

                if (fs.existsSync(fPath)){
                    let stat = fs.statSync(fPath)
                    localDate = pubilcMoudules.timetrans(stat.mtime)

                    fileType = fs.lstatSync(fPath).isDirectory() ? `<button class=text-style-btn data-action=openDir data-name="${item.fileName}">打开目录</button>` : `<button class=text-style-btn data-action=openFile data-name="${item.fileName}">打开文件</button>`

                    buttonEle = item.product_id ? `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>` : ''

                    item.chinese = item.fileName.match('汉化' || '中文') ? 'Yes' : 'No'
                }
                else
                {

                    fileType = `<button class=text-style-btn data-action=openHvdb data-name="${item.product_id}">打开HVDB</button>`
                    buttonEle = `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>`
                    item.chinese = 'No'
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
            let menu = document.querySelectorAll('.event-menu')
            new pubilcMoudules.eventMenu(menu, this.currentPath)

        }
        catch (error) {

            return console.log(error), pubilcMoudules.loadingClose()

        }
    },
    async eventFunc(val) {
        //提取val字符中的rj组成array
        let rjArr = pubilcMoudules.escapeRegex(val).match(pubilcMoudules.RJ_REGEX)
        switch (rjArr) {
            case null:
                this.currentPage = 1
                this.dlsiteData = pubilcMoudules.selectMatchItem(val, this.localDirList)
                this.dataTotal = this.dlsiteData.length
                this.mergeLocalDlList(pubilcMoudules.pagination(this.currentPage, this.pageSize, this.dlsiteData))
                break
        
            default:
                let newArr = []
                rjArr.map(rjVal => {
                    let matchResult = pubilcMoudules.selectMatchItem(rjVal, this.localDirList)
                    if (matchResult.length === 0) {
                        newArr.push(rjVal)
                    }
                    else {
                        newArr.push(matchResult)
                    }
                })
                this.dlsiteData = [...new Set(newArr.flat(Infinity))]
                this.dataTotal = this.dlsiteData.length
                this.currentPage = 1
                this.mergeLocalDlList(pubilcMoudules.pagination(this.currentPage, this.pageSize, this.dlsiteData))
                break
        }
    }
}

export { DLobj, selectPathBtn, searchBtn, searchVal, refreshBtn}