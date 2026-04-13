import express from "express";
import { pool } from "./config/db";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "PostgreSQL connected ✅",
      time: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed ❌" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});