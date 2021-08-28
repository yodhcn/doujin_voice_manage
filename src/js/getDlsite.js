import * as pubilcMoudules from './pubilcMoudules.js'
const { shell } = require('electron')

const RJ_REGEX = new RegExp("[BRV][JE][0-9]{6}", "gi")
const Num_REGEX = new RegExp("[0-9]{6}", "gi")
const voiceListHtml = document.getElementById('voice-list')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const countEle = document.getElementById('count')
const nextBtn = document.getElementById('next')
const previousBtn = document.getElementById('previous')
const homePageBtn = document.getElementById('homePage')
const pageDiv = document.getElementById('page-div')
voiceListHtml.innerHTML = `<p class="dl-text">请在搜索框输入RJ号</p>`
let pageIndex = 1

const turnPage = () => {
    nextBtn.addEventListener('click', e => {
        e.preventDefault()
        pageIndex = pageIndex + 1
        btnAnimation(true)
        getDlsiteNew(pageIndex, searchVal.value)
    })
    previousBtn.addEventListener('click', e => {
        e.preventDefault()
        if (pageIndex > 1){
            pageIndex = pageIndex - 1
            if(pageIndex == 1){
                btnAnimation(false)
            }
        }
        getDlsiteNew(pageIndex, searchVal.value)
    })
    homePageBtn.addEventListener('click',e => {
        e.preventDefault()
        pageIndex = 1
        btnAnimation(false)
        getDlsiteNew(pageIndex, searchVal.value)
    })
}
const btnAnimation = (flag) =>{
    if(flag == true){
        previousBtn.style.cssText = `
            transform: translate3d(-50px, 0px, 20px);
            transition: transform 0.3s ease-out;
        `
        homePageBtn.style.cssText = `
            transform: translate3d(-25px, -45px, 0px);
            transition: transform 0.3s ease-out;
        `
    }
    else
    {
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
const getDlsiteNew = (pageIndex,val) => {
    pubilcMoudules.loadingShow()
    let keyVal = val ? '/keyword/' + val : ''
    let url = `https://www.dlsite.com/maniax/sapi/=/language/jp/sex_category/+${keyVal}/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/order[0]/release_d/work_type_category[0]/audio/work_type_category_name[0]/音声・ASMR/per_page/30/page/${pageIndex}/format/json/?cdn_cache=1`
    let urlRj = "https://www.dlsite.com/home/api/=/product.json?workno="
    fetch(url).then(res => {
        return res.json()
    }).then(myJson=>{
        let urlArr = myJson.map(item => {
            return urlRj + item.product_id
        })
        pageDiv.style.display = 'block'
        getDlsiteApi(urlArr)
    }).catch(err => {
        setTimeout(() => {
            alert(err)
        }, 10,pubilcMoudules.loadingClose())
        
    })
}
const getDlsiteApi = async (urls) => {
    const texts = await Promise.all(urls.map(async url => {
        const res = await fetch(url)
        return res.json()
    }))
    const result = texts.flat(Infinity)
    let dlComments = result.map(item => {   
        item.age_category_string = item.age_category_string.replace('adult','R18')
        item.age_category_string = item.age_category_string.replace('general', '全年龄')
        item.age_category_string = item.age_category_string.replace('r15', 'R15')
        return item
    })
    outPutHtml(dlComments)
}
const searchFunc = () => {
    const eventFunc = (val) =>{
        pubilcMoudules.loadingShow()
        pageDiv.style.display = 'none'
        let url = "https://www.dlsite.com/home/api/=/product.json?workno="
        if (val.match(Num_REGEX)){
            val = 'RJ' + val
        }
        if (pubilcMoudules.escapeRegex(val).match(RJ_REGEX)) {
            let urls = val.match(RJ_REGEX).map(item => {
                return url + item.toUpperCase()
            })
            getDlsiteApi(urls)
        }
        else
        {
            getDlsiteNew(pageIndex, val)
        }
    }
    searchVal.addEventListener('keydown',e => {
        if (e.key == 'Enter') {
            e.preventDefault()
            eventFunc(searchVal.value)
        }
    })
    searchBtn.addEventListener('click',e => {
        e.preventDefault()
        eventFunc(searchVal.value)
    })
}
const outPutHtml = (dlComments) => {
    let count = dlComments.length
    let dlsiteUrl = []
    let hvdbUrl = []
    if (count < 30){
        pageDiv.style.display = 'none'
    }
    countEle.innerHTML = `当前第${pageIndex}页共${count}条结果`
    let voiceHtml = `${dlComments.map((item,index) => {
        dlsiteUrl.push(`https://www.dlsite.com/maniax/work/=/product_id/${item.product_id}.html`)
        hvdbUrl.push(`https://hvdb.me/Dashboard/WorkDetails/${item.product_id.slice(2)}`)
        return `<li>
        <div class=img-style><img src=${pubilcMoudules.getImgSrc(item.product_id)}></img></div>
        <div class=text-style>
            <button class=text-style-btn id=dlsiteUrl${index}>打开网址</button>
            <button class=text-style-btn id=hvdbUrl${index}>打开HVDB</button>
            <div class=text-style-div>${item.product_id}</div>
            <div class=text-style-div>${item.product_name}</div>
            <div class=text-style-div>${item.age_category_string}</div>
            <div class=text-style-div>${item.work_type_string}</div>
            <div class=text-style-div>${item.genres.map(r => { return r.name})}</div>
        </div>
        </li>`}).join('')}`
    voiceListHtml.innerHTML = voiceHtml
    openUrl(dlsiteUrl, hvdbUrl)
    pubilcMoudules.loadingClose()
}
const openUrl = (dlsiteUrl, hvdbUrl) => {
    dlsiteUrl.map((url, index) => {
        let dlsiteUrlBtn = document.getElementById(`dlsiteUrl${index}`)
        dlsiteUrlBtn.addEventListener('click', (e) => {
            e.preventDefault()
            shell.openExternal(url)
        })
    })
    hvdbUrl.map((url, index) => {
        let hvdbUrlBtn = document.getElementById(`hvdbUrl${index}`)
        hvdbUrlBtn.addEventListener('click', (e) => {
            e.preventDefault()
            shell.openExternal(url)
        })
    })
}
pubilcMoudules.loadingClose()
getDlsiteNew(pageIndex, searchVal.value)
turnPage()
searchFunc()
pubilcMoudules.ctrlF(searchVal)

