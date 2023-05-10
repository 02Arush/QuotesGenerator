const express = require("express"); /* Accessing express module */
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

let appUser;
let appPass;

const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION,
};
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://ojas:${password}@cluster0.hbv6gg9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// Get the quotes API
const quotesUrl = 'https://quotes15.p.rapidapi.com/quotes/random/';
const options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '327d3108b6msh75c9d790a3ae65cp187550jsn8738891dcba0',
		'X-RapidAPI-Host': 'quotes15.p.rapidapi.com'
	}
};

process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write("Usage login.js portNumber");
    process.exit(1);
}

const portNumber = process.argv[2];

app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    const variables = {
        port: portNumber,
    };

    response.render("index", variables);
});

app.get("/createAccount", (request, response) => {
    const variables = {
        port: portNumber,
    };

    response.render("createAccount", variables);
});




app.post("/userInfo", (request, response) => {
    const variables = {
        port: portNumber,
        name: request.body.username,
        email: request.body.email,
        pass: request.body.pass
    };

    console.log(variables.pass);

    addToDataBase(
        variables.name,
        variables.email,
        variables.pass
    ).catch(console.error);


    /* Generating HTML using courseInfo template */
    response.render("userInfo", variables);
});

app.post("/loggedIn", (request, response) => {
    let user = request.body.username;
    let pass = request.body.password;

    appUser = user;
    appPass = pass;
    lookUp(user,response,pass).catch(console.error);

});

app.get("/loggedIn/genQuotes", async (request, response) => {
    // Fetch from the API
    try {
        const quoteItems = await fetch(quotesUrl, options);
        const result = await quoteItems.json();
        console.log(result);
        response.render("loggedIn", {userName: appUser, quotes: `<p>${result.content}</p>`})
    } catch (error) {
        console.error(error);
    }
})

const prompt = `Web server started and running at http://localhost:${portNumber}\nStop to shutdown the server:`;
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write(`Invalid Command: ${command}\n`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

async function addToDataBase(name, email, pass) {
    try {
        await client.connect();
        let user = {
            name: `${name}`,
            email: `${email}`,
            password: `${pass}`
        };
        await insertUser(client, databaseAndCollection, user);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertUser(client, databaseAndCollection, newUser) {
    const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(newUser);
}

async function lookUp(user, response, pass) {
    try {
        await client.connect();
        await lookUpOneEntry(
            response,
            client,
            databaseAndCollection,
            user,
            pass
        );
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function lookUpOneEntry(response, client, databaseAndCollection, user,pass) {
    let filter = { name: user , password: pass};
    const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne(filter);

    if (!result) {
        response.send(`No user found with name <strong>${user}</strong><br><br><a href="/">HOME</a>`);
        return;
    }
    response.render("loggedIn", {userName: user, quotes: 'Click the button to generate quotes'});

}




app.listen(portNumber);
