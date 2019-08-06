create table cognitivetester.usuarios (
    id serial primary key,
    username varchar(30),
    password varchar(60)
);
create table cognitivetester.bots (
    id serial primary key,
    nombre varchar(30),
    usuario varchar(100),
    password varchar(250),
    variable varchar(30),
    workspace_id varchar(100)
);