"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackages = void 0;
const prisma_1 = require("../lib/prisma");
const getPackages = async (req, res) => {
    try {
        // Try to get packages from database first
        let packages;
        try {
            packages = await prisma_1.prisma.package.findMany({
                select: {
                    id: true,
                    name: true,
                    price: true,
                    tickets: true,
                },
                orderBy: {
                    price: "asc",
                },
            });
        }
        catch (dbError) {
            console.log("Database error, using mock data:", dbError);
            packages = [];
        }
        // If no packages in database, return mock data
        if (packages.length === 0) {
            packages = [
                {
                    id: "1",
                    name: "Package Étudiant",
                    price: 2.4, // 12 tickets * 0.2 DT
                    tickets: 12,
                },
                {
                    id: "2",
                    name: "Package Premium",
                    price: 4.8, // 24 tickets * 0.2 DT
                    tickets: 24,
                }
            ];
        }
        res.json(packages);
    }
    catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({ error: "Failed to fetch packages" });
    }
};
exports.getPackages = getPackages;
//# sourceMappingURL=packages.controller.js.map