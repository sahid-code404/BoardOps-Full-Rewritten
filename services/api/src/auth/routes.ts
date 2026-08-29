import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { passwordResetRoutes } from "./password-reset-routes";
import { registrationRoutes } from "./registration-routes";
import { reviewRoutes } from "./review-routes";
import { sessionRoutes } from "./session-routes";

export const authRoutes = new Hono<AppEnv>();

authRoutes.route("/", registrationRoutes);
authRoutes.route("/", sessionRoutes);
authRoutes.route("/", passwordResetRoutes);
authRoutes.route("/", reviewRoutes);
