const pageError = (req,res)=>{
    res.status(404).render('pageError')
}
const pageNotFound = (req,res)=>{
    res.status(404).render('page-404')
}

module.exports = {
    pageNotFound,
    pageError
}