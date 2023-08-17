CREATE TABLE if NOT EXISTS users (
    id SERIAL NOT NULL,
    email varchar(70) NOT NULL UNIQUE,
    password varchar(16) NOT NULL,
    login_session varchar(70),
    all_workouts JSONB,
    PRIMARY KEY(id)
);

CREATE TABLE if NOT EXISTS exercises (
    name varchar(70) NOT NULL UNIQUE,
    type varchar(70),
    muscle varchar(70),
    equipment varchar(70),
    difficulty varchar(70),
    instructions varchar(5000),
    PRIMARY KEY(name)
)


