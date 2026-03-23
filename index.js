const express = require('express')
const { MongoClient } = require("mongodb")

const app = express()
const PORT = process.env.PORT || 3000
const CONNECTION_STRING = process.env.CONNECTION_STRING
const ADMIN_SECRET = 1234

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

let db;

async function connectDB() {
  const client = new MongoClient(CONNECTION_STRING)
  await client.connect
  db = client.db("results_db")
  console.log("Connected to MongoDB")
}

app.get("/pixel", async (req, res) => {
  const { eid = "unkown", to = "unknown" } = req.query

  try {
    await db.collection("results").insertOne({
      emailId: eid,
      recipient: to,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || " ",
      openedAt: new Date()
    })
  } catch (err) {
    console.error("DB insertion failed: ", err.message)
  }

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
  res.send(PIXEL)
})

app.get("/opens", async (req, res) => {
  if (req.query.secret !== ADMIN_SECRET) {
    return res.status(401).send("Unauthorized")
  }

  const opens = await db
    .collection("results")
    .find()
    .sort({ openedAt: -1 })
    .limit(100)
    .toArray()

  res.json(opens)
})

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
})