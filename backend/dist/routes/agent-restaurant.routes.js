"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_restaurant_controller_1 = require("../controllers/agent-restaurant.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All agent-restaurant routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Scan student QR code
// GET /api/agent-restaurant/scan/:userId
router.get("/scan/:userId", agent_restaurant_controller_1.scanStudentQR);
exports.default = router;
//# sourceMappingURL=agent-restaurant.routes.js.map