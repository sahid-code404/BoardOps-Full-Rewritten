import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { permissionCatalogRoutes } from "./catalog-routes";
import { roleRoutes } from "./role-routes";
import { userAccessRoutes } from "./user-access-routes";

export const permissionRoutes = new Hono<AppEnv>();

permissionRoutes.route("/", permissionCatalogRoutes);
permissionRoutes.route("/", roleRoutes);
permissionRoutes.route("/", userAccessRoutes);
