const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Verbindung zur Datenbank
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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
app.get("/setup-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        company_id INTEGER REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.send("DB Tabellen erstellt 🚀");
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Erstellen");
  }
});
app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
