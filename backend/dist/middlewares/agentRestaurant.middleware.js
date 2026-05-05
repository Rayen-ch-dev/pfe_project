"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRestaurantMiddleware = void 0;
const agentRestaurantMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "AGENT_RESTAURANT") {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};
exports.agentRestaurantMiddleware = agentRestaurantMiddleware;
//# sourceMappingURL=agentRestaurant.middleware.js.map