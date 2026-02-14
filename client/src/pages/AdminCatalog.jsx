import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getActiveUserId } from "../utils/activeUser";
import "./adminCatalog.css";

const EMPTY_ASSET = {
  assetId: "",
  title: "",
  topic: "",
  format: "video",
  difficulty: 1,
  level: "beginner",
  expectedTimeMin: 10,
  url: "",
  prerequisites: [],
};

const EMPTY_COURSE = {
  courseId: "",
  title: "",
  description: "",
  skillTags: [],
  moduleAssetIds: [],
  active: true,
  createdBy: "admin",
};

function pretty(s) {
  return (s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminCatalog() {
  const userId = getActiveUserId();

  const [role, setRole] = useState("employee");
  const [tab, setTab] = useState("assets");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [assets, setAssets] = useState([]);
  const [courses, setCourses] = useState([]);

  const [assetForm, setAssetForm] = useState(EMPTY_ASSET);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);

  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Load role + admin lists
  async function loadAll() {
    setLoading(true);
    setMsg("");
    try {
      const dash = await api.getDashboard(userId);
      setRole(dash?.user?.role || "employee");

      // If not admin, still show message
      const [a, c] = await Promise.all([
        api.adminListAssets(),
        api.adminListCourses(),
      ]);

      setAssets(a || []);
      setCourses(c || []);
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const assetsById = useMemo(() => {
    const m = new Map();
    (assets || []).forEach((a) => m.set(a.assetId, a));
    return m;
  }, [assets]);

  // Gate
  if (!loading && role !== "admin") {
    return (
      <div className="adm-wrap">
        <div className="adm-card">
          <div className="adm-title">Admin Access Required</div>
          <div className="adm-sub">
            Your current role is <b>{role}</b>. Switch active user to an admin account.
          </div>

          <div className="adm-hint">
            Tip: In demo, set one user in Mongo as <code>role: "admin"</code>.
          </div>

          {msg && <div className="adm-msg bad">{msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-wrap">
      <div className="adm-head">
        <div>
          <div className="adm-title">Admin Catalog</div>
          <div className="adm-sub">Manage Assets & Courses (MongoDB)</div>
        </div>

        <div className="adm-actions">
          <button className="adm-btn" onClick={loadAll} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {msg && <div className={`adm-msg ${msg.startsWith("✅") ? "good" : "bad"}`}>{msg}</div>}

      <div className="adm-tabs">
        <button
          className={`adm-tab ${tab === "assets" ? "active" : ""}`}
          onClick={() => setTab("assets")}
        >
          Assets
        </button>
        <button
          className={`adm-tab ${tab === "courses" ? "active" : ""}`}
          onClick={() => setTab("courses")}
        >
          Courses
        </button>
      </div>

      {loading ? (
        <div className="adm-card">Loading…</div>
      ) : tab === "assets" ? (
        <div className="adm-grid">
          {/* LEFT: Create/Edit Asset */}
          <div className="adm-card">
            <div className="adm-cardtitle">
              {editingAssetId ? `Edit Asset: ${editingAssetId}` : "Create Asset"}
            </div>

            <div className="adm-form">
              <Field label="Asset ID (unique)" value={assetForm.assetId}
                onChange={(v) => setAssetForm((p) => ({ ...p, assetId: v }))} placeholder="asset-js-functions-advanced-video"
                disabled={!!editingAssetId}
              />

              <Field label="Title" value={assetForm.title}
                onChange={(v) => setAssetForm((p) => ({ ...p, title: v }))} placeholder="JS Functions — Advanced Video"
              />

              <div className="adm-row">
                <Field label="Topic" value={assetForm.topic}
                  onChange={(v) => setAssetForm((p) => ({ ...p, topic: v }))} placeholder="js-functions"
                />

                <Select
                  label="Format"
                  value={assetForm.format}
                  onChange={(v) => setAssetForm((p) => ({ ...p, format: v }))}
                  options={[
                    ["video", "video"],
                    ["doc", "doc"],
                    ["lab", "lab"],
                    ["infographic", "infographic"],
                  ]}
                />
              </div>

              <div className="adm-row">
                <Select
                  label="Level"
                  value={assetForm.level}
                  onChange={(v) => setAssetForm((p) => ({ ...p, level: v }))}
                  options={[
                    ["beginner", "beginner"],
                    ["intermediate", "intermediate"],
                    ["advanced", "advanced"],
                  ]}
                />

                <NumberField
                  label="Difficulty (1-5)"
                  value={assetForm.difficulty}
                  onChange={(v) => setAssetForm((p) => ({ ...p, difficulty: v }))}
                  min={1}
                  max={5}
                />
              </div>

              <div className="adm-row">
                <NumberField
                  label="Expected Time (min)"
                  value={assetForm.expectedTimeMin}
                  onChange={(v) => setAssetForm((p) => ({ ...p, expectedTimeMin: v }))}
                  min={1}
                  max={240}
                />

                <Field
                  label="URL"
                  value={assetForm.url}
                  onChange={(v) => setAssetForm((p) => ({ ...p, url: v }))}
                  placeholder="https://..."
                />
              </div>

              <TagInput
                label="Prerequisites (comma separated assetIds)"
                value={assetForm.prerequisites}
                onChange={(arr) => setAssetForm((p) => ({ ...p, prerequisites: arr }))}
                placeholder="asset-..., asset-..."
              />

              <div className="adm-formactions">
                {!editingAssetId ? (
                  <button className="adm-btn primary" onClick={createAsset}>
                    + Create
                  </button>
                ) : (
                  <>
                    <button className="adm-btn primary" onClick={updateAsset}>
                      Save Changes
                    </button>
                    <button className="adm-btn" onClick={resetAssetForm}>
                      Cancel
                    </button>
                  </>
                )}
              </div>

              <div className="adm-note">
                Asset created here will be used inside courses as <b>moduleAssetIds</b>.
              </div>
            </div>
          </div>

          {/* RIGHT: Asset List */}
          <div className="adm-card">
            <div className="adm-cardtitle">All Assets ({assets.length})</div>

            <div className="adm-list">
              {assets.length === 0 ? (
                <div className="adm-empty">No assets yet.</div>
              ) : (
                assets
                  .slice()
                  .sort((a, b) => (a.assetId || "").localeCompare(b.assetId || ""))
                  .map((a) => (
                    <div className="adm-item" key={a.assetId}>
                      <div className="adm-itemmain">
                        <div className="adm-itemtitle">{a.title || a.assetId}</div>
                        <div className="adm-itemmeta">
                          <span className="pill">{a.topic}</span>
                          <span className="pill soft">{a.level}</span>
                          <span className="pill soft">{a.format}</span>
                          <span className="pill soft">⏱ {a.expectedTimeMin}m</span>
                        </div>
                        <div className="adm-itemid">{a.assetId}</div>
                      </div>

                      <div className="adm-itemactions">
                        <button className="adm-mini" onClick={() => startEditAsset(a)}>
                          Edit
                        </button>
                        <button className="adm-mini danger" onClick={() => deleteAsset(a.assetId)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="adm-grid">
          {/* LEFT: Create/Edit Course */}
          <div className="adm-card">
            <div className="adm-cardtitle">
              {editingCourseId ? `Edit Course: ${editingCourseId}` : "Create Course"}
            </div>

            <div className="adm-form">
              <Field
                label="Course ID (unique)"
                value={courseForm.courseId}
                onChange={(v) => setCourseForm((p) => ({ ...p, courseId: v }))}
                placeholder="c-js-foundations"
                disabled={!!editingCourseId}
              />

              <Field
                label="Title"
                value={courseForm.title}
                onChange={(v) => setCourseForm((p) => ({ ...p, title: v }))}
                placeholder="JavaScript Foundations"
              />

              <Field
                label="Description"
                value={courseForm.description}
                onChange={(v) => setCourseForm((p) => ({ ...p, description: v }))}
                placeholder="A structured corporate track for JS fundamentals."
              />

              <TagInput
                label="Skill Tags (comma separated)"
                value={courseForm.skillTags}
                onChange={(arr) => setCourseForm((p) => ({ ...p, skillTags: arr }))}
                placeholder="javascript, basics, frontend"
              />

              <div className="adm-row">
                <Select
                  label="Active"
                  value={courseForm.active ? "true" : "false"}
                  onChange={(v) => setCourseForm((p) => ({ ...p, active: v === "true" }))}
                  options={[
                    ["true", "true"],
                    ["false", "false"],
                  ]}
                />
                <Field
                  label="Created By"
                  value={courseForm.createdBy}
                  onChange={(v) => setCourseForm((p) => ({ ...p, createdBy: v }))}
                  placeholder="admin"
                />
              </div>

              {/* Asset picker */}
              <div className="adm-section">
                <div className="adm-sectiontitle">Module Assets (moduleAssetIds)</div>
                <div className="adm-subsmall">
                  Select assets in order — this order becomes the base learning path.
                </div>

                <div className="adm-picker">
                  <select
                    className="adm-select"
                    value=""
                    onChange={(e) => addAssetToCourse(e.target.value)}
                  >
                    <option value="">+ Add asset…</option>
                    {assets
                      .slice()
                      .sort((a, b) => (a.assetId || "").localeCompare(b.assetId || ""))
                      .map((a) => (
                        <option key={a.assetId} value={a.assetId}>
                          {a.assetId} — {a.title}
                        </option>
                      ))}
                  </select>

                  <div className="adm-picked">
                    {courseForm.moduleAssetIds.length === 0 ? (
                      <div className="adm-empty">No module assets selected.</div>
                    ) : (
                      courseForm.moduleAssetIds.map((id, idx) => {
                        const a = assetsById.get(id);
                        return (
                          <div className="adm-chip" key={`${id}-${idx}`}>
                            <div className="adm-chipmain">
                              <div className="adm-chiptitle">{a?.title || id}</div>
                              <div className="adm-chipmeta">
                                {a?.topic ? pretty(a.topic) : ""}
                                {a?.level ? ` • ${a.level}` : ""}
                                {a?.format ? ` • ${a.format}` : ""}
                              </div>
                              <div className="adm-chipid">{id}</div>
                            </div>

                            <div className="adm-chipactions">
                              <button className="adm-mini" onClick={() => moveCourseAsset(idx, -1)}>
                                ↑
                              </button>
                              <button className="adm-mini" onClick={() => moveCourseAsset(idx, +1)}>
                                ↓
                              </button>
                              <button
                                className="adm-mini danger"
                                onClick={() => removeCourseAsset(idx)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="adm-formactions">
                {!editingCourseId ? (
                  <button className="adm-btn primary" onClick={createCourse}>
                    + Create
                  </button>
                ) : (
                  <>
                    <button className="adm-btn primary" onClick={updateCourse}>
                      Save Changes
                    </button>
                    <button className="adm-btn" onClick={resetCourseForm}>
                      Cancel
                    </button>
                  </>
                )}
              </div>

              <div className="adm-note">
                Once created, employees will see it on <b>Courses</b> page immediately.
              </div>
            </div>
          </div>

          {/* RIGHT: Course list */}
          <div className="adm-card">
            <div className="adm-cardtitle">All Courses ({courses.length})</div>

            <div className="adm-list">
              {courses.length === 0 ? (
                <div className="adm-empty">No courses yet.</div>
              ) : (
                courses
                  .slice()
                  .sort((a, b) => (a.courseId || "").localeCompare(b.courseId || ""))
                  .map((c) => (
                    <div className="adm-item" key={c.courseId}>
                      <div className="adm-itemmain">
                        <div className="adm-itemtitle">{c.title || c.courseId}</div>
                        <div className="adm-itemmeta">
                          <span className={`pill ${c.active ? "" : "off"}`}>
                            {c.active ? "Active" : "Inactive"}
                          </span>
                          <span className="pill soft">{(c.skillTags || []).slice(0, 3).join(", ")}</span>
                          <span className="pill soft">Modules: {(c.moduleAssetIds || []).length}</span>
                        </div>
                        <div className="adm-itemid">{c.courseId}</div>
                      </div>

                      <div className="adm-itemactions">
                        <button className="adm-mini" onClick={() => startEditCourse(c)}>
                          Edit
                        </button>
                        <button className="adm-mini danger" onClick={() => deleteCourse(c.courseId)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ===========================
  // ASSET actions
  // ===========================

  function resetAssetForm() {
    setEditingAssetId(null);
    setAssetForm(EMPTY_ASSET);
    setMsg("");
  }

  function startEditAsset(a) {
    setTab("assets");
    setEditingAssetId(a.assetId);
    setMsg("");
    setAssetForm({
      assetId: a.assetId || "",
      title: a.title || "",
      topic: a.topic || "",
      format: a.format || "video",
      difficulty: Number(a.difficulty ?? 1),
      level: a.level || "beginner",
      expectedTimeMin: Number(a.expectedTimeMin ?? 10),
      url: a.url || "",
      prerequisites: Array.isArray(a.prerequisites) ? a.prerequisites : [],
    });
  }

  async function createAsset() {
    try {
      setMsg("");
      if (!assetForm.assetId.trim()) return setMsg("❌ assetId is required");
      if (!assetForm.topic.trim()) return setMsg("❌ topic is required");

      await api.adminCreateAsset({
        ...assetForm,
        difficulty: Number(assetForm.difficulty || 1),
        expectedTimeMin: Number(assetForm.expectedTimeMin || 10),
      });

      setMsg("✅ Asset created");
      resetAssetForm();
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function updateAsset() {
    try {
      setMsg("");
      if (!editingAssetId) return;

      await api.adminUpdateAsset(editingAssetId, {
        ...assetForm,
        difficulty: Number(assetForm.difficulty || 1),
        expectedTimeMin: Number(assetForm.expectedTimeMin || 10),
      });

      setMsg("✅ Asset updated");
      resetAssetForm();
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function deleteAsset(assetId) {
    try {
      setMsg("");
      await api.adminDeleteAsset(assetId);
      setMsg(`✅ Deleted asset: ${assetId}`);
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  // ===========================
  // COURSE actions
  // ===========================

  function resetCourseForm() {
    setEditingCourseId(null);
    setCourseForm(EMPTY_COURSE);
    setMsg("");
  }

  function startEditCourse(c) {
    setTab("courses");
    setEditingCourseId(c.courseId);
    setMsg("");
    setCourseForm({
      courseId: c.courseId || "",
      title: c.title || "",
      description: c.description || "",
      skillTags: Array.isArray(c.skillTags) ? c.skillTags : [],
      moduleAssetIds: Array.isArray(c.moduleAssetIds) ? c.moduleAssetIds : [],
      active: !!c.active,
      createdBy: c.createdBy || "admin",
    });
  }

  function addAssetToCourse(assetId) {
    if (!assetId) return;
    setCourseForm((p) => ({
      ...p,
      moduleAssetIds: [...(p.moduleAssetIds || []), assetId],
    }));
  }

  function removeCourseAsset(idx) {
    setCourseForm((p) => {
      const next = [...(p.moduleAssetIds || [])];
      next.splice(idx, 1);
      return { ...p, moduleAssetIds: next };
    });
  }

  function moveCourseAsset(idx, dir) {
    setCourseForm((p) => {
      const arr = [...(p.moduleAssetIds || [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return { ...p, moduleAssetIds: arr };
    });
  }

  async function createCourse() {
    try {
      setMsg("");
      if (!courseForm.courseId.trim()) return setMsg("❌ courseId is required");
      if (!courseForm.title.trim()) return setMsg("❌ title is required");
      if (!courseForm.moduleAssetIds.length) return setMsg("❌ select moduleAssetIds");

      await api.adminCreateCourse(courseForm);

      setMsg("✅ Course created (employees will see it in Courses page)");
      resetCourseForm();
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function updateCourse() {
    try {
      setMsg("");
      if (!editingCourseId) return;

      await api.adminUpdateCourse(editingCourseId, courseForm);

      setMsg("✅ Course updated");
      resetCourseForm();
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function deleteCourse(courseId) {
    try {
      setMsg("");
      await api.adminDeleteCourse(courseId);
      setMsg(`✅ Deleted course: ${courseId}`);
      await loadAll();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }
}

/* --------------------------
   Small UI components
-------------------------- */

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <label className="adm-field">
      <div className="adm-label">{label}</div>
      <input
        className="adm-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <label className="adm-field">
      <div className="adm-label">{label}</div>
      <input
        className="adm-input"
        type="number"
        value={Number(value ?? 0)}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="adm-field">
      <div className="adm-label">{label}</div>
      <select className="adm-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagInput({ label, value, onChange, placeholder }) {
  const text = Array.isArray(value) ? value.join(", ") : "";

  return (
    <label className="adm-field">
      <div className="adm-label">{label}</div>
      <input
        className="adm-input"
        value={text}
        onChange={(e) => {
          const arr = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(arr);
        }}
        placeholder={placeholder}
      />
    </label>
  );
}
