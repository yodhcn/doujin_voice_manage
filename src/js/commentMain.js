import * as pubilcMoudules from './pubilcMoudules.js'
const fs = require('fs')
const path = require('path')
const voiceList = pubilcMoudules.voiceList
const countEle = pubilcMoudules.countEle
const pageSize = pubilcMoudules.pageSize

const DLobj = {
    currentPage:1,
    pageSize: parseInt(pageSize.value),
    dataTotal:0,
    localDirList: [],
    currentInitialData: [],
    pageingArr:[],
    currentPath: localStorage.getItem('path') || 'H:\\Voices',
    //获取本地文件目录
    getList() {
        fs.readdir(this.currentPath, (err, localDirList) => {
            if (err) throw err
            Object.assign(this, { 
                currentPage:1,
                localDirList: localDirList,
                currentInitialData: localDirList,
                dataTotal: localDirList.length
            })
            this.callMain()
        })
    },
    //将符合dlsite的本地文件和其他文件重组
    async mergeLocalDlList() {
        let obj = { urls: [], nonDLsiteComments: [] }
        this.pageingArr.forEach(item => {
            if (item.match(pubilcMoudules.RJ_REGEX)) {
                const rj = item.match(pubilcMoudules.RJ_REGEX)[0]
                const url = pubilcMoudules.DL_URL + rj
                obj.urls.push(url)
            }
            else {
                obj.nonDLsiteComments.push({
                    fileName: item,
                    product_id: "",
                    product_name: item,
                    age_category_string: "未知",
                    work_type_string: "未知",
                    chinese: "未知",
                    genres: [{ name:"未知"}]
                })
            }
        })
        const fetchResult = await pubilcMoudules.fetchUrl(obj.urls)
        
        let dlsiteComments = fetchResult.map(item => {
            item.age_category_string = pubilcMoudules.displace(item.age_category_string)
            this.pageingArr.forEach(pageingItem => {
                const rjMatch = pageingItem.match(pubilcMoudules.RJ_REGEX)
                const rj = rjMatch ? rjMatch.toString() : rjMatch
                if (rj === item.product_id) {
                    item.fileName = pageingItem
                }
            })
            return item
        })

        let currentMergeData = [...obj.nonDLsiteComments, ...dlsiteComments]
        this.outputHtml(currentMergeData)
    },
    outputHtml(currentMergeData) {
        try {

            countEle.innerHTML = `总数${this.dataTotal}件共${Math.ceil(this.dataTotal / this.pageSize)}页当前第${this.currentPage}页`
            pageSize.value = currentMergeData.length
            let voiceHtml = `${currentMergeData.map(item => {
                let fileType = ''
                let buttonEle = ''
                let localDate = ''
                let fPath = path.join(this.currentPath, item.fileName)

                switch (fs.existsSync(fPath)) {
                    case true:
                        let stat = fs.statSync(fPath)
                        
                        localDate = pubilcMoudules.timetrans(stat.mtime)

                        fileType = fs.lstatSync(fPath).isDirectory() ? `<button class=text-style-btn data-action=openDir data-name="${item.fileName}">打开目录</button>` : `<button class=text-style-btn data-action=openFile data-name="${item.fileName}">打开文件</button>`

                        buttonEle = item.product_id ? `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>` : ''

                        item.chinese = item.fileName.match('汉化') ? 'Yes' : 'No'
                        
                        break
                
                    default:
                        fileType = `<button class=text-style-btn data-action=openHvdb data-name="${item.product_id}">打开HVDB</button>`
                        
                        buttonEle = `<button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>`
                        
                        item.chinese = 'No'
                        
                        break
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
                            <div class=text-style-div><span class=title-style>标签:</span> ${item.genres.map(r => { return r.name })}</div>
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
    async searchEvent(val) {
        //提取val字符中的rj组成array
        let rjArr = pubilcMoudules.escapeRegex(val).match(pubilcMoudules.RJ_REGEX)
        switch (rjArr) {
            case null:
                this.currentPage = 1
                this.currentInitialData = pubilcMoudules.selectMatchItem(val, this.localDirList)
                this.dataTotal = this.currentInitialData.length
                this.callMain()
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
                this.currentInitialData = [...new Set(newArr.flat(Infinity))]
                this.dataTotal = this.currentInitialData.length
                this.currentPage = 1
                this.callMain()
                break
        }

    },
    callMain(){
        this.pageingArr = pubilcMoudules.pagination(this.currentPage, this.pageSize, this.currentInitialData)
        this.mergeLocalDlList()
    }
}

export { DLobj}