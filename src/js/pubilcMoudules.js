
const path = require('path')
const { shell } = require('electron')
const DL_URL = "https://www.dlsite.com/home/api/=/product.json?workno="
const RJ_REGEX = new RegExp("[BRV][JE][0-9]{6}", "gi")
const Num_REGEX = new RegExp("[0-9]{6}", "gi")
const GET_NUM = new RegExp("[1-9]*", "g")
const WHICHPAGE = new RegExp("^@[0-9]*$", "g")
const previousBtn = document.getElementById('previous')
const homePageBtn = document.getElementById('homePage')
const nextBtn = document.getElementById('next')
const pageSize = document.getElementById('pageCount')
const voiceList = document.getElementById('voice-list')
const countEle = document.getElementById('count')
const selectPathBtn = document.getElementById('select-path')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const refreshBtn = document.getElementById('refresh')


const loadingShow = () => {
    const loadingIcon = document.getElementById('loading-gif')
    loadingIcon.style.display = "block"
}
const loadingClose = () => {
    const loadingIcon = document.getElementById('loading-gif')
    loadingIcon.style.display = "none"
}
const btnAnimation = (flag) => {
    if (flag == true) {
        previousBtn.style.cssText = `
            transform: translate3d(-50px, 0px, 20px);
            transition: transform 0.3s ease-out;
        `
        homePageBtn.style.cssText = `
            transform: translate3d(-25px, -45px, 0px);
            transition: transform 0.3s ease-out;
        `
    }
    else {
        previousBtn.style.cssText = `
            transform: translate3d(0px, 0px, 0px);
            transition: transform 0.3s ease-out;  
        `
        homePageBtn.style.cssText = `     
            transform: translate3d(0, 0, 0);
            transition: transform 0.3s ease-out;
        `
    }
}
//pagetion
const pagination = (currenPage,pageSize,array) => {
    let offset = (currenPage - 1) * pageSize
    return (offset + pageSize >= array.length) ? array.slice(offset, array.length) : array.slice(offset, offset + pageSize)
}
//get img url 
const getImgSrc = (rjcode) => {
    let imgSrc = ""
    let rj = rjcode
    let imgType = "doujin"
    let rj_group
    if (rj.slice(5) == "000" && rj.slice(0, 2) == "RJ") {
        rj_group = rj
    }
    else if (rj.slice(0, 2) == "RJ") {
        rj_group = (parseInt(rj.slice(2, 5)) + 1).toString() + "000"
        rj_group = "RJ" + ("000000" + rj_group).substring(rj_group.length)
    }
    else if (rj.slice(5) == "000" && rj.slice(0, 2) == "VJ") {
        rj_group = rj
        imgType = "professional"
    }
    else if (rj.slice(0, 2) == "VJ") {
        rj_group = (parseInt(rj.slice(2, 5)) + 1).toString() + "000"
        rj_group = "VJ" + ("000000" + rj_group).substring(rj_group.length)
        imgType = "professional"
    }
    else if (rj.slice(5) == "000" && rj.slice(0, 2) == "BJ") {
        rj_group = rj
        imgType = "books"
    }
    else if (rj.slice(0, 2) == "BJ") {
        rj_group = (parseInt(rj.slice(2, 5)) + 1).toString() + "000";
        rj_group = "BJ" + ("000000" + rj_group).substring(rj_group.length)
        imgType = "books"
    } else {
        return imgSrc = "./src/img/35029629.jpg"
    }
    return imgSrc = `https://img.dlsite.jp/modpub/images2/work/${imgType}/${rj_group}/${rj}_img_main.jpg`
}
//匹配特殊字符
const escapeRegex = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/gi, '\\$&')
}

const ctrlF = (searchVal) => {
    window.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key === "f") {
            e.preventDefault()
            searchVal.focus()
        }
    })
}

const displace = (item) => {
    item = item.replace('adult', 'R18')
    item = item.replace('general', '全年龄')
    item = item.replace('r15', 'R15')
    return item
}

const timetrans = (date) => {
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
    const h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    const m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    const s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    return Y + M + D + h + m + s;
}
//fetch 
const fetchUrl = async (urls) => {
    try {
        loadingShow()
        const data = await Promise.all(urls.map(url => fetch(url)))
        const ext = await Promise.all(data.map(res => res.json()))
        return ext.flat(Infinity)
    } 
    catch (err) 
    {
        loadingClose()
        alert('网络无法连接，请检查')
    }
}
//搜索查询
const selectMatchItem = (keyWord,lists) => {
 
    let reg = new RegExp(escapeRegex(keyWord), 'gi')
    let resArr = []

    lists.filter(item => {

        if (reg.test(item)) {

            resArr.push(item)

        }

    })

    return resArr
}
//click event
class eventMenu {
    constructor(elem, currentPath) {
        [...elem].forEach(ele => {
            this._ele = ele
            this._currentPath = currentPath
            ele.onclick = this.onClick.bind(this)
        })
    }

    openFile(id) {
        let filePath = path.join(this._currentPath, id)
        shell.openPath(filePath)
    }

    openDir(id) {
        let filePath = path.join(this._currentPath, id)
        shell.openPath(filePath)
    }

    openDL(id) {
        let url = `https://www.dlsite.com/maniax/work/=/product_id/${id}.html`
        shell.openExternal(url)
    }
    openHvdb(id) {
        let url = `https://hvdb.me/Dashboard/WorkDetails/${id.slice(2)}`
        shell.openExternal(url)
    }

    onClick(event) {
        let target = event.target
        if (target.nodeName.toLocaleLowerCase() === 'button') {
            //dataset 获取data-*自定义属性，getAttribute可以获取任何属性 target.getAttribute('*')
            let action = target.dataset.action
            let id = target.dataset.name
            this[action](id)
        }
    }
}
export { loadingShow, loadingClose, getImgSrc, escapeRegex, ctrlF, displace, timetrans, fetchUrl, selectMatchItem, pagination, btnAnimation, eventMenu, RJ_REGEX, DL_URL, Num_REGEX, WHICHPAGE, GET_NUM, nextBtn, pageSize, voiceList, countEle, selectPathBtn, searchBtn, searchVal, refreshBtn, homePageBtn, previousBtn}