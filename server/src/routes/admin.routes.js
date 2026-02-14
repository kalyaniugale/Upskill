import express from "express";
import {
  createAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  createCourse,
  listCourses,
  updateCourse,
  deleteCourse,
} from "../controllers/admin.controller.js";

const router = express.Router();

/** ASSETS */
router.get("/assets", listAssets);
router.post("/assets", createAsset);
router.put("/assets/:assetId", updateAsset);
router.delete("/assets/:assetId", deleteAsset);

/** COURSES */
router.get("/courses", listCourses);
router.post("/courses", createCourse);
router.put("/courses/:courseId", updateCourse);
router.delete("/courses/:courseId", deleteCourse);

export default router;
