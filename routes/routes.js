/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

var mysql = require('mysql');
const { append } = require('express/lib/response');

module.exports = router;

const config = require('../config');
const { createConnection } = require('net');
const { format } = require('path');

router.get('/buscador_perros', (req, res) => { 
    var con = mysql.createConnection(config.db_con);
    con.connect();
    con.query('USE canine_path;')
    con.query('select * from perro; select race, count(race) as count from perro group by race;', (err, rows, fields) => {
        var forma_razas = "";
        var razas = rows[1];
        var perros = rows[0];
        var result = "";
        for(var i = 0; i < perros.length; i++) {
            result += `<a href="perro/${perros[i].id}" class="dog_container_clicker"><div class="dog_container">
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.jpg">
            <h1>${perros[i].name}</h1>
        </div></a>`;
        }
        for(var i = 0; i < razas.length; i++) {
            forma_razas += `<option value="${razas[i].race}">${razas[i].race}(${razas[i].count})</option>`
        }
        res.render('buscador_perros', {
            contenido: {
                forma: forma_razas,
                perritos: result
                
            }
        });
    })
    
})

router.get('/', (req, res) => {
    res.render('main', {})
})

router.get('/perros', (req, res) => {
    res.render('buscador_perros', {perritos: req.query})
})

/*
function gen_dog_grid(query_obj) {
    var str = '<div class="row">'
    str += '<div class="col-sm">'
    var cols = 3;
    var n = 7;
    for(var i = 0; i < n; i++) {
        if(cols == 0) {
            str += '</div>'
            str += '<div class="row">'
            cols = 3;
            str += '<div class="col-sm">' //restart cols
            console.log("r")
            i -= 1 //do not count this one iteration cause its adjustment
        } else {
            console.log('c')
            str += gen_dog_card(1)
            str += "</div>"
            if(cols != 1) { //the last time dont add an extra col yet
                str += '<div class="col-sm">'
            }
            cols -= 1;
        }
    }
    str += "</div>"
    var left = 3 - (n % 3)
    if(left != 3) { //row not full
        console.log(left)
        str += '<div class="col-sm"></div>'.repeat(left - 1)
    }
    str += "</div>"
    return str
}
*/

function fill_grid(res) {

}
function gen_dog_grid(query_obj) {
    //TODO: make database query
    //get all matches
    //display those matches
    var grid = ""
    for(var i = 0; i < 1; i++) {
        grid += gen_dog_card(1)
    }
    return grid
}

function gen_dog_card(dog_id) {
    var con = mysql.createConnection(config.db_con);
    con.connect();
    con.query('USE canine_path;');
    var res = "";
    con.query(`SELECT * FROM perro WHERE id = ${dog_id};`, function(err, rows, fields) {
        if(err) throw err;
        var obj = rows[0];
        //console.log(obj);
        return `<a href="perro/${obj.id}" class="dog_container_clicker"><div class="dog_container">
        <img src="/img/dog_sample.jpg">
        <h1>${obj.name}</h1>
        </div></a>`;
    })
    return res;
    /*var con = mysql.createConnection({
        host: 'localhost',
        user: 'root'
    });
    con.connect();
    con.query('USE canine_path;');
    var obj ={};
    con.query(`SELECT * FROM perro WHERE id = ${dog_id};`, function(err, rows, fields) {
        if(err) throw err;
        obj = rows[0];
    })
    console.log(obj);
    var nombre = "Firulais"
    return `<a href="perro/${obj.id}" class="dog_container_clicker"><div class="dog_container">
        <img src="/img/dog_sample.jpg">
        <h1>${obj.name}</h1>
    </div></a>`*/
}

router.post('/perros', (req, res) => {
    console.log(req.body);
    var query = "select * from perro inner join personality on perro.id = personality.id_perro ";
    var forma = req.body;
    var count = 0;
    if(forma.f_sexo != 'na') {
        query += ` where sex = '${forma.f_sexo}'`
        count++;
    }

    if(forma.f_tamano != 'na') {
        //use ranges for this one
        var min = 0
        var max = 3.0
        if(forma.f_tamano == "S") {
            max = 0.5 //60cms max
        } else if(forma.f_tamano == "M") {
            min = 0.5
            max = 0.7
        } else {
            min = 0.7
        }

        if(count > 0) { //if a 'and is needed'
            query += ` and size > ${min} and size < ${max} `
        } else {
            query += ` where size > ${min} and size < ${max} `
        }
        count++;
    }

    if(forma.f_raza != 'na') {
        if(count > 0) {
            query += ` and race = '${forma.f_raza}' `
        } else {
            query += ` where race = '${forma.f_raza}' `
        }
        count++;
    }


    //TODO: AGREGAR BUSQUEDAS POR ASPECTOS DE PERSONALIDAD


    console.log(query);
    
    var grid = gen_dog_grid();
    //
    var con = mysql.createConnection(config.db_con);
    con.connect();
    con.query('USE canine_path;');
    con.query(`${query}; select race, count(race) as count from perro group by race;`, function(err, rows, fields) {
        if(err) throw err;
        var perros = rows[0];
        var razas = rows[1];
        var result = "";
        for(var i = 0; i < perros.length; i++) {
            result += `<a href="perro/${perros[i].id}" class="dog_container_clicker"><div class="dog_container">
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.jpg">
            <h1>${perros[i].name}</h1>
        </div></a>`;
        }
        var forma_razas = "";
        for(var i = 0; i < razas.length; i++) {
            forma_razas += `<option value="${razas[i].race}">${razas[i].race}(${razas[i].count})</option>`
        }
        res.render('buscador_perros', {
            contenido: {
                old: req.body,
                //perritos: grid
                perritos: result,
                forma: forma_razas
    
            }
        })
    })
    
    con.end();/*
    res.render('buscador_perros', {
        contenido: {
            old: req.body,
            perritos: grid,
        }
    })*/
    //
    /*res.render('buscador_perros', {
        contenido: {
            old: req.body,
            //perritos: grid
            perritos: gen_dog_grid({})

        }
    })*/
})

//perfil individual del perro
router.get('/perro/:id', (req, res) => {
    var con = mysql.createConnection(config.db_con);
    con.query('use canine_path;');
    con.query(`select *, perro.name as perro_name,
    perro.id as perro_id, refugio.id as refugio_id,
    refugio.name as refugio_name
    from perro    
	inner join refugio
    on refugio.id = perro.id_refugio
    inner join personality
    on personality.id_perro = perro.id
    where perro.id = ${req.params.id};`, function(err, rows, fields) {
        var perfil = {};
        perfil.perro_id = rows[0].perro_id;
        perfil.availability = rows[0].availability;
        perfil.perro_name = rows[0].perro_name;
        perfil.race = rows[0].race;
        perfil.size = rows[0].size; 
        perfil.weight = rows[0].weight;
        perfil.sex = rows[0].sex;
        if(rows[0].age < 1) {
            perfil.age = 1 - rows[0].age
        } else {
            perfil.age = rows[0].age; 
        }
        perfil.health = {};
        perfil.health.neutered = rows[0].neutered ? "Sí" : "No";
        perfil.health.dewormed = rows[0].dewormed ? "Sí" : "No";

        perfil.personality = {};
        perfil.personality.dogs = rows[0].dogs;
        perfil.personality.pets = rows[0].pets;
        perfil.personality.kids = rows[0].kids;
        perfil.personality.noise = rows[0].noise;
        perfil.personality.naughty = rows[0].naughty;
        perfil.personality.activity = rows[0].activity;

        perfil.notes = rows[0].notes;

        var refugio = {};
        refugio.id = rows[0].refugio_id;
        refugio.logo = `/img/refugio_logo/${refugio.id}.jpg`;
        refugio.name = rows[0].refugio_name;
        refugio.address = rows[0].address;
        refugio.city = rows[0].city;
        refugio.country = rows[0].country;
        res.render('perfil_perro', {perfil: perfil, refugio: refugio})
    }); 
    con.end();
}) 

router.get('/refugio/:id', (req, res) => {
    var con = mysql.createConnection(config.db_con);
    con.query('use canine_path;');
    con.query(`SELECT COUNT(IF(availability = 'ADOPTABLE', 1, NULL)) 'adoptables',
    COUNT(IF(availability = 'ADOPTADO', 1, NULL)) 'adoptados',
    COUNT(IF(availability = 'NO DISPONIBLE', 1, NULL)) 'no_disponibles'
    FROM perro
    WHERE perro.id_refugio = ${req.params.id};
    
    SELECT * FROM perro WHERE id_refugio = ${req.params.id};
    
    SELECT * FROM refugio WHERE id = ${req.params.id};`, (err, rows, fields) => {
        
        var resumen = rows[0];
        var perros = rows[1];

        var perritos = "";
        for(var i = 0; i < perros.length; i++) {
            perritos += `<a href="../perro/${perros[i].id}" class="dog_container_clicker"><div class="dog_container">
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.jpg">
            <h1>${perros[i].name}</h1>
        </div></a>`;
        }

        res.render('perfil_refugio', {
            resumen: resumen[0],
            perritos: perritos,
            refugio: rows[2][0]
        });
    });
    con.end();
});
 

