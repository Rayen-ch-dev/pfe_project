import { pool } from "../config/db";

export const findAll = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};