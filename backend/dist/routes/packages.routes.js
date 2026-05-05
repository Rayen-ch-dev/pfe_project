"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packages_controller_1 = require("../controllers/packages.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * AUTH USER - Get available packages
 */
router.get("/", auth_middleware_1.authMiddleware, packages_controller_1.getPackages);
exports.default = router;
//# sourceMappingURL=packages.routes.js.map