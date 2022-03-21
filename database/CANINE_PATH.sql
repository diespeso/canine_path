CREATE DATABASE canine_path;
USE canine_path;
/*
DROP TABLE PERRO;
DROP TABLE REFUGIO;
DROP TABLE PERSONALITY;
*/
CREATE TABLE refugio(
	id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(60) NOT NULL,
    address VARCHAR(60) NOT NULL,
    city VARCHAR(30) NOT NULL,
    country VARCHAR(30) NOT NULL,
    phone VARCHAR(25)
);

ALTER TABLE refugio
	ADD COLUMN description VARCHAR(500) AFTER phone;


CREATE TABLE perro(
	id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    race VARCHAR(30),
    size FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    sex VARCHAR(10) NOT NULL,
    age FLOAT,
    neutered BOOL,
    dewormed BOOL,
    notes VARCHAR(280),
    availability VARCHAR(15) NOT NULL,
    id_refugio INT NOT NULL,
    FOREIGN KEY (id_refugio)
		REFERENCES refugio(id)
		ON DELETE CASCADE
);

ALTER TABLE perro
	ADD CONSTRAINT check_availability CHECK (availability IN ('NO DISPONIBLE', 'ADOPTABLE', 'ADOPTADO')),
	ADD CONSTRAINT check_sex CHECK (sex IN ('MACHO', 'HEMBRA'))
;

CREATE TABLE personality( -- VALUES: BIEN, REGULAR, MALO, DESCONOCIDO 
	id INT PRIMARY KEY AUTO_INCREMENT,
    dogs VARCHAR(15),
    pets VARCHAR(15),
    kids VARCHAR(15),
    noise VARCHAR(15), -- MUCHO / POCO / REGULAR
	naughty VARCHAR(15), -- VALUES ON TOP
    activity VARCHAR(15), -- VALUES: MUY ACTIVO / REGULAR / PEREZOSO
    id_perro INT NOT NULL UNIQUE,
    FOREIGN KEY (id_perro)
		REFERENCES perro(id)
        ON DELETE CASCADE		
);

ALTER TABLE personality
	ADD CONSTRAINT check_dogs CHECK (dogs IN ('BIEN', 'REGULAR', 'MALO', 'DESCONOCIDO')),
    ADD CONSTRAINT check_pets CHECK (pets IN ('BIEN', 'REGULAR', 'MALO', 'DESCONOCIDO')),
    ADD CONSTRAINT check_kids CHECK (kids IN ('BIEN', 'REGULAR', 'MALO', 'DESCONOCIDO')),
    ADD CONSTRAINT check_noise CHECK (noise IN ('POCO', 'REGULAR', 'MUCHO', 'DESCONOCIDO')),
    ADD CONSTRAINT check_naughty CHECK (naughty IN ('BIEN', 'REGULAR', 'MALO', 'DESCONOCIDO')),
    ADD CONSTRAINT check_activity CHECK (activity IN ('MUY ACTIVO', 'REGULAR', 'PEREZOSO', 'DESCONOCIDO'))
;

INSERT INTO refugio(username, name, address, city, country, phone)
	VALUES(
	'mirasoles', 'refugio de los mirasoles', 'colonia de los altos', 'tijuana', 'mexico', '6645670909'
);

INSERT INTO refugio(username, name, address, city, country, phone)
	VALUES(
	'cuddle buddies', 'refugio cuddle buddies', 'colonia de morelos', 'monterrey', 'mexico', '5435670909'
);

INSERT INTO perro(name, race, size, weight, sex, age, neutered, dewormed, availability, id_refugio)
	VALUES(
	'manchas', 'pastor aleman', 0.89, 12.5, 'MACHO', 3, TRUE, TRUE, 'ADOPTABLE', 1 
);
INSERT INTO perro(name, race, size, weight, sex, age, neutered, dewormed, availability, id_refugio)
	VALUES(
	'copito', 'border collie', 0.69, 10.4, 'MACHO', 1, TRUE, TRUE, 'ADOPTABLE', 1 
);
INSERT INTO perro(name, race, size, weight, sex, age, neutered, dewormed, availability, id_refugio)
	VALUES(
	'estrellita', 'chihuahua', 0.20, 2.5, 'HEMBRA', 1, TRUE, TRUE, 'ADOPTADO', 1 
); 
INSERT INTO perro(name, race, size, weight, sex, age, neutered, dewormed, availability, id_refugio)
	VALUES(
	'juanchito', 'chihuahua', 0.1, 2.53, 'MACHO', 1, FALSE, TRUE, 'NO DISPONIBLE', 2 
);  

INSERT INTO PERSONALITY(dogs, pets, kids, noise, naughty, activity, id_perro)
	VALUES('BIEN', 'REGULAR', 'MALO', 'MUCHO', 'DESCONOCIDO', 'MUY ACTIVO', 1
);
INSERT INTO PERSONALITY(dogs, pets, kids, noise, naughty, activity, id_perro)
	VALUES('BIEN', 'REGULAR', 'BIEN', 'MUCHO', 'DESCONOCIDO', 'PEREZOSO', 2
);
INSERT INTO PERSONALITY(dogs, pets, kids, noise, naughty, activity, id_perro)
	VALUES('BIEN', 'MALO', 'BIEN', 'MUCHO', 'DESCONOCIDO', 'MUY ACTIVO', 3
);
INSERT INTO PERSONALITY(dogs, pets, kids, noise, naughty, activity, id_perro)
	VALUES('BIEN', 'MALO', 'MALO', 'MUCHO', 'DESCONOCIDO', 'MUY ACTIVO', 4
);

UPDATE personality
	SET dogs = 'OK'
		WHERE personality.id_perro = 1;
SELECT * FROM refugio;
SELECT * FROM perro;
SELECT * FROM personality;
    
select *, perro.name as perro_name, perro.id as perro_id, refugio.id as refugio_id from perro    
	inner join refugio
    on refugio.id = perro.id_refugio
    inner join personality
    on personality.id_perro = perro.id
    where perro.id = 1;   
    
select *, perro.name as perro_name from perro;


-- for one refugio, all the dogs
select *, perro.id as perro_id, perro.name as perro_name
        from refugio
        inner join perro
            on refugio.id = perro.id_refugio
		where refugio.id = 2;
        
select count(if(availability = 'ADOPTABLE', 1, NULL)) 'adoptables',
	count(if(availability = 'ADOPTADO', 1, NULL)) 'adoptados',
    count(if(availability = 'NO DISPONIBLE', 1, NULL)) 'no_disponibles'
	from perro
    WHERE perro.id_refugio = 1;
    
select * from perro
	where id_refugio = 2;
    
