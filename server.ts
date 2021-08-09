import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes", async (req, res) => {
  const dbres = await client.query("select user_name, description, code from pastebin order by id desc");
   const pastes = dbres.rows;
  // res.json(dbres.rows);
  res.status(200).json({
    pastes,
  });
});

//creat a new paste
app.post("/pastes", async (req,res) => {
  try {
    //console.log(req.body)
    const {user_name, description, code} = req.body

    //console.log({user_name, description, code})
    const text = ("INSERT INTO pastebin (user_name, description, code) VALUES ($1, $2, $3)")
    const values = [user_name, description, code]
    const newPaste = await client.query(text, values)
    res.sendStatus(200)
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

//get a list of all pastes
//app.get("/pastes", async (req, res) => {

//})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
