"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("../controllers/payments.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * AUTH USER - Purchase operations (allows pending students)
 */
router.post("/purchase", auth_middleware_1.paymentAuthMiddleware, payments_controller_1.purchasePackage);
router.post("/custom", auth_middleware_1.paymentAuthMiddleware, payments_controller_1.purchaseCustomTickets);
exports.default = router;
//# sourceMappingURL=payments.routes.js.map