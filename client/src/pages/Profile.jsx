import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getActiveUserId } from "../utils/activeUser";
import "./profile.css";

export default function Profile() {
  const userId = getActiveUserId();

  const [dash, setDash] = useState(null);
  const [an, setAn] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const [d, a] = await Promise.all([api.getDashboard(userId), api.getAnalytics(userId)]);
      setDash(d);
      setAn(a);
    } catch (e) {
      setErr(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const ui = useMemo(() => {
    const user = dash?.user || {};
    const course = dash?.course || {};
    const progress = dash?.progress || { total: 0, completed: 0, percent: 0 };

    const pref = (user?.learning_style_preference || "mixed").replace("_first", "");
    const preferredFormatLabel =
      pref === "video" ? "Videos" : pref === "doc" ? "Docs" : pref === "lab" ? "Labs" : "Mixed";

    return {
      name: user?.name || "User",
      role: user?.role || "employee",
      userId: user?.userId || userId,
      courseTitle: course?.title || "No active course",
      progress,
      preferredFormatLabel,
      timeEfficiency: dash?.timeEfficiency || "On Track",
    };
  }, [dash, userId]);

  if (loading) return <div className="ss-page ss-center">Loading…</div>;
  if (err) return <div className="ss-page ss-center ss-error">{err}</div>;
  if (!dash || !an) return null;

  return (
    <div className="pf-wrap">
      {/* header */}
      <div className="pf-header">
        <div className="pf-avatar">{ui.name.slice(0, 1).toUpperCase()}</div>

        <div className="pf-headtext">
          <div className="pf-name">{ui.name}</div>
          <div className="pf-sub">
            <span className="pf-chip role">{ui.role}</span>
            <span className="pf-chip id">ID: {ui.userId}</span>
            <span className="pf-chip">Active: {ui.courseTitle}</span>
          </div>
        </div>

        <div className="pf-actions">
          <button className="pf-btn icon" onClick={load} title="Refresh">↻</button>
        </div>
      </div>

      <div className="pf-grid">
        {/* progress */}
        <section className="pf-card pf-wide">
          <div className="pf-title">Learning Track & Progress</div>
          <div className="pf-big">{ui.courseTitle}</div>

          <div className="pf-row">
            <div className="pf-stat">
              <div className="pf-label">Progress</div>
              <div className="pf-value">{ui.progress.percent}%</div>
            </div>
            <div className="pf-stat">
              <div className="pf-label">Completed</div>
              <div className="pf-value">{ui.progress.completed}/{ui.progress.total}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-label">Preferred Format</div>
              <div className="pf-value" style={{ fontSize: 20 }}>{ui.preferredFormatLabel}</div>
            </div>
          </div>

          <div className="pf-progress">
            <div className="pf-progress-top">
              <div className="pf-label">Current Pace</div>
              <div className="pf-label">{ui.timeEfficiency}</div>
            </div>
            <div className="pf-progress-track">
              <div className="pf-progress-fill" style={{ width: `${ui.progress.percent}%` }} />
            </div>
          </div>

          <div className="pf-badges">
            <span className={`pf-badge ${ui.timeEfficiency === "Slow" ? "warn" : "good"}`}>
              {ui.timeEfficiency === "Slow" ? "Needs pacing" : "On track"}
            </span>
            <span className="pf-badge mid">Personalized sequencing enabled</span>
            <span className="pf-badge mid">Format switching active</span>
          </div>
        </section>

        {/* ✅ ANALYTICS */}
        <section className="pf-card pf-wide">
          <div className="pf-title">Personalization Analytics</div>

          <div className="pf-row">
            <div className="pf-stat">
              <div className="pf-label">Total Learning Time</div>
              <div className="pf-value">{an.totalTimeMin}m</div>
            </div>

            <div className="pf-stat">
              <div className="pf-label">Total Attempts</div>
              <div className="pf-value">{an.totalAttempts}</div>
            </div>

            <div className="pf-stat">
              <div className="pf-label">Retries Triggered</div>
              <div className="pf-value">{an.retriesCount}</div>
            </div>

            <div className="pf-stat">
              <div className="pf-label">Avg Score</div>
              <div className="pf-value">{an.avgScore}%</div>
            </div>

            <div className="pf-stat">
              <div className="pf-label">Avg Time Ratio</div>
              <div className="pf-value">{an.avgTimeRatio}×</div>
            </div>
          </div>

          {/* Score trend */}
          <div style={{ marginTop: 14 }}>
            <div className="pf-label" style={{ fontWeight: 900, marginBottom: 8 }}>
              Score Trend (last attempts)
            </div>
            <MiniLineChart
              points={an.trend.map((t) => t.score)}
              height={90}
            />
            <div className="pf-muted">
              Shows how the engine improves mastery over time via retries + format switching.
            </div>
          </div>

          {/* Topic retries */}
          <div style={{ marginTop: 14 }}>
            <div className="pf-label" style={{ fontWeight: 900, marginBottom: 8 }}>
              Most Retried Topics
            </div>
            <MiniBarChart
              labels={an.topRetriedTopics.map((t) => prettyTopic(t.topic))}
              values={an.topRetriedTopics.map((t) => t.retries)}
              height={110}
            />
          </div>

          {/* Format performance */}
          <div style={{ marginTop: 14 }}>
            <div className="pf-label" style={{ fontWeight: 900, marginBottom: 8 }}>
              Format Performance
            </div>

            <div className="pf-table">
              <div className="pf-tr pf-head">
                <div>Format</div>
                <div>Attempts</div>
                <div>Avg Score</div>
              </div>

              {an.formatPerformance.map((f) => (
                <div className="pf-tr" key={f.format}>
                  <div>{String(f.format).toUpperCase()}</div>
                  <div className="pf-score">{f.attempts}</div>
                  <div className="pf-score">{f.avgScore}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Attempts list */}
        <section className="pf-card pf-wide">
          <div className="pf-title">Recent Attempts</div>

          {dash.recentAttempts?.length ? (
            <div className="pf-table">
              <div className="pf-tr pf-head">
                <div>Topic</div>
                <div>Score</div>
                <div>Result</div>
              </div>

              {dash.recentAttempts.slice(0, 5).map((a) => (
                <div key={a.attemptId} className="pf-tr">
                  <div>{prettyTopic(a.topic)}</div>
                  <div className="pf-score">{a.score}%</div>
                  <div className={`pf-pill ${a.score >= 60 ? "pass" : "fail"}`}>
                    {a.score >= 60 ? "✓ Pass" : "⚠ Fail"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pf-muted">No attempts yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}

/** tiny SVG line chart (no libs) */
function MiniLineChart({ points = [], height = 90 }) {
  const w = 520;
  const h = height;
  const pad = 10;

  const max = Math.max(100, ...points);
  const min = Math.min(0, ...points);

  const xStep = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const toY = (v) => {
    const t = (v - min) / Math.max(1, (max - min));
    return h - pad - t * (h - pad * 2);
  };

  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * xStep} ${toY(v)}`)
    .join(" ");

  return (
    <div style={{ border: "1px solid rgba(16,24,40,0.08)", borderRadius: 12, background: "#fbfcff", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.75" />
      </svg>
    </div>
  );
}

/** tiny bar chart */
function MiniBarChart({ labels = [], values = [], height = 110 }) {
  const max = Math.max(1, ...values);

  return (
    <div style={{ border: "1px solid rgba(16,24,40,0.08)", borderRadius: 12, background: "#fbfcff", padding: 10 }}>
      <div style={{ display: "grid", gap: 8 }}>
        {labels.map((lab, i) => {
          const v = values[i] || 0;
          const pct = Math.round((v / max) * 100);
          return (
            <div key={lab} style={{ display: "grid", gridTemplateColumns: "180px 1fr 40px", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(19,32,51,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lab}
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(31,116,209,0.12)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: 10, borderRadius: 999, background: "rgba(31,116,209,0.75)" }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(19,32,51,0.72)" }}>{v}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function prettyTopic(t) {
  return (t || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
