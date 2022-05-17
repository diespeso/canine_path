'use strict'

const express = require('express')

const hbs = require('express-handlebars')

const cookie_parser = require('cookie-parser')

const sessions = require('express-session')

const app = express()

var mysql = require('mysql');

const maxAge = 1000 * 60 * 60 * 24;

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(sessions({
    secret: 'thisisasecret',
    saveUninitialized: true,
    cookie: {maxAge: maxAge},
    resave: false
}))
app.use(cookie_parser())

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