"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.middleware.js.map