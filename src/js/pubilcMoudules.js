const loadingShow = () => {
    const loadingIcon = document.getElementById('loading-gif')
    loadingIcon.style.display = "block"
}
const loadingClose = () => {
    const loadingIcon = document.getElementById('loading-gif')
    loadingIcon.style.display = "none"
}
//get img url 
const getImgSrc = (rjcode) => {
    let imgSrc
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
export { loadingShow, loadingClose, getImgSrc, escapeRegex, ctrlF}