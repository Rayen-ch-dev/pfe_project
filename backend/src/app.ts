import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import agentRestaurantRoutes from "./routes/agent-restaurant.routes";
import adminRoutes from "./routes/admin.routes";
import cookieParser from "cookie-parser";

const app = express();

// Use production-ready CORS configuration
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase payload limit to 10mb for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agent-restaurant", agentRestaurantRoutes);
app.use("/api/admin", adminRoutes);

// Debug logging
console.log('Routes registered:');
console.log('- /api/auth');
console.log('- /api/users');
console.log('- /api/agent-restaurant');
console.log('- /api/admin');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

export default app;