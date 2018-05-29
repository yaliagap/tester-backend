create table cognitivetester.usuarios (
    id serial primary key,
    username varchar(30),
    password varchar(60)
);
create table cognitivetester.bots (
    id serial primary key,
    nombre varchar(30),
    usuario varchar(60),
    password varchar(15),
    variable varchar(30),
    workspace_id varchar(60)
);