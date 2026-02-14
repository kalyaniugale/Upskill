import Asset from "../models/Asset.js";
import Course from "../models/Course.js";

function ok(res, data) {
  return res.json({ ok: true, data });
}
function fail(res, message, status = 400) {
  return res.status(status).json({ ok: false, message });
}

function cleanId(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
}

/* -------------------- ASSETS -------------------- */

// GET /api/admin/assets
export const listAssets = async (req, res) => {
  try {
    const items = await Asset.find().sort({ updatedAt: -1 });
    return ok(res, items);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// POST /api/admin/assets
export const createAsset = async (req, res) => {
  try {
    const {
      assetId,
      title,
      topic,
      format, // video/doc/lab/infographic
      level,  // beginner/intermediate/advanced  (IMPORTANT for engine)
      difficulty,
      prerequisites = [],
      expectedTimeMin,
      url,
    } = req.body;

    if (!title) return fail(res, "title is required");
    if (!topic) return fail(res, "topic is required");
    if (!format) return fail(res, "format is required");
    if (!level) return fail(res, "level is required (beginner/intermediate/advanced)");

    const finalAssetId =
      assetId && assetId.trim()
        ? cleanId(assetId)
        : cleanId(`asset-${topic}-${level}-${format}-${Date.now()}`);

    const exists = await Asset.findOne({ assetId: finalAssetId });
    if (exists) return fail(res, `assetId already exists: ${finalAssetId}`, 409);

    const doc = await Asset.create({
      assetId: finalAssetId,
      title,
      topic: cleanId(topic),
      format: cleanId(format),
      level: cleanId(level),
      difficulty: Number.isFinite(Number(difficulty)) ? Number(difficulty) : 1,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      expectedTimeMin: Number.isFinite(Number(expectedTimeMin)) ? Number(expectedTimeMin) : 10,
      url: url || "",
    });

    return ok(res, doc);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// PUT /api/admin/assets/:assetId
export const updateAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const patch = { ...req.body };

    // normalize important fields if present
    if (patch.topic) patch.topic = cleanId(patch.topic);
    if (patch.format) patch.format = cleanId(patch.format);
    if (patch.level) patch.level = cleanId(patch.level);

    const updated = await Asset.findOneAndUpdate({ assetId }, patch, { new: true });
    if (!updated) return fail(res, `Asset not found: ${assetId}`, 404);

    return ok(res, updated);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// DELETE /api/admin/assets/:assetId
export const deleteAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const deleted = await Asset.findOneAndDelete({ assetId });
    if (!deleted) return fail(res, `Asset not found: ${assetId}`, 404);
    return ok(res, { deleted: true, assetId });
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

/* -------------------- COURSES -------------------- */

// GET /api/admin/courses
export const listCourses = async (req, res) => {
  try {
    const items = await Course.find().sort({ updatedAt: -1 });
    return ok(res, items);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// POST /api/admin/courses
export const createCourse = async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      skillTags = [],
      moduleAssetIds = [],
      createdBy = "admin",
      active = true,
    } = req.body;

    if (!title) return fail(res, "title is required");
    if (!Array.isArray(moduleAssetIds) || moduleAssetIds.length === 0) {
      return fail(res, "moduleAssetIds[] is required (at least 1 assetId)");
    }

    // validate assets exist (IMPORTANT so employee doesn't get broken path)
    const assetsFound = await Asset.find({ assetId: { $in: moduleAssetIds } }).select("assetId");
    const foundSet = new Set(assetsFound.map((a) => a.assetId));
    const missing = moduleAssetIds.filter((id) => !foundSet.has(id));
    if (missing.length) return fail(res, `Missing assetIds: ${missing.join(", ")}`, 400);

    const finalCourseId =
      courseId && courseId.trim() ? cleanId(courseId) : cleanId(`course-${title}-${Date.now()}`);

    const exists = await Course.findOne({ courseId: finalCourseId });
    if (exists) return fail(res, `courseId already exists: ${finalCourseId}`, 409);

    const doc = await Course.create({
      courseId: finalCourseId,
      title,
      description: description || "",
      skillTags: Array.isArray(skillTags) ? skillTags : [],
      moduleAssetIds,
      createdBy,
      active: Boolean(active),
    });

    return ok(res, doc);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// PUT /api/admin/courses/:courseId
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const patch = { ...req.body };

    // if moduleAssetIds updated, validate again
    if (patch.moduleAssetIds) {
      if (!Array.isArray(patch.moduleAssetIds) || patch.moduleAssetIds.length === 0) {
        return fail(res, "moduleAssetIds[] must be a non-empty array", 400);
      }
      const assetsFound = await Asset.find({ assetId: { $in: patch.moduleAssetIds } }).select("assetId");
      const foundSet = new Set(assetsFound.map((a) => a.assetId));
      const missing = patch.moduleAssetIds.filter((id) => !foundSet.has(id));
      if (missing.length) return fail(res, `Missing assetIds: ${missing.join(", ")}`, 400);
    }

    const updated = await Course.findOneAndUpdate({ courseId }, patch, { new: true });
    if (!updated) return fail(res, `Course not found: ${courseId}`, 404);

    return ok(res, updated);
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

// DELETE /api/admin/courses/:courseId
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const deleted = await Course.findOneAndDelete({ courseId });
    if (!deleted) return fail(res, `Course not found: ${courseId}`, 404);
    return ok(res, { deleted: true, courseId });
  } catch (e) {
    return fail(res, e.message, 500);
  }
};
