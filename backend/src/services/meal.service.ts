import { pool}  from "../config/db";

export const getTodayMealService = async (userId: string) => {
  // 👤 GET USER
  const user = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [userId]
  );

  if (user.rows.length === 0) {
    return { message: "User not found" };
  }

  // 🍽️ GET TODAY MEAL
  const meals = await pool.query(
    `SELECT * FROM user_meals 
     WHERE user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );

  return {
    user: {
      name: user.rows[0].name,
      lastname: user.rows[0].lastname,
    },
    meals: {
      lunch: ["Chicken", "Rice"],
      dinner: ["Fish", "Salad"],
    },
    totalPrice: 3.5,
    date: new Date(),
  };
};