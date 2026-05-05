"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const agentRestaurant_middleware_1 = require("../middlewares/agentRestaurant.middleware");
const router = (0, express_1.Router)();
// 👁 Get meals count for today
router.get("/today/:userId", auth_middleware_1.authMiddleware, agentRestaurant_middleware_1.agentRestaurantMiddleware, reservation_controller_1.getTodayMealsCount);
// 👁 Scan QR (preview only, no DB update)
router.get("/scan/:userId", auth_middleware_1.authMiddleware, agentRestaurant_middleware_1.agentRestaurantMiddleware, reservation_controller_1.scanReservationPreview);
exports.default = router;
//# sourceMappingURL=agentRestaurant.routes.js.map