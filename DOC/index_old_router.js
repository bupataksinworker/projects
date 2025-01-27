const express = require('express')
const router = require('../routes/router')
const app = express()

app.use(router) //ใช้งานร่วมกับ server ทำงานกับฐานข้อมูล
app.listen(8080,()=>{
    console.log("start server port 8080")
})