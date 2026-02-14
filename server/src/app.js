import express from "express";
import cors from "cors";

import catalogRoutes from "./routes/catalog.routes.js";
import userRoutes from "./routes/user.routes.js";
import engineRoutes from "./routes/engine.routes.js";
import adminRoutes from "./routes/admin.routes.js";


const app = express();
app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/catalog", catalogRoutes);
app.use("/api/user", userRoutes);
app.use("/api/engine", engineRoutes);
app.use("/api/admin", adminRoutes);
export default app;
