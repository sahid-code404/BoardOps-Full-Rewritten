export const permissionCodes = {
  permissionsRead: "permissions.read",
  permissionsManage: "permissions.manage",
  residentRead: "resident.read",
  residentApprove: "resident.approve",
  residentEdit: "resident.edit",
  authSessionsManage: "auth.sessions.manage",
  mealConfigure: "meal.configure",
  mealOverride: "meal.override",
  paymentSubmit: "payment.submit",
  paymentReview: "payment.review",
  paymentApprove: "payment.approve",
  paymentVoid: "payment.void",
  expenseCreate: "expense.create",
  expenseApprove: "expense.approve",
  billingGenerate: "billing.generate",
  billingPublish: "billing.publish",
  billingClose: "billing.close",
  formulaManage: "formula.manage",
  reportExport: "report.export",
  settingsManage: "settings.manage",
  auditRead: "audit.read",
} as const;

export type PermissionCode =
  (typeof permissionCodes)[keyof typeof permissionCodes];
