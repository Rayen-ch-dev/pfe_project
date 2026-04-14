import { pool } from "../config/db";

export const createUserService = async (
  firstName: string,
  lastName: string,
  email: string
) => {
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [firstName, lastName, email]
  );

  return result.rows[0];
};
export const getUserByIdService = async (id: string) => {
  const result = await pool.query(
    "SELECT id, first_name, last_name, email FROM users WHERE id = $1",
    [id]
  );

  return result.rows[0];
};