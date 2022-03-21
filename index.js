'use strict'

const express = require('express')

const hbs = require('express-handlebars')

const app = express()

var mysql = require('mysql');

app.use(express.urlencoded({extended: true}))
app.use(express.json())

//app.use(express.static('public'))
//app.use(express.static('public'))
app.use(express.static(__dirname + '/public'))
app.engine('.hbs', hbs.engine({
    defaultLayout: 'index',
    extname: '.hbs'
}))

app.set('view engine', '.hbs')

const router = require('./routes/routes')
app.use('/', router)


const config = require('./config')

app.listen(config.port, () => {
    console.log(`Running at http://localhost:${config.port}`)
})