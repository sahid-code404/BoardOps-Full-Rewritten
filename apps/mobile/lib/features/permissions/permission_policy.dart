import '../auth/auth_models.dart';

abstract final class BoardOpsPermission {
  static const String permissionsRead = 'permissions.read';
  static const String permissionsManage = 'permissions.manage';
  static const String residentRead = 'resident.read';
  static const String residentApprove = 'resident.approve';
  static const String residentEdit = 'resident.edit';
  static const String authSessionsManage = 'auth.sessions.manage';
  static const String mealConfigure = 'meal.configure';
  static const String mealOverride = 'meal.override';
  static const String paymentSubmit = 'payment.submit';
  static const String paymentReview = 'payment.review';
  static const String paymentApprove = 'payment.approve';
  static const String paymentVoid = 'payment.void';
  static const String expenseCreate = 'expense.create';
  static const String expenseApprove = 'expense.approve';
  static const String billingGenerate = 'billing.generate';
  static const String billingPublish = 'billing.publish';
  static const String billingClose = 'billing.close';
  static const String formulaManage = 'formula.manage';
  static const String reportExport = 'report.export';
  static const String settingsManage = 'settings.manage';
  static const String auditRead = 'audit.read';
}

bool hasPermission(AuthUser? user, String permission) {
  return user?.accountState == 'ACTIVE' &&
      (user?.permissions.contains(permission) ?? false);
}

bool hasAllPermissions(AuthUser? user, Iterable<String> permissions) {
  if (user?.accountState != 'ACTIVE') return false;
  final Set<String> available = user!.permissions.toSet();
  return permissions.every(available.contains);
}

bool hasAnyPermission(AuthUser? user, Iterable<String> permissions) {
  if (user?.accountState != 'ACTIVE') return false;
  final Set<String> available = user!.permissions.toSet();
  return permissions.any(available.contains);
}

String? permissionRouteRedirect({
  required AuthUser? user,
  required String permission,
  String signedOutLocation = '/',
  String deniedLocation = '/',
}) {
  if (user == null) return signedOutLocation;
  if (!hasPermission(user, permission)) return deniedLocation;
  return null;
}
