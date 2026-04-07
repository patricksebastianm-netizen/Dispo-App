const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Verbindung zur Datenbank
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Test Route
app.get("/", (req, res) => {
  res.send("Backend läuft 🚀");
});

// Test Datenbank
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Fehler");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
