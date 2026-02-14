const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Generic request helper
 * Backend response format:
 * { ok: true, data }
 * { ok: false, message }
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let json;

  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok || !json.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return json.data;
}

export const api = {

  /* =========================================
     USER / EMPLOYEE
     ========================================= */

  getDashboard: (userId) =>
    request(`/api/user/${userId}/dashboard`),

  getEnrollments: (userId) =>
    request(`/api/user/${userId}/enrollments`),

  getAnalytics: (userId) =>
    request(`/api/user/${userId}/analytics`),

  /* =========================================
     COURSE CATALOG (EMPLOYEE VIEW)
     ========================================= */

  getCourses: () =>
    request(`/api/catalog/courses`),

  enroll: (userId, courseId) =>
    request(`/api/user/${userId}/enroll/${encodeURIComponent(courseId)}`, {
      method: "POST",
    }),

  /* =========================================
     ASSETS (EMPLOYEE VIEW)
     ========================================= */

  getAssetById: (assetId) =>
    request(`/api/catalog/assets/${encodeURIComponent(assetId)}`),

  /* =========================================
     QUIZ ENGINE
     ========================================= */

  getQuiz: (userId, topic) =>
    request(`/api/engine/${userId}/quiz?topic=${encodeURIComponent(topic)}`),

  submitQuiz: (userId, payload) =>
    request(`/api/engine/${userId}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* =========================================
     ADMIN — ASSET CATALOG MANAGEMENT
     ========================================= */

  adminListAssets: () =>
    request(`/api/admin/assets`),

  adminCreateAsset: (payload) =>
    request(`/api/admin/assets`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminUpdateAsset: (assetId, payload) =>
    request(`/api/admin/assets/${encodeURIComponent(assetId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  adminDeleteAsset: (assetId) =>
    request(`/api/admin/assets/${encodeURIComponent(assetId)}`, {
      method: "DELETE",
    }),

  /* =========================================
     ADMIN — COURSE MANAGEMENT
     ========================================= */

  adminListCourses: () =>
    request(`/api/admin/courses`),

  adminCreateCourse: (payload) =>
    request(`/api/admin/courses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminUpdateCourse: (courseId, payload) =>
    request(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  adminDeleteCourse: (courseId) =>
    request(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
      method: "DELETE",
    }),
};
