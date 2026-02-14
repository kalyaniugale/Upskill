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

/**
 * API CLIENT
 */
export const api = {

  /* =========================
     USER DASHBOARD + PROFILE
     ========================= */

  // main dashboard data
  getDashboard: (userId) =>
    request(`/api/user/${userId}/dashboard`),

  // list all enrollments for dropdown
  getEnrollments: (userId) =>
    request(`/api/user/${userId}/enrollments`),

  // ⭐ NEW — analytics for profile graphs
  getAnalytics: (userId) =>
    request(`/api/user/${userId}/analytics`),


  /* =========================
     COURSES
     ========================= */

  // list all available courses
  getCourses: () =>
    request(`/api/catalog/courses`),

  // enroll into course (creates enrollment + path)
  enroll: (userId, courseId) =>
    request(`/api/user/${userId}/enroll/${encodeURIComponent(courseId)}`, {
      method: "POST",
    }),


  /* =========================
     ASSETS
     ========================= */

  getAssetById: (assetId) =>
    request(`/api/catalog/assets/${encodeURIComponent(assetId)}`),


  /* =========================
     QUIZ ENGINE
     ========================= */

  getQuiz: (userId, topic) =>
    request(`/api/engine/${userId}/quiz?topic=${encodeURIComponent(topic)}`),

  submitQuiz: (userId, payload) =>
    request(`/api/engine/${userId}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
