/*jshint esversion: 6*/
const express = require('express');
const path = require('path');

const router = express.Router();

var mysql = require('mysql');
const { append } = require('express/lib/response');

const bcrypt = require('bcrypt');

const salt_rounds = 10;

module.exports = router;

const config = require('../config');
const { createConnection } = require('net');
const { format } = require('path');
const multer = require('multer');

const fs = require('fs')

router.get('/buscador_perros', (req, res) => {
    console.log(req.cookies);
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
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.png">
            <h1>${perros[i].name}</h1>
        </div></a>`;
        } //TODO: CAMBIAR TODO A PNG O JPG DUH
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
    if(req.session.username) {
        console.log(`cookie says: ${req.session.username}, ${req.session.user_type}`)
        return res.redirect('buscador_perros') //TODO: enviar a un lado u otro dependiendo tipo de user
    }
    return res.render('main', {})
})

router.get( "/api/ask/logged_in/", (req, res) => {
    var json = {}
    if(req.session.username) {
        json.flag = true;
        json.user_type = req.session.user_type;
    } else {
        json.flag = false;
    }
    return res.status(200).send(json)
})

router.post('/login_refugio', (req, res) => {
    console.log(req.body)
    var usr = req.body.refugio_usr;
    var pass = req.body.refugio_contra;
    const con = mysql.createConnection(config.db_con);
    con.connect();
    con.query('use canine_path');
    con.query(`SELECT * FROM refugio_creds WHERE ref_username = '${usr}';`,
        (err, rows, fields) => {
        if(err) throw err;
        if(rows.length == 0) { //didnt find username
            return res.status(200).redirect('/?failed_login=true') //TODO: MEJORAR EL MENSAJE DE USUARIO NO ENCONTRADO
        }
        console.log(rows);
        //check password
        bcrypt.compare(pass, rows[0].ref_pass, (err, result) => {
            if(err) throw err;
            if(result) { //right password
                req.session.username = rows[0].ref_username;
                req.session.user_type = 'refugio'
                //res.cookie('username', rows[0].ref_username);
                /*return res.render('perfil_interno_refugio', {
                    user:
                        {name: rows[0].ref_username,
                        contra: rows[0].ref_pass}})*/
                return res.redirect('/perfil')
            } else {
                return res.status(200).redirect('/?failed_login=true')
            }
            
        })
    })
    /*bcrypt.genSalt(salt_rounds, (err, salt) => {
        bcrypt.hash(pass, salt, (err, hash) => {
            console.log(hash);
        })
    })*/
    //res.render("perfil_interno_refugio", {})
})

router.get('/signin_refugio', (req, res) => {
    res.render('signin_refugio')
})

router.post('/signin_refugio', (req, res) => {
    const con = mysql.createConnection(config.db_con);
    con.connect()
    con.query('use canine_path')
    bcrypt.genSalt(salt_rounds, function(err, salt) {
        bcrypt.hash(req.body.pass, salt, function(err, hash) {
            var query = `INSERT INTO refugio(
                username, name, address, city,
                country, phone, description
            ) VALUES (
                "${req.body.username}",
                "${req.body.nombre}",
                "${req.body.direccion}",
                "${req.body.ciudad}",
                "${req.body.pais}",
                "${req.body.telefono}",
                "${req.body.descripcion}"
            );`

            console.log(`query: ${query}`)
            con.query(query, (err, rows, fields) => {
                if(err) {
                    console.log(`error al signin: ${err}`)
                    return res.status(500)
                }

                console.log(rows)
            })
            
            var query2 = `INSERT INTO refugio_creds VALUES(
                "${req.body.username}", "${hash}"
            )`
            console.log(`query de credenciales: ${query2}`)

            con.query(query2, (err, rows, fields) => {
                if(err) {
                    console.log(`error al signin con contra: ${err}`)
                    return res.status(500)
                }
            })

            res.redirect('/perfil')
                    
        })
    })
    
    
})

router.get('/logout', (req, res) => {
    console.log(req.session);
    req.session.destroy();
    res.redirect('/')
})

router.get('/signin_usuario', (req, res) => {
    res.render('signin_usuario')
})

router.post('/signin_usuario', (req, res) => {
    const con = mysql.createConnection(config.db_con);
    con.connect()
    con.query('use canine_path;')

    var query;

    bcrypt.genSalt(salt_rounds, (err, salt) => {
        bcrypt.hash(req.body.pass, salt, (err, hash) => {
            console.log(`pass: ${req.body.pass}`)
            console.log(`hash es: ${hash}`)
            query = `INSERT INTO usuario(username, pass, nombres,
                apellido_pat, apellido_mat, mail,
                telefono, ciudad, pais) values(
                    "${req.body.username}",
                    "${hash}",
                    "${req.body.nombres}",
                    "${req.body.apellido_pat}",
                    "${req.body.apellido_mat}",
                    "${req.body.mail}",
                    "${req.body.telefono}",
                    "${req.body.ciudad}",
                    "${req.body.pais}"
                );`

            //aplicar query
            con.query(query, (err, rows, fields) => {
                if(err) {
                    console.log(`error con sign in de usuario: ${err}`)
                    return res.status(500)
                }

                console.log(rows)
            })
            //return res.send({message: query}).status(200);
            //guardar cookie

            //llevar a pantalla principal, si es usuario a woofear
            return res.redirect('buscador_perros')
        })
    })
})

router.post('/login_usuario', (req, res) => {
    console.log(req.body)
    var usr = req.body.usuario_usr
    var pass = req.body.usuario_contra

    const con = mysql.createConnection(config.db_con)
    con.connect()
    con.query('use canine_path;')
    con.query(`SELECT * FROM usuario WHERE username = '${usr}';`,
    (err, rows, fields) => {
        if(err) {
            console.log(`error al hacer login en usuario: ${err}`)
            return res.status(500)
        }
        if(rows.length == 0) {
            console.log('login usuario no encontrado')
            return res.status(400)
        }
        console.log(rows);

        bcrypt.compare(pass, rows[0].pass, (err, result) => {
            if(err) {
                return res.status(500).send({message: `error al comparar contras: ${err}`})
            }
            if(result) {
                req.session.username = rows[0].username
                req.session.user_type = 'usuario'
                console.log("TODO BIEN")
                return res.status(200).redirect('buscador_perros')
            } else {
                return res.status(200).redirect('/?failed_login=true')
            }
        })
    })
})

router.get('/perfil', (req, res) => {
    if(req.session.user_type == 'refugio') {
        console.log('sirviendo a refugio edit')
        var con = mysql.createConnection(config.db_con)
        con.query('use canine_path;')
        con.query(`SELECT id FROM refugio WHERE refugio.username = '${req.session.username}'`, (err, rows, fields) => {
            console.log(rows[0].id)
            var id = rows[0].id

            var q = `SELECT COUNT(IF(availability = 'ADOPTABLE', 1, NULL)) 'adoptables',
            COUNT(IF(availability = 'ADOPTADO', 1, NULL)) 'adoptados',
            COUNT(IF(availability = 'NO DISPONIBLE', 1, NULL)) 'no_disponibles'
            FROM perro
            WHERE perro.id_refugio = ${id};
            
            SELECT * FROM perro WHERE id_refugio = ${id};
            
            SELECT * FROM refugio WHERE id = ${id};`

            con.query(q, (err, results, fields) => {
                console.log(`results: ${JSON.stringify(results)}`)
                var resumen = results[0];
                var perros = results[1];

                var perritos = "";
                for(var i = 0; i < perros.length; i++) {
                    perritos += `
                    <a href="../perro/${perros[i].id}" class="dog_container_clicker">
                    <button class="btn-eliminar" onclick="eliminar_perro(${perros[i].id});event.preventDefault();">X</button>
                        <div class="dog_container">
                        <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.png">
                        <h1>${perros[i].name}</h1>
                        </div>
                    </a>`;
                }
                console.log(`resumen: ${JSON.stringify(results[0])}`)
                return res.render('perfil_refugio_edit', {
                    resumen: resumen[0],
                    refugio: results[2][0],
                    perritos: perritos
                })
            })
        })
        //return res.render('perfil_refugio_edit')
    } else { //perfil de usuario normal
        return res.render('perfil_ok')

    }
    //return res.send({message: req.session.user_type})
})

router.get('/perfil_ok', (req, res) => {
    return res.render('perfil_ok')
})

router.put('/api/edit/refugio/', (req, res) => {
    if(req.session.username) {
        var json = req.body;

        var con = mysql.createConnection(config.db_con)
        con.connect()
        con.query('USE canine_path;')
        var counter = 0;
        //asumir que esta todo o que se puede dejar en blancos
        var q = `UPDATE refugio SET
        name = '${json.refugio_name}',
        address = '${json.refugio_address}',
        city = '${json.refugio_city}',
        country = '${json.refugio_country}',
        phone = '${json.contacto}',
        description = '${json.acerca}'
        WHERE username = '${req.session.username}';`
        con.query(q, (err, result, rows) => {
            if(err) return res.status(500).send({message: `fallo al actualizar perfil refugio: ${err}`})
            return res.status(200).send({message: `actualizado perfil de refugio ${req.session.username}`})
        })


    } else {
        return res.status(500).send({message: "no session"})
    }
})

router.put('/api/edit/perro', (req, res) => {
    console.log(`recibido: ${JSON.stringify(req.body)}`)

    var json = req.body;

    var con = mysql.createConnection(config.db_con)
    con.query('USE canine_path;')
    var q = `UPDATE perro SET
        name = '${json.perro_name}',
        race = '${json.raza}',
        size = ${json.size},
        weight = ${json.weight},
        sex = '${json.sex}',
        age = ${json.age},
        neutered = ${json.neutered},
        dewormed = ${json.dewormed},
        notes = '${json.notes}',
        availability = '${json.availability_card}'
        where perro.id = ${json.id_perro}` //TODO*/

    var q2 = `UPDATE personality SET
        dogs = '${json.dogs}',
        pets = '${json.pets}',
        kids = '${json.kids}',
        noise = '${json.noise}',
        naughty = '${json.naughty}',
        activity = '${json.activity}'
        where id_perro = ${json.id_perro}
    `
    con.query(q)
    con.query(q2)

    //console.log(`profile pic: ${json.profile_pic}`)
    var content = "ok"
    /*if(json.profile_pic) { //img provided
        fs.writeFile(`./public/img/dog_profiles/${json.id_perro}.jpg`, json.profile_pic, err => {
            if(err) console.log(`error cargando imagen: ${err}`)
            console.log('TODO BIEN')
        })
    }*/


    console.log(`query de perro edit: ${q}`)

    return res.status(200).send({message: `cuerpo: ${JSON.stringify(req.body)}`})
})

var storage_refugios = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/img/refugio_profiles/')
    },
    filename: (req, file, cb) => {
        cb(null, `${req.session.username}${path.extname(file.originalname)}`, path.extname(file.originalname))
    }
})

var storage_perros = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/img/dog_profiles/')
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.perro_id}${path.extname(file.originalname)}`, path.extname(file.originalname))
    }
})

router.post(`/api/delete/dog/:id`, (req, res) => {
    var con = mysql.createConnection(config.db_con)
    con.query('USE canine_path;')
    var q = `DELETE FROM perro WHERE id = ${req.params.id}`
    con.query(q, (err, result) => {
        if(err) return res.status(500).send(`failed to delete dog ${req.params.id}`)
    })
    return res.status(200).message(`perro ${req.params.id} deleted`)
})


//Upload picture to file system
router.put('/api/perro/edit/upload_pic/:perro_id', multer({storage: storage_perros}).single("pfp_upload"), (req, res) => {
    return res.status(200).send({message: `image uploaded for ${req.params.perro_id} dog`})
    
    /*var id = req.params.id_perro;
    console.log(`uploading pic for ${id}...`)

    console.log(`${req.body}, ${JSON.stringify(req.body)}`)

    res.status(200).send({message: "ok"})*/
})

router.put('/api/upload/pfp/refugio/', multer({storage: storage_refugios}).single("pfp_upload"),
 (req, res) => {
    if(!req.session.username) return res.redirect('/');
    if(req.session.user_type != "refugio") return res.redirect('/')

    return res.status(200).send({message: `image uploaded for ${req.session.user_type}.${req.session.username}`})

})

router.get('/add_dog', (req, res) => {
    if(!req.session.username) return res.redirect('/')
    var refugio = {};
    var flag = true;
    refugio.username = req.session.username
    //obtener datos del refugio para mostrar en la ventana
    var con = mysql.createConnection(config.db_con);
    con.query('use canine_path;')
    con.query(`select * from refugio where refugio.username = '${refugio.username}'`,
        (err, rows, fields) => {
            if(err) console.log(`error en add dog: ${err}`)
            refugio.id = rows[0].refugio_id;
            refugio.name = rows[0].refugio_name;
            refugio.address = rows[0].address;
            refugio.city = rows[0].city;
            refugio.country = rows[0].country;
            flag = false;
            return res.render('add_perro', {refugio: refugio})
        })
})

router.post('/api/add/perro', (req, res) => {
    var flag = false
    //checar si esta loggeado
    if(!req.session.user_type) return res.redirect('/')
    //checar si es refugio
    if(req.session.user_type != "refugio") return res.redirect('/')

    var con = mysql.createConnection(config.db_con)
    con.query('USE canine_path;')
    //conseguir el id del refugio loggeado
    var q_id = `SELECT id from refugio where refugio.username = '${req.session.username}'`;
    con.query(q_id, (err, rows, fields) => {
        if(err) {
            console.log(`error getting refugio id: ${err}`)
            flag = true;
            return
        }
        console.log(`id del refugio: ${rows[0].id}`)
        var json = req.body
        console.log(`json: ${JSON.stringify(json)}`)

        var q = `INSERT INTO perro(name, race, size,
            weight, sex, age,
            neutered, dewormed, notes, availability,
            id_refugio)
        VALUES(
        '${json.perro_name}', '${json.raza}', ${json.size},
        ${json.weight}, '${json.sex}', ${json.age},
        ${json.neutered}, ${json.dewormed}, '${json.notes}','${json.availability_card}',
        ${rows[0].id}
        );`

        console.log(`query: ${q}`)

        //guardar en perrros
        con.query(q, (err, perro, fields) => {
            if(err) {
                console.log(`error at inserting new dog: ${err}`)
                flag = true;
                return res.status(500)
            }
            //guardar personalidad
            var q_p = `INSERT INTO PERSONALITY(dogs, pets, kids,
                noise, naughty, activity,
                id_perro)
                VALUES('${json.dogs}', '${json.pets}', '${json.kids}',
                '${json.noise}', '${json.naughty}', '${json.activity}',
                ${perro.insertId}
                );`
            con.query(q_p, (err, personlity, fields) => {
                if(err) {
                    console.log(`error at inserting personality: ${err}`)
                    flag = true;
                    return res.status(500)
                }
                flag = true;
                return res.status(200).send({new_dog: perro.insertId})
            })
            flag = true;
            console.log("3333")
            return res.status(200)
        })
        console.log("4444")
        return res.status(200)        
    })

    console.log("55555")
    return res.status(200)
    
    /*console.log(`recibido para add: ${JSON.stringify(req.body)}`)

    var json = req.body;

    var con = mysql.createConnection(config.db_con)
    con.query('USE canine_path;')
    var q = `INSERT INTO perro(name, race, size,
        weight, sex, age,
        neutered, dewormed, availability,
        id_refugio)
	VALUES(
	'${json.perro_name}', '${json.raza}', ${json.size},
    ${json.weight}, '${json.sex}', ${json.age},
    ${json.neutered}, ${json.dewormed}, '${json.availability_card}',
    ${req.session.username}
    );`*/
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
        if(!rows[0]) return ""
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
    var query = `select perro.id, perro.name, perro.race, perro.size, perro.weight,
    perro.sex, perro.age, perro.neutered, perro.dewormed, perro.notes, perro.availability, perro.id_refugio,
    personality.id as personality_id, personality.dogs, personality.pets, personality.kids, personality.noise,
    personality.naughty, personality.activity, personality.id_perro from perro inner join personality on perro.id = personality.id_perro`;
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

    //////////////////PERSONALIDAD
    if(forma.f_p_perros != 'na') {
        if(count > 0) {
            query += ` and personality.dogs = '${forma.f_p_perros}' `
        } else {
            query += ` where personality.dogs = '${forma.f_p_perros}' `
        }
        count++;
    }

    if(forma.f_p_mascotas != 'na') {
        if(count > 0) {
            query += ` and personality.pets = '${forma.f_p_mascotas}' `
        } else {
            query += ` where personality.pets = '${forma.f_p_mascotas}' `
        }
        count++;
    }

    if(forma.f_p_ninios != 'na') {
        if(count > 0) {
            query += ` and personality.kids = '${forma.f_p_ninios}' ` 
        } else {
            query += ` where personality.kids = '${forma.f_p_ninios}' `
        }
        count++
    }

    if(forma.f_p_actividad != 'na') {
        if(count > 0) {
            query += ` and personality.activity = '${forma.f_p_actividad}' `
        } else {
            query += ` where personality.activity = '${forma.f_p_actividad}' `
        }
        count++
    }

    if(forma.f_p_ruido != 'na') {
        if(count > 0) {
            query += ` and personality.noise = '${forma.f_p_ruido}' `
        } else {
            query += ` where personality.noise = '${forma.f_p_ruido}' `
        }
        count++
    }

    if(forma.f_p_travieso != 'na') {
        if(count > 0) {
            query += ` and personality.naughty = '${forma.f_p_travieso}' `
        } else {
            query += ` where personality.naughty = '${forma.f_p_travieso}' `
        }
        count++
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
        console.log(`perros: ${JSON.stringify(rows[0])}`)
        var result = "";
        for(var i = 0; i < perros.length; i++) {
            result += `<a href="perro/${perros[i].id}" class="dog_container_clicker"><div class="dog_container">
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.png">
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
    console.log(`REQ: ${req.params.id}`)
    var con = mysql.createConnection(config.db_con);
    con.query('use canine_path;');
    con.query(`select *, perro.name as perro_name,
    perro.id as perro_id, refugio.id as refugio_id,
    refugio.name as refugio_name, refugio.username as refugio_username
    from perro    
	inner join refugio
    on refugio.id = perro.id_refugio
    inner join personality
    on personality.id_perro = perro.id
    where perro.id = ${req.params.id};`, function(err, rows, fields) {
        var perfil = {};
        if(!rows[0]) {
            return res.redirect('/')
        }
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
        refugio.logo = `/img/refugio_logo/${refugio.id}.png`; //ya no se usa
        refugio.name = rows[0].refugio_name;
        refugio.address = rows[0].address;
        refugio.city = rows[0].city;
        refugio.country = rows[0].country;

        refugio.username = rows[0].refugio_username;

        console.log(`refugio del perro: ${refugio.id}, session: ${req.session.user_type}`)
        if(req.session.user_type == "refugio") {
            console.log(`TEEEEEEEES, REFUGIO: ${refugio.username}, usuario: ${req.session.username}`)
            if(refugio.username == req.session.username) { //perro pertenece a refugio en sesion
                return res.render('perfil_perro_edit', {perfil: perfil, refugio: refugio, perro_id: req.params.id})
            }
        }
        return res.render('perfil_perro', {perfil: perfil, refugio: refugio, perro_id: req.params.id})
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
            <img class="dog_pic" src="/img/dog_profiles/${perros[i].id}.png">
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
 

