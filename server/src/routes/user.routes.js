import express from "express";
import {
  getDashboard,
  getAllUsers,
  enrollInCourse,
  getUserEnrollments,
  getUserAnalytics, // ✅ add
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", (req, res) => res.json({ message: "Hello from User" }));

router.get("/all", getAllUsers);
router.get("/:userId/dashboard", getDashboard);
router.post("/:userId/enroll/:courseId", enrollInCourse);
router.get("/:userId/enrollments", getUserEnrollments);

// ✅ NEW: analytics for profile graphs
router.get("/:userId/analytics", getUserAnalytics);

export default router;
