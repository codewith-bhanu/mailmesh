import { decodeJwtPayload, extractJwtPayload } from "@/middleware/auth";
import { Hono } from "hono";
import workspaceRoutes from "./workspace.routes";
import apiKeysRoutes from "./api-keys.routes";

const dashboard = new Hono();

dashboard.use("*", decodeJwtPayload, extractJwtPayload);
dashboard.route("/workspace", workspaceRoutes);
dashboard.route("/api-keys", apiKeysRoutes);

export default dashboard;
