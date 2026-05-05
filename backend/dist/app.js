"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = __importDefault(require("./config/cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const agent_restaurant_routes_1 = __importDefault(require("./routes/agent-restaurant.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Use production-ready CORS configuration
app.use((0, cors_1.default)(cors_2.default));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/agent-restaurant", agent_restaurant_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
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
exports.default = app;
//# sourceMappingURL=app.js.map