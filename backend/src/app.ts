import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import agentRestaurantRoutes from "./routes/agent-restaurant.routes";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
  origin: ['http://localhost:8082', 'http://192.168.1.15:8082', 'exp://192.168.1.15:8082'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agent-restaurant", agentRestaurantRoutes);


export default app;