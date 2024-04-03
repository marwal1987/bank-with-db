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

// Generera token
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Routes Endpoints

// Skapa användare
app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  // Kryptera lösenordet innan det hamnar i DB
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  console.log("Hashed password: ", hashedPassword); // Ta bort sen!

  try {
    const result = await query(
      "INSERT INTO users (username, password ) VALUES (?, ?)",
      [username, hashedPassword]
    );
    
    res.status(201).send("User created");
  } catch (error) {
    console.error("Error creating user");
    res.status(500).send("Error creating user");
  }
});

// Logga in och skapa session
app.post("/session", async (req, res) => {
    const { username, password } = req.body;
  
    // 1. Gör SELECT och hämta raden som matchar username
    const result = await query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    console.log("result: ", result);
  
    const user = result[0];

  
    // 2. Kolla om hash i DB matchar crypterat lösenord
    const passwordMatch = await bcrypt.compare(password, user.password);
  
    if (!passwordMatch) {
      return res.status(401).send("Invalid username or password");
    }
    
    const token = generateOTP();
        sessions.push({ userId: user.id, token }); // Göra om till INSERT INTO sessions 
        res.status(200).json({ userId: user.id, token });
    res.send("Login successful");
    
  });


// // Visa saldo
// app.post("/me/accounts", (req, res) => {
//   const { token } = req.body;
//   const session = sessions.find((session) => session.token === token);
//   if (!session) {
//     res.status(401).json({ message: "Ogiltig session" });
//   } else {
//     const account = accounts.find(
//       (account) => account.userId === session.userId
//     );
//     res.status(200).json({ saldo: account.amount });
//   }
// });

// // Sätt in pengar på konto
// app.post("/me/accounts/transactions", (req, res) => {
//   const { token, amount } = req.body;
//   const session = sessions.find((session) => session.token === token);
//   if (!session) {
//     res.status(401).json({ message: "Ogiltig session" });
//   } else {
//     const account = accounts.find(
//       (account) => account.userId === session.userId
//     );
//     account.amount += amount;
//     res
//       .status(200)
//       .json({ message: "Pengar insatta!", newBalance: account.amount });
//   }
// });

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
