import 'package:boardops/features/auth/auth_models.dart';
import 'package:boardops/features/permissions/permission_policy.dart';
import 'package:flutter_test/flutter_test.dart';

AuthUser activeUser(List<String> permissions) => AuthUser(
      id: 'user-1',
      institutionId: 'institution-1',
      institutionSlug: 'demo',
      institutionUserId: 'USER-001',
      email: 'user@boardops.local',
      displayName: 'Permission User',
      accountState: 'ACTIVE',
      permissions: permissions,
    );

void main() {
  test('requires an active user with the exact permission', () {
    final AuthUser user = activeUser(<String>[BoardOpsPermission.permissionsRead]);
    expect(hasPermission(user, BoardOpsPermission.permissionsRead), isTrue);
    expect(hasPermission(user, BoardOpsPermission.permissionsManage), isFalse);
  });

  test('supports all-of and any-of policies', () {
    final AuthUser user = activeUser(<String>[
      BoardOpsPermission.permissionsRead,
      BoardOpsPermission.residentRead,
    ]);
    expect(
      hasAllPermissions(user, <String>[
        BoardOpsPermission.permissionsRead,
        BoardOpsPermission.residentRead,
      ]),
      isTrue,
    );
    expect(
      hasAnyPermission(user, <String>[
        BoardOpsPermission.permissionsManage,
        BoardOpsPermission.residentRead,
      ]),
      isTrue,
    );
  });

  test('fails closed for inactive and signed-out users', () {
    final AuthUser inactive = AuthUser(
      id: 'user-2',
      institutionId: 'institution-1',
      institutionSlug: 'demo',
      institutionUserId: 'USER-002',
      email: 'inactive@boardops.local',
      displayName: 'Inactive User',
      accountState: 'SUSPENDED',
      permissions: const <String>[BoardOpsPermission.permissionsRead],
    );
    expect(hasPermission(inactive, BoardOpsPermission.permissionsRead), isFalse);
    expect(hasPermission(null, BoardOpsPermission.permissionsRead), isFalse);
  });

  test('route guard redirects when permission is absent', () {
    final AuthUser user = activeUser(<String>[BoardOpsPermission.permissionsRead]);
    expect(
      permissionRouteRedirect(
        user: user,
        permission: BoardOpsPermission.permissionsRead,
      ),
      isNull,
    );
    expect(
      permissionRouteRedirect(
        user: user,
        permission: BoardOpsPermission.permissionsManage,
        deniedLocation: '/account',
      ),
      '/account',
    );
  });
}
