import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());

// Connect to DB
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "bank",
  // port: 8889,
});

// help function to make code look nicer
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Generera engångslösenord
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Skapa användare
app.post("/users", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Alla fält måste fyllas i" });
}
  // Kryptera lösenordet innan det hamnar i DB
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const result = await query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );
    const userId = result.insertId;

    // Skapa ett konto för den nya användaren
    await query("INSERT INTO accounts (userId, amount) VALUES (?, ?)", [
      userId,
      0, // Nollställ saldo för det nya kontot
    ]);

    res.status(200).json({ message: "Användare skapad!" });
  } catch (error) {
    res.status(500).json({ message: "Fel vid skapandet av användare!" });
  }
});

// Logga in och skapa/uppdatera sessionens token
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body;

  // 1. Gör SELECT och hämta raden som matchar username
  const result = await query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);

  const user = result[0];

  // 2. Kolla om hash i DB matchar crypterat lösenord
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: "Felaktigt användarnamn eller lösenord" });
  }

  // Generera en ny token
  const token = generateOTP();

  try {
    // Kolla om användaren redan har en session
    const existingSession = await query("SELECT * FROM sessions WHERE userId = ?", [
      user.id,
    ]);

    if (existingSession.length === 0) {
      // Om användaren inte har en befintlig session, skapa en ny session och token
      await query("INSERT INTO sessions (userId, token) VALUES (?, ?)", [
        user.id,
        token,
      ]);
    } else {
      // Om användaren har en befintlig session, uppdatera bara tokenen
      await query("UPDATE sessions SET token = ? WHERE userId = ?", [
        token,
        user.id,
      ]);
    }

    res.status(200).json({ userId: user.id, token });
  } catch (error) {
    console.error("Fel vid hantering av session");
    res.status(500).json({ message: "Fel vid hantering av session" });
  }
});

// Visa saldo
app.post("/me/accounts", async (req, res) => {
  const { token } = req.body;

  try {
    const result = await query(
      "SELECT amount FROM accounts INNER JOIN sessions ON accounts.userId = sessions.userId WHERE token = ?",
      [token]
    );

    if (result.length === 0) {
      return res.status(401).json({ message: "Ogiltig session" });
    }

    res.status(200).json({ saldo: result[0].amount });
  } catch (error) {
    console.error("Fel vid hämtning av saldo");
    res.status(500).json({ message: "Fel vid hämtning av saldo" })
  }
});

// Sätt in pengar på konto
app.post("/me/accounts/transactions", async (req, res) => {
  const { token, amount } = req.body;

  try {
    const sessionResult = await query(
      "SELECT userId FROM sessions WHERE token = ?",
      [token]
    );

    if (sessionResult.length === 0) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const userId = sessionResult[0].userId;

    await query("UPDATE accounts SET amount = amount + ? WHERE userId = ?", [
      amount,
      userId,
    ]);

    const newBalanceResult = await query(
      "SELECT amount FROM accounts WHERE userId = ?",
      [userId]
    );

    res
      .status(200)
      .json({
        message: "Pengar insatta!",
        newBalance: newBalanceResult[0].amount,
      });
  } catch (error) {
    console.error("Fel vid överföringen");
    res.status(500).json({ message: "Fel vid överföringen" })
  }
});

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
