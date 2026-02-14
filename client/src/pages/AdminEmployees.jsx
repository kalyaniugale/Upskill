import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getActiveUserId } from "../utils/activeUser";
import "./adminEmployees.css";

function fmtDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return "";
  }
}

function pillTone({ atRisk, avgScore }) {
  if (atRisk) return "bad";
  if (avgScore >= 85) return "good";
  if (avgScore >= 60) return "mid";
  return "warn";
}

export default function AdminEmployees() {
  const adminId = getActiveUserId();

  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [data, setData] = useState(null);
  const [showNames, setShowNames] = useState(false); // ✅ privacy-first default OFF

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const dash = await api.getDashboard(adminId);
      setRole(dash?.user?.role || "employee");

      const d = await api.adminEmployees(adminId);
      setData(d);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const cards = useMemo(() => data?.cards || [], [data]);
  const metrics = data?.metrics || { employees: 0, atRisk: 0, avgScore: 0 };

  if (!loading && role !== "admin") {
    return (
      <div className="ae-wrap">
        <div className="ae-card">
          <div className="ae-title">Admin Access Required</div>
          <div className="ae-sub">Switch active user to an admin account.</div>
          {msg && <div className="ae-msg bad">{msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ae-wrap">
      <div className="ae-head">
        <div>
          <div className="ae-title">Employees Overview</div>
          <div className="ae-sub">Privacy-first team analytics (no micro-tracking)</div>
        </div>

        <div className="ae-actions">
          <label className="ae-toggle">
            <input
              type="checkbox"
              checked={showNames}
              onChange={(e) => setShowNames(e.target.checked)}
            />
            <span>Show Names (demo)</span>
          </label>

          <button className="ae-btn" onClick={load} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {msg && <div className={`ae-msg ${msg.startsWith("✅") ? "good" : "bad"}`}>{msg}</div>}

      {/* top metrics */}
      <div className="ae-metrics">
        <Metric label="Employees" value={metrics.employees} />
        <Metric label="Avg Score" value={`${metrics.avgScore}%`} />
        <Metric label="At Risk" value={metrics.atRisk} tone={metrics.atRisk > 0 ? "bad" : "good"} />
      </div>

      {loading ? (
        <div className="ae-card">Loading…</div>
      ) : (
        <div className="ae-grid">
          {cards.map((c) => (
            <div className="ae-emp" key={c.userId}>
              <div className="ae-empTop">
                <div className="ae-avatar">
                  {(showNames ? c.name : c.anonLabel).slice(0, 1).toUpperCase()}
                </div>

                <div className="ae-empTitle">
                  <div className="ae-name">{showNames ? c.name : c.anonLabel}</div>
                  <div className="ae-mini">
                    Preferred: <b>{c.preferred}</b> • Enrollments: <b>{c.enrollments}</b>
                  </div>
                </div>

                <span className={`ae-pill ${pillTone(c)}`}>
                  {c.atRisk ? "At Risk" : "Healthy"}
                </span>
              </div>

              <div className="ae-row">
                <Stat label="Progress" value={`${c.progressPct}%`} />
                <Stat label="Avg Score" value={`${c.avgScore}%`} />
                <Stat label="Avg Speed" value={`${c.avgTimeRatio}x`} />
              </div>

              <div className="ae-bar">
                <div className="ae-barFill" style={{ width: `${c.progressPct}%` }} />
              </div>

              <div className="ae-foot">
                <div className="ae-footItem">
                  ETA: <b>{c.etaMin == null ? "—" : `${c.etaMin} min`}</b>
                </div>
                <div className="ae-footItem">
                  Attempts: <b>{c.attempts}</b>
                </div>
                <div className="ae-footItem">
                  Last Active: <b>{fmtDate(c.lastActive)}</b>
                </div>
              </div>

              {/* ✅ privacy text */}
              <div className="ae-privacy">
                Shows aggregated learning signals only — not screen monitoring.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`ae-metric ${tone || ""}`}>
      <div className="ae-mLabel">{label}</div>
      <div className="ae-mValue">{value}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="ae-stat">
      <div className="ae-sLabel">{label}</div>
      <div className="ae-sValue">{value}</div>
    </div>
  );
}
