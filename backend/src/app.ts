import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import mealRoutes from "./routes/meal.routes";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/meal", mealRoutes);

export default app;