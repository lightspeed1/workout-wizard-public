const express = require('express');

const pg = require('pg');

const fs = require('fs');

//connect to postgres database

const client = new pg.Client({
    host: 'HOST',
    port: 9999,
    database: 'DATABASE',
    user: 'USER',
    password: 'PASSWORD'
});



//After connecting, create postgres tables for users and exercises if they don't already exist
client.connect((e) =>
{
    if(e)
    {
        console.log("ERROR: client cannot connect ", e.stack);
        return;
    }
    console.log("Successfully connected client.");
    
    fs.readFile("create.sql", "utf8", (err1, createTableQuery) => {
        if(err1)
        {
            console.log("ERROR: CANNOT READ create.sql FROM FILESYSTEM. ", err1);
            return;
        }
        console.log("Read create.sql.");
        client.query(createTableQuery, (err2, res) => {
            if(err2)
            {
                console.log("POSTGRES ERROR\n", err2.stack);
                return;
            }
            console.log("Successfully executed create.sql.");
        });
    });
});


const app = express();
const path = require('path');
const { create } = require('domain');
const { execSync } = require('child_process');



app.use(express.static(path.join(__dirname, "/public")));

app.use(express.json());


//extract a cookie from the large cookie string sent by the client
function getCookie(headers, cookieName)
{
    let cookiesString = headers.cookie;
    if(!cookiesString)
        return "";
    const ind = cookiesString.indexOf(cookieName + "=");
    if(ind == -1)
        return "";
    const cutoff = ind + cookieName.length + 1;
    return cookiesString.substring(cutoff).split(";")[0];
}

const expireObject = {expires: new Date("9999-9-9")};


//homepage
app.get("/", (req, res) => {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, "index.html"));
});


//If user goes to signup page, redirect them to the workouts page if they are logged in otherwise let them go
app.get("/signup", async (req, res) => {
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    if(userEmail !== "")
        res.redirect("/myworkouts");
    else
        res.sendFile(path.join(__dirname, "/signup.html"));
    
});


//Create random string for session cookie
function randomString()
{
    let len = 70;
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randStr = "";
    while(len > 0)
    {
        randStr += characters[Math.floor(Math.random() * characters.length)];
        len--;
    }
    return randStr;
}

//Create a session cookie, which verifies that the user is who they say they are.
async function createSessionCookie(response, userInfo)
{
    let sessionCookieStr = randomString();
    response.cookie("login_session", sessionCookieStr, expireObject);
    try 
    {
        await client.query("UPDATE users SET login_session = $1 WHERE email = $2;", [sessionCookieStr, userInfo.email]);
    } catch(err2) {
        console.log("POSTGRES ERROR, setting login cookie failed.\n", err2.stack);
        return;
    }
}

//Send the workouts page. redirect user to login page if they aren't logged in
app.get("/myworkouts", (req, res) => {
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    if(userEmail == "")
    {
        res.redirect("/login");
        return;
    }
    res.sendFile(path.join(__dirname, "/myworkouts.html"));
});

//Send the do workout page. Redirect to login if user isn't logged in.
app.get("/doworkout", (req, res) => {
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    if(userEmail == "")
    {
        res.redirect("/login");
        return;
    }
    res.sendFile(path.join(__dirname, "/doworkout.html"));
});

//Endpoint to create an account with a username and password. Creates session cookie and sends it to user.
app.post("/createaccount", async (req, res) => {
    console.log("CREATING ACCOUNT");
    let user = req.body;
    try
    {
        await client.query("INSERT INTO users(id, email, password, all_workouts) VALUES(DEFAULT, $1, $2, '{}'::jsonb);", [user.email, user.password]);
    }
    catch(err)
    {
        console.log("POSTGRES ERROR\n", err.stack);
        res.status(400).send({message: "Email already registered."});
        return;
    }
    res.cookie("email", user.email, expireObject);
    await createSessionCookie(res, user);
    res.status(200).send({message: "Successfuly created account."});
});


//endpoint that sends user login page, or redirects them to my workouts page if they are logged in
//NOTE: this endpoint isn't responsible for actually logging in the user. /postloginendpoint does that.
app.get("/login", async (req, res) => {
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    if(userEmail != "")
        res.redirect("/myworkouts");
    else
        res.sendFile(path.join(__dirname, "/login.html"));
    // res.end();
});

//log out the user
app.get("/postlogout", (req, res) => {
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    client.query("UPDATE users SET login_session = '' WHERE email = $1;", [userEmail]);
    res.clearCookie("login_session");
    res.clearCookie("email");
    res.end();
});

//login the user and give their client a session cookie
app.post("/postloginendpoint", async (req, res) => {
    let user = req.body;
    //first check already logged in. This could potentially be on a another device
    let queryResult = null;
    try 
    {
        queryResult = await client.query("SELECT * FROM users WHERE email = $1;", [user.email]);
    }
    catch (err) 
    {
        console.log("POSTGRES ERROR\n", err.stack);
        return;
    }
    let resUser = queryResult.rows[0];
    if(!resUser)
        res.status(400).send({message: "Email isn't registered."});
    else if(resUser.login_session)
        res.status(400).send({message: "User is already logged in."});

    else if(resUser.password === user.password)
    {
        await createSessionCookie(res, user);
        res.cookie("email", user.email, expireObject);
        res.status(200).send({message : "Successfully logged in."});
    }
    else
    {
        res.status(400).send({message: "Incorrect password."}); 
    }
});

//update workout information (sets and reps for each exercise, also weight) when they complete a workout
app.post("/updateworkouts", async (req, res) => {
    let allWorkouts = req.body;
    let sessionCookie = getCookie(req.headers, "login_session");
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));

    let sub = "";
    let values = [];
    let modedObj = JSON.parse(JSON.stringify(allWorkouts));
    let parameterCount = 1;
    for(i in modedObj)
    {
        let currWorkout = modedObj[i];
        for(let j = 0; j < currWorkout.length; j++)
        {
            let {lastWorkout, ...rest} = currWorkout[j];
            sub += (parameterCount == 1 ? "" : ",") + "(";
            for(x in rest)
            {
                sub += `$${parameterCount},`;
                parameterCount++;
            }
            sub = sub.slice(0, sub.length - 1) + ")";
            currWorkout[j] = {"name": currWorkout[j].name, "lastWorkout": currWorkout[j].lastWorkout};
            values.push(...Object.values(rest));
        }
    }

    if(values.length > 0)
    {
        await client.query(`INSERT INTO exercises VALUES ${sub} ON CONFLICT DO NOTHING;`, values);
    }

    let strObj = JSON.stringify(modedObj);

    //then, add allWorkouts as json to the all_workouts field in the row corresponding to current user.
    await client.query("UPDATE users SET all_workouts = $1::jsonb WHERE email = $2 and login_session = $3;", [strObj, userEmail, sessionCookie]);
    res.sendStatus(200);
});


//get all workouts user has saved from postgres
app.get("/getuserworkouts", async (req, res) => {
    //first query database for all_workouts of user
    let userEmail = decodeURIComponent(getCookie(req.headers, "email"));
    
    let sessionCookie = getCookie(req.headers, "login_session");

    let namesQuery = await client.query("SELECT * FROM users WHERE email = $1", [userEmail]);
    let user = namesQuery.rows[0];

    if(sessionCookie != user.login_session)
    {
        res.status(400).send({message: "You don't have the correct login cookie for this account."});
        return;
    }
    let modedWorkoutsObj = user.all_workouts;
    let infoQuery = await client.query("select * from exercises where name in (select jsonb_array_elements(workouts.value)->'name'#>>'{}' from jsonb_each($1::jsonb) AS workouts);", [modedWorkoutsObj]);
    let exercisesArr = infoQuery.rows;
    let exercisesObj = {};
    exercisesArr.forEach(x => { exercisesObj[x.name] = x;});
    for(key in modedWorkoutsObj)
    {
        curr = modedWorkoutsObj[key];
        for(let j = 0; j < curr.length; j++)
        {
            curr[j] = {...exercisesObj[curr[j].name], lastWorkout : curr[j].lastWorkout};
        }
    }
    //now we return modedWorkoutsObj
    res.status(200).send(modedWorkoutsObj);
});

app.listen(process.env.PORT || 3000, () => console.log("App available on http://localhost:3000"));