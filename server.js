const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey"; // später ändern!
const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(cors());
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
app.post("/register", async (req, res) => {
  const { email, password, role, company_id } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password, role, company_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashedPassword, role, company_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Registrieren");
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("User nicht gefunden");
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).send("Falsches Passwort");
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, company_id: user.company_id },
      SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Login Fehler");
  }
});
