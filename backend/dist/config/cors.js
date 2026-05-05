"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CORS configuration based on environment
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            // Development - Web (Vite default)
            'http://localhost:5173',
            'http://192.168.1.15:5173',
            // Development - Web (other common ports)
            'http://localhost:3000',
            'http://192.168.1.15:3000',
            'http://localhost:8080',
            'http://192.168.1.15:8080',
            // Development - Mobile Expo
            'exp://192.168.1.15:8081',
            'exp://192.168.1.15:8082',
            // Mobile app (no origin for React Native)
            // Legacy development
            'http://localhost:8082',
            'http://192.168.1.15:8082'
        ];
        // Add production origins from environment if available
        const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const allOrigins = [...allowedOrigins, ...productionOrigins];
        if (process.env.NODE_ENV === 'production') {
            // In production, be more restrictive
            if (allOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'), false);
            }
        }
        else {
            // In development, allow all origins
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count']
};
exports.default = corsOptions;
//# sourceMappingURL=cors.js.map