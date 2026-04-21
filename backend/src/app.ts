import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
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

// Debug logging
console.log('Routes registered:');
console.log('- /api/auth');
console.log('- /api/users');
console.log('- /api/agent-restaurant');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

export default app;