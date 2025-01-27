const http = require('http')
const fs = require('fs')
const url = require('url')

const indexPage = fs.readFileSync("./templates/index.html", 'utf8')
const productPage1 = fs.readFileSync("./templates/product1.html",'utf8')
const productPage2 = fs.readFileSync("./templates/product2.html",'utf8')
const productPage3 = fs.readFileSync("./templates/product3.html",'utf8')

const server = http.createServer((req,res)=>{

    const {pathname,query} = url.parse(req.url,true)

    if(pathname === "/" || pathname==="/home"){
        res.end(indexPage)
    }else if(pathname==="/product"){
        console.log(query.id)
        if(query.id === "1"){
            res.end(productPage1)
        }else if(query.id === "2"){
            res.end(productPage2)
        }else if(query.id === "3"){
            res.end(productPage3)
        }else{
            res.writeHead(404)
            res.end("<h1>Not Found</h1>")
        }
    }else{
        res.writeHead(404)
        res.end("<h1>Not Found</h1>")
    }
})

server.listen(8080,'localhost',()=>{
    console.log("start server in port 8080")
})
