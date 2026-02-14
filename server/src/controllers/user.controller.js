import {
  getUserById,
  getActiveEnrollmentForUser,
  getPathForUserCourse,
  getAssetById,
} from "../services/dataStore.js";

import User from "../models/User.js";
import Course from "../models/Course.js";
import Attempt from "../models/Attempt.js";
import Asset from "../models/Asset.js";

import Enrollment from "../models/Enrollment.js";
import Path from "../models/Path.js";

// ... keep your existing imports + ok/fail + getDashboard

function makeId(prefix, ...parts) {
  return `${prefix}-${parts.join("-")}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

export const enrollInCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // 1) Validate user + course
    const user = await User.findOne({ userId });
    if (!user) return fail(res, `User not found: ${userId}`, 404);

    const course = await Course.findOne({ courseId, active: true });
    if (!course) return fail(res, `Course not found/active: ${courseId}`, 404);

    if (!Array.isArray(course.moduleAssetIds) || course.moduleAssetIds.length === 0) {
      return fail(res, `Course has no modules (moduleAssetIds empty): ${courseId}`, 400);
    }

    // 1.5) Make all other courses not active
    await Enrollment.updateMany(
      { userId, courseId: { $ne: courseId }, status: "active" },
      { $set: { status: "paused" } }
    );

    // 2) Create Enrollment if not exists
    const enrollmentId = makeId("enr", userId, courseId);

    let enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        enrollmentId,
        userId,
        courseId,
        status: "active",
        enrolledAt: new Date(),
        targetPace: 30,
      });
    } else if (enrollment.status !== "active") {
      enrollment.status = "active";
      await enrollment.save();
    }

    // 3) Create Path if not exists
    const pathId = makeId("path", userId, courseId);

    let path = await Path.findOne({ userId, courseId });
    if (!path) {
      const nodes = course.moduleAssetIds.map((assetId) => ({
        assetId,
        status: "pending",
        addedBy: "engine",
      }));

      path = await Path.create({
        pathId,
        userId,
        courseId,
        nodes,
        currentIndex: 0,
        nextAssetId: nodes[0]?.assetId,
        lastUpdatedReason: "User enrolled. Path created from course modules.",
        etaMinutes: nodes.length * 15,
        updatedAt: new Date(),
      });
    }

    return ok(res, { enrollment, path });
  } catch (error) {
    return fail(res, error.message, 500);
  }
};







function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ ok: false, message });
}

// status helpers (support old + new)
const isCompleted = (s) => s === "completed" || s === "done";
const isSkipped = (s) => s === "skipped";

// Simple ETA: sum expectedTimeMin of remaining (not completed/skipped) nodes from currentIndex
async function computeEtaMinutes(path) {
  if (!path || !Array.isArray(path.nodes)) return 0;

  const start = Math.max(0, Number(path.currentIndex || 0));
  let total = 0;

  for (let i = start; i < path.nodes.length; i++) {
    const node = path.nodes[i];
    if (!node) continue;

    if (isCompleted(node.status) || isSkipped(node.status)) continue;

    const asset = await getAssetById(node.assetId);
    total += asset?.expectedTimeMin || 0;
  }

  return total;
}

// Progress helper
function computeProgress(path) {
  const total = path?.nodes?.length || 0;
  const completed = (path?.nodes || []).filter((n) => isCompleted(n.status)).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

// ✅ GET DASHBOARD
export const getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await getUserById(userId);
    if (!user) return fail(res, `User not found: ${userId}`, 404);

    const enrollment = await getActiveEnrollmentForUser(userId);
    if (!enrollment) return fail(res, `No active enrollment for user: ${userId}`, 404);

    const path = await getPathForUserCourse(userId, enrollment.courseId);
    if (!path) {
      return fail(res, `Path not found for user ${userId} and course ${enrollment.courseId}`, 404);
    }

    const nextAsset = path.nextAssetId ? await getAssetById(path.nextAssetId) : null;
    const etaMinutes = await computeEtaMinutes(path);
    const progress = computeProgress(path);

    // Convert mastery_map (Mongoose Map) to plain object for frontend
    const masteryObj =
      user.mastery_map && typeof user.mastery_map.entries === "function"
        ? Object.fromEntries(user.mastery_map.entries())
        : user.mastery_map || {};

    // ✅ extras for dashboard UI
    const course = await Course.findOne({ courseId: enrollment.courseId }).select(
      "courseId title description skillTags"
    );

    const recentAttempts = await Attempt.find({ userId, courseId: enrollment.courseId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("attemptId topic score timeSpentMin assetId createdAt");

    const assets = await Asset.find().select("assetId topic title");
    const assetIndex = Object.fromEntries(
      assets.map((a) => [a.assetId, { topic: a.topic, title: a.title }])
    );

    // Optional: time efficiency label (simple)
    const timeEfficiency =
      recentAttempts.length >= 1
        ? (recentAttempts[0].timeSpentMin || 0) <= 10
          ? "On Track"
          : "Slow"
        : "On Track";

    const dashboard = {
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        learning_style_preference: user.learning_style_preference,
        format_stats: user.format_stats || {},
        mastery_map: masteryObj,
      },
      course,
      enrollment,
      path,
      nextAsset,
      etaMinutes,
      progress,
      timeEfficiency,
      recentAttempts,
      assetIndex,
      alerts: [],
    };

    return ok(res, dashboard);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};

// ✅ GET ALL USERS (for admin/demo)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("userId name role learning_style_preference");
    return ok(res, users);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};
// ✅ GET ALL ENROLLMENTS FOR USER
export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;

    const enrollments = await Enrollment.find({ userId });

    return ok(res, enrollments);
  } catch (error) {
    return fail(res, error.message, 500);
  }
};


export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("userId name role");
    if (!user) return fail(res, `User not found: ${userId}`, 404);

    const enrollment = await Enrollment.findOne({ userId, status: "active" }).sort({ updatedAt: -1 });
    if (!enrollment) return fail(res, `No active enrollment for user: ${userId}`, 404);

    const courseId = enrollment.courseId;

    // get last 40 attempts (enough for graphs)
    const attempts = await Attempt.find({ userId, courseId })
      .sort({ createdAt: -1 })
      .limit(40)
      .select("attemptId topic score timeSpentMin timeRatio attemptNo format assetDifficulty createdAt assetId");

    // totals
    const totalAttempts = attempts.length;
    const totalTimeMin = attempts.reduce((s, a) => s + (Number(a.timeSpentMin) || 0), 0);
    const avgScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / totalAttempts)
        : 0;

    const avgTimeRatio =
      totalAttempts > 0
        ? Number(
            (attempts.reduce((s, a) => s + (Number(a.timeRatio) || 0), 0) / totalAttempts).toFixed(2)
          )
        : 0;

    // retries: count attempts where attemptNo>1 OR same topic repeated
    const retriesCount = attempts.filter((a) => Number(a.attemptNo || 1) > 1).length;

    // topic retry leaderboard
    const topicStats = {};
    for (const a of attempts) {
      const topic = a.topic || "unknown";
      if (!topicStats[topic]) topicStats[topic] = { topic, attempts: 0, retries: 0, avgScore: 0, _sum: 0 };
      topicStats[topic].attempts += 1;
      if (Number(a.attemptNo || 1) > 1) topicStats[topic].retries += 1;
      topicStats[topic]._sum += Number(a.score) || 0;
    }
    Object.values(topicStats).forEach((t) => {
      t.avgScore = t.attempts ? Math.round(t._sum / t.attempts) : 0;
      delete t._sum;
    });

    const topRetriedTopics = Object.values(topicStats)
      .sort((a, b) => b.retries - a.retries)
      .slice(0, 6);

    // format performance
    const formatStats = {};
    for (const a of attempts) {
      const f = a.format || "unknown";
      if (!formatStats[f]) formatStats[f] = { format: f, attempts: 0, avgScore: 0, _sum: 0 };
      formatStats[f].attempts += 1;
      formatStats[f]._sum += Number(a.score) || 0;
    }
    Object.values(formatStats).forEach((f) => {
      f.avgScore = f.attempts ? Math.round(f._sum / f.attempts) : 0;
      delete f._sum;
    });

    const formatPerformance = Object.values(formatStats).sort((a, b) => b.attempts - a.attempts);

    // score trend graph data (reverse chronological -> chronological)
    const trend = attempts
      .slice()
      .reverse()
      .map((a) => ({
        at: a.createdAt,
        topic: a.topic,
        score: Number(a.score) || 0,
        timeSpentMin: Number(a.timeSpentMin) || 0,
        timeRatio: Number(a.timeRatio) || 0,
      }));

    return ok(res, {
      user: { userId: user.userId, name: user.name, role: user.role },
      courseId,
      totalAttempts,
      retriesCount,
      totalTimeMin,
      avgScore,
      avgTimeRatio,
      topRetriedTopics,
      formatPerformance,
      trend,
      attempts: attempts.slice(0, 10), // quick list if needed
    });
  } catch (e) {
    return fail(res, e.message, 500);
  }
};

