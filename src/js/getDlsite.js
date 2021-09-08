import * as pubilcMoudules from './pubilcMoudules.js'

const voiceListHtml = document.getElementById('voice-list')
const searchBtn = document.getElementById('search-btn')
const searchVal = document.getElementById('rj-search')
const countEle = document.getElementById('count')
const nextBtn = document.getElementById('next')
const previousBtn = document.getElementById('previous')
const homePageBtn = document.getElementById('homePage')
const pageDiv = document.getElementById('page-div')
let pageIndex = 1
voiceListHtml.innerHTML = `<p class="dl-text">请在搜索框输入RJ号</p>`

const turnPage = () => {
    nextBtn.addEventListener('click', e => {
        e.preventDefault()
        pageIndex = pageIndex + 1
        pubilcMoudules.btnAnimation(true)
        getDlsiteNew(pageIndex, searchVal.value)
    })
    previousBtn.addEventListener('click', e => {
        e.preventDefault()
        if (pageIndex > 1){
            pageIndex = pageIndex - 1
            if(pageIndex == 1){
                pubilcMoudules.btnAnimation(false)
            }
        }
        getDlsiteNew(pageIndex, searchVal.value)
    })
    homePageBtn.addEventListener('click',e => {
        e.preventDefault()
        pageIndex = 1
        pubilcMoudules.btnAnimation(false)
        getDlsiteNew(pageIndex, searchVal.value)
    })
}
const getDlsiteNew = (pageIndex,val) => {
    pubilcMoudules.loadingShow()
    let keyVal = val ? '/keyword/' + val : ''
    //全部分类搜索
    // let url = `https://www.dlsite.com/maniax/sapi/=/language/jp/sex_category/+${keyVal}/age_category/+/work_category[0]/doujin/work_category[1]/pc/work_category[2]/books/work_category[3]/drama/order[0]/release_d/options[0]/JPN/options[1]/CHI/options[2]/CHI_HANS/options[3]/CHI_HANT/options[4]/NM/options_name[0]/日语作品/options_name[1]/中文作品/options_name[2]/简体字作品/options_name[3]/繁字体作品/options_name[4]/不限语言/per_page/30/page/${pageIndex}/format/json/?cdn_cache=1`
    //音声分类
    let url = `https://www.dlsite.com/maniax/sapi/=/language/jp/sex_category/+${keyVal}/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/order[0]/release_d/work_type_category[0]/audio/work_type_category_name[0]/音声・ASMR/per_page/30/page/${pageIndex}/format/json/?cdn_cache=1`
    let urlRj = pubilcMoudules.DL_URL
    fetch(url).then(res => {
        return res.json()
    }).then(myJson=>{
        let urlArr = myJson.map(item => {
            return urlRj + item.product_id
        })
        getDlsiteApi(urlArr)
    }).catch(err => {
        setTimeout(() => {
            console.log(err)
            alert("无法连接网络")
            voiceListHtml.innerHTML = ""
            pageDiv.style.display = "none"
        }, 10,pubilcMoudules.loadingClose())
        
    })
}
const getDlsiteApi = async (urls) => {
    const texts = await pubilcMoudules.fetchUrl(urls)
    const result = texts.flat(Infinity)
    let dlComments = result.map(item => {   
        item.age_category_string = pubilcMoudules.displace(item.age_category_string)
        return item
    })
    outPutHtml(dlComments)
}
const searchFunc = () => {
    const eventFunc = (val) =>{
        pubilcMoudules.loadingShow()
        pageDiv.style.display = 'none'
        let url = pubilcMoudules.DL_URL
        if (val.match(pubilcMoudules.Num_REGEX)){
            val = 'RJ' + val
        }
        if (pubilcMoudules.escapeRegex(val).match(pubilcMoudules.RJ_REGEX)) {
            pageIndex = 1
            let urls = val.match(pubilcMoudules.RJ_REGEX).map(item => {
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
    if (count < 30){
        pageDiv.style.display = 'none'
    }else
    {
        pageDiv.style.display = 'block'
    }
    countEle.innerHTML = `当前第${pageIndex}页共${count}条结果`
    let voiceHtml = `${dlComments.map(item => {
        return `<li>
        <div class=img-style><img src=${pubilcMoudules.getImgSrc(item.product_id)}></img></div>
        <div class="text-style event-menu">
            <button class=text-style-btn data-action=openDL data-name="${item.product_id}">打开网址</button>
            <button class=text-style-btn data-action=openHvdb data-name="${item.product_id}">打开HVDB</button>
            <div class=text-style-div>${item.product_id}</div>
            <div class=text-style-div>${item.product_name}</div>
            <div class=text-style-div>${item.regist_date}</div>
            <div class=text-style-div>${item.age_category_string}</div>
            <div class=text-style-div>${item.work_type_string}</div>
            <div class=text-style-div>${item.genres.map(r => { return r.name})}</div>
        </div>
        </li>`}).join('')}`
    voiceListHtml.innerHTML = voiceHtml
    let menu = document.querySelectorAll('.event-menu')
    new pubilcMoudules.eventMenu(menu)
    pubilcMoudules.loadingClose()
}
pubilcMoudules.loadingClose()
getDlsiteNew(pageIndex, searchVal.value)
turnPage()
searchFunc()
pubilcMoudules.ctrlF(searchVal)

