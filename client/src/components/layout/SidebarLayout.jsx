// SidebarLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./SidebarLayout.css";
import { api } from "../../services/api";
import { displayName } from "../../utils/displayName";
import { getActiveUserId, setActiveUserId } from "../../utils/activeUser";

export default function SidebarLayout() {
  const nav = useNavigate();
  const location = useLocation();

  const userId = getActiveUserId();

  const [dashboard, setDashboard] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [open, setOpen] = useState(false);

  const role = dashboard?.user?.role || "employee";
  const isAdmin = role === "admin";

  // Load dashboard + enrollments
  useEffect(() => {
    (async () => {
      try {
        const d = await api.getDashboard(userId);
        setDashboard(d);

        // ✅ Only employees need enrollments
        if (d?.user?.role !== "admin") {
          const all = await api.getEnrollments(userId);
          setEnrollments(all || []);
        } else {
          setEnrollments([]);
        }
      } catch (e) {
        console.error("Sidebar load failed:", e);
      }
    })();
  }, [userId]);

  // ✅ If role changes OR route not allowed -> redirect to safe home
  useEffect(() => {
    if (!dashboard?.user?.role) return;

    const currentPath = location.pathname;

    // admin route allow list
    const adminAllowed = ["/admin"];
    // employee route allow list
    const employeeAllowed = ["/", "/courses", "/path", "/quiz", "/profile"];

    if (isAdmin) {
      if (!adminAllowed.includes(currentPath)) nav("/admin", { replace: true });
    } else {
      if (!employeeAllowed.includes(currentPath)) nav("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, dashboard?.user?.role]);

  const isActive = (path) => location.pathname === path;

  const currentCourseTitle = useMemo(() => {
    return displayName(
      { title: dashboard?.course?.title, courseId: dashboard?.course?.courseId },
      { fallback: "Select Course", maxLen: 30 }
    );
  }, [dashboard]);

  async function switchCourse(courseId) {
    await api.enroll(userId, courseId);
    setOpen(false);
    window.location.reload();
  }

  function handleSwitchUser(newUserId) {
    // ✅ setActiveUserId reloads, but we can also set a hint route before reload
    // to avoid staying on /admin when going to employee
    if (newUserId?.includes("admin")) {
      localStorage.setItem("nextRouteAfterSwitch", "/admin");
    } else {
      localStorage.setItem("nextRouteAfterSwitch", "/");
    }
    setActiveUserId(newUserId);
  }

  // ✅ after reload, redirect once
  useEffect(() => {
    const next = localStorage.getItem("nextRouteAfterSwitch");
    if (next) {
      localStorage.removeItem("nextRouteAfterSwitch");
      nav(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ss-shell">
      <aside className="ss-sidebar">
        <div className="ss-brand" onClick={() => nav(isAdmin ? "/admin" : "/")}>
          <div className="ss-logo">⚡</div>
          <div className="ss-brand-name">SkillStream</div>
        </div>

        <div className="ss-subtitle">Dynamic Upskilling Engine</div>

        {/* ✅ NAV */}
        <nav className="ss-nav">
          {/* EMPLOYEE NAV */}
          {!isAdmin && (
            <>
              <button
                className={`ss-navitem ${isActive("/") ? "active" : ""}`}
                onClick={() => nav("/")}
              >
                <span className="ss-ico">●</span> Dashboard
              </button>

              <button
                className={`ss-navitem ${isActive("/courses") ? "active" : ""}`}
                onClick={() => nav("/courses")}
              >
                <span className="ss-ico">▦</span> Courses
              </button>

              <button
                className={`ss-navitem ${isActive("/path") ? "active" : ""}`}
                onClick={() => nav("/path")}
              >
                <span className="ss-ico">⧉</span> My Path
              </button>

              <button
                className={`ss-navitem ${isActive("/quiz") ? "active" : ""}`}
                onClick={() => nav("/quiz")}
              >
                <span className="ss-ico">☑</span> Quiz
              </button>

              {/* ✅ Profile only for employee */}
              <button
                className={`ss-navitem ${isActive("/profile") ? "active" : ""}`}
                onClick={() => nav("/profile")}
              >
                <span className="ss-ico">👤</span> Profile
              </button>
            </>
          )}

          {/* ADMIN NAV */}
          {isAdmin && (
            <button
              className={`ss-navitem ${isActive("/admin") ? "active" : ""}`}
              onClick={() => nav("/admin")}
            >
              <span className="ss-ico">⚙</span> Admin Catalog
            </button>
          )}
        </nav>

        <div className="ss-sidebottom">
          {/* ✅ Click user block: employee->profile, admin->admin */}
          <div
            className="ss-user"
            onClick={() => nav(isAdmin ? "/admin" : "/profile")}
            style={{ cursor: "pointer" }}
          >
            <div className="ss-useravatar">
              {(dashboard?.user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="ss-usertext">
              <div className="ss-username">{dashboard?.user?.name || "User"}</div>
              <div className="ss-userrole">
                {displayName(dashboard?.user?.role || "employee", { maxLen: 14 })}
              </div>
            </div>
            <div className="ss-usercaret">▾</div>
          </div>

          {/* demo user switch */}
          <div className="ss-sideactions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ss-linkbtn" onClick={() => handleSwitchUser("u-emp-01")}>
              u-emp-01
            </button>
            <button type="button" className="ss-linkbtn" onClick={() => handleSwitchUser("u-emp-02")}>
              u-emp-02
            </button>
            <button type="button" className="ss-linkbtn" onClick={() => handleSwitchUser("u-emp-03")}>
              u-emp-03
            </button>
            <button type="button" className="ss-linkbtn" onClick={() => handleSwitchUser("u-admin-01")}>
              u-admin-01
            </button>
          </div>
        </div>
      </aside>

      <main className="ss-main">
        {/* ✅ TOPBAR */}
        <div className="ss-topbar">
          {/* ✅ Course dropdown ONLY for employee */}
          {!isAdmin && (
            <div
              className="ss-course"
              onClick={() => setOpen((v) => !v)}
              role="button"
              tabIndex={0}
            >
              <div className="ss-course-name">{currentCourseTitle}</div>
              <div className="ss-course-caret">▾</div>
            </div>
          )}

          {/* dropdown */}
          {!isAdmin && open && (
            <div className="ss-dropdown">
              {enrollments.length === 0 ? (
                <div className="ss-dropdown-item" style={{ opacity: 0.7 }}>
                  No enrollments yet
                </div>
              ) : (
                enrollments.map((e) => {
                  const active = e.status === "active";
                  return (
                    <div
                      key={e.enrollmentId || `${e.userId}-${e.courseId}`}
                      className={`ss-dropdown-item ${active ? "active" : ""}`}
                      onClick={() => switchCourse(e.courseId)}
                    >
                      {displayName(e.courseId, { maxLen: 32 })}
                      <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>
                        {active ? "• Active" : ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="ss-topright">
            <span className="ss-dot" />
            <span>Connected</span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
