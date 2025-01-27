const express = require('express')
const path = require('path')
const app = express()

const indexPage = path.join(__dirname,"templates/index.html")

app.get("/",(req,res)=>{
    res.status(200)
    res.type('text/html')
    res.sendFile(indexPage)
})

app.get("/home",(req,res)=>{
    res.send("<h1>Hello Home</h1>")
})

app.listen(8080,()=>{
    console.log("start server port 8080")
})