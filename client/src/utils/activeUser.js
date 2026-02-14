// src/utils/activeUser.js

export const DEFAULT_USER_ID = "u-emp-02";

export function getActiveUserId() {
  return localStorage.getItem("activeUserId") || DEFAULT_USER_ID;
}

/**
 * ✅ Updated: can redirect to a safe route after switching user
 * This prevents staying on /admin when you switch to an employee.
 */
export function setActiveUserId(userId, redirectPath = "/") {
  localStorage.setItem("activeUserId", userId);

  // Hard redirect ensures route changes + fresh data load
  window.location.href = redirectPath;
}
