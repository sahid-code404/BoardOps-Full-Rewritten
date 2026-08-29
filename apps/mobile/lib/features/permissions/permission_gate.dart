import 'package:flutter/widgets.dart';

import '../auth/auth_models.dart';
import 'permission_policy.dart';

class PermissionGate extends StatelessWidget {
  const PermissionGate({
    required this.user,
    required this.permission,
    required this.child,
    super.key,
    this.fallback = const SizedBox.shrink(),
  });

  final AuthUser? user;
  final String permission;
  final Widget child;
  final Widget fallback;

  @override
  Widget build(BuildContext context) {
    return hasPermission(user, permission) ? child : fallback;
  }
}
