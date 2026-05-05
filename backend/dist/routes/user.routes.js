"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const ticket_controller_1 = require("../controllers/ticket.controller");
const packages_controller_1 = require("../controllers/packages.controller");
const payments_controller_1 = require("../controllers/payments.controller");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const router = (0, express_1.Router)();
/**
 * PUBLIC
 */
router.post("/", user_controller_1.createUser);
/**
 * AUTH USER
 */
router.get("/profile", auth_middleware_1.authMiddleware, user_controller_1.getUserProfile);
router.get("/tickets", auth_middleware_1.authMiddleware, ticket_controller_1.getUserRealTickets);
// Packages and Payments (temporary fix - no auth middleware for testing)
router.get("/packages", packages_controller_1.getPackages);
router.post("/payments/purchase", auth_middleware_1.authMiddleware, payments_controller_1.purchasePackage);
router.post("/payments/custom", auth_middleware_1.authMiddleware, payments_controller_1.purchaseCustomTickets);
// Reservations
router.post("/reservations", auth_middleware_1.authMiddleware, reservation_controller_1.createReservation);
/**
 * ADMIN ONLY
 */
router.get("/", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, user_controller_1.getAllUsers);
router.get("/:id", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, user_controller_1.getUserById);
router.put("/:id", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, user_controller_1.updateUser);
router.delete("/:id", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, user_controller_1.deleteUser);
// Debug logging
console.log('User routes registered:');
console.log('- GET /users/profile');
console.log('- GET /users/tickets');
console.log('- GET /users/packages');
console.log('- POST /users/payments/purchase');
console.log('- POST /users/payments/custom');
console.log('- POST /users/reservations');
exports.default = router;
//# sourceMappingURL=user.routes.js.map