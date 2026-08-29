import { ApiError } from "../http/api-error";
import type { ClientType } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  body: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
): string {
  const value = body[key];
  if (typeof value !== "string") {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < minimum || trimmed.length > maximum) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      `${key} must be between ${minimum} and ${maximum} characters.`,
    );
  }
  return trimmed;
}

export function optionalString(
  body: Record<string, unknown>,
  key: string,
  maximum: number,
): string | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      `${key} must be at most ${maximum} characters.`,
    );
  }
  return trimmed;
}

export function emailString(body: Record<string, unknown>, key = "email"): string {
  const value = requiredString(body, key, 3, 254);
  if (!emailPattern.test(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be a valid email address.`);
  }
  return value;
}

export function passwordString(
  body: Record<string, unknown>,
  key = "password",
): string {
  const value = requiredString(body, key, 12, 128);
  return value;
}

export function clientType(body: Record<string, unknown>): ClientType {
  const value = body.clientType;
  if (value === undefined) return "WEB";
  if (value !== "WEB" && value !== "MOBILE") {
    throw new ApiError(422, "VALIDATION_ERROR", "clientType must be WEB or MOBILE.");
  }
  return value;
}

export function reviewAction(
  body: Record<string, unknown>,
): "APPROVE" | "REJECT" | "REQUEST_CHANGES" {
  const value = body.action;
  if (value === "APPROVE" || value === "REJECT" || value === "REQUEST_CHANGES") {
    return value;
  }
  throw new ApiError(
    422,
    "VALIDATION_ERROR",
    "action must be APPROVE, REJECT, or REQUEST_CHANGES.",
  );
}
