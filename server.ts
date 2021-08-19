import { Client } from "pg";
import { config } from "dotenv";
import express, { query } from "express";
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

//gets all pastes
app.get("/pastes", async (req, res) => {
  try{
  const dbres = await client.query("select * from pastebin order by paste_id desc");
  const pastes = dbres.rows;
  // res.json(dbres.rows);
  res.status(200).json({
    pastes,
  });
} catch (err) {
  console.log(err.message);
  res.sendStatus(500)
}
});

//create a new paste
app.post("/pastes", async (req, res) => {
  try {
    //console.log(req.body)
    const { user_name, description, code } = req.body;
    const text =
      "INSERT INTO pastebin (user_name, description, code) VALUES ($1, $2, $3)";
    const values = [user_name, description, code];
    await client.query(text, values);
    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
});

//deletes selected paste
app.delete("/pastes/:paste_id", async (req, res) => {
  try {
    const { paste_id } = req.params;
    const textComments = "DELETE FROM comments WHERE paste_id = $1";
    const textPaste = "DELETE FROM pastebin WHERE paste_id = $1";
    const values = [paste_id];
    const deleteComments = await client.query(textComments, values)
    const deletePaste = await client.query(textPaste, values);
    res.json("Paste was deleted!");
  } catch (err) {
    console.log(err.message);
  }
});

//edit selected paste
app.put("/pastes/:paste_id", async (req, res) => {
  try {
    const { paste_id } = req.params;
    const { code } = req.body;
    const text = "UPDATE pastebin SET code = $1 WHERE paste_id = $2";
    const values = [code, paste_id];
    const editPaste = await client.query(text, values);
    res.json("Code was updated");
  } catch (err) {
    console.log(err.message);
  }
});

//postcomment route
app.post("/pastes/:paste_id/comments", async (req, res) => {
  try {
    const { paste_id } = req.params
    const { comment } = req.body;
    const text =
      "INSERT INTO comments (comment, paste_id) VALUES ($1, $2)";
    const values = [comment, paste_id];
    
    console.log(paste_id, comment)
    await client.query(text,values)
    res.sendStatus(200);
   
  } catch (err) {
    console.log(err.message);
  }
})

//'SELECT * FROM "Booking" JOIN "User" ON "User.id"="Booking.renter"'
//'SELECT * FROM "Booking" JOIN "User" ON "User"."id"="Booking"."renter"'

//SELECT user_name, description, code, comment
// FROM pastebin
// LEFT JOIN comments
// 	ON pastebin.paste_id = comments.paste_id 

//getcomment route
app.get("/pastes/:paste_id/comments", async (req, res) => {
  try {
    const { paste_id } = req.params
    const text = "SELECT comment_id, comment, comments.paste_id FROM comments LEFT JOIN pastebin ON pastebin.paste_id = comments.paste_id WHERE pastebin.paste_id = $1"
    const values = [paste_id]
    const dbres = await client.query(text, values)
    const comments = dbres.rows
  // res.json(dbres.rows);
  res.status(200).json({
    comments,
  });
  } catch (err) {
    console.log(err.message);
  }
})

//deletecomment route
app.delete("/pastes/:paste_id/comments/:paste_id", async (req, res) => {
  try {
    res.sendStatus(200)
  } catch (err) {
    console.log(err.message)
  }
})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
