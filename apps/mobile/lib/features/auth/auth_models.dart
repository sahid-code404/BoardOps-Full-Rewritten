class AuthUser {
  const AuthUser({
    required this.id,
    required this.institutionId,
    required this.institutionSlug,
    required this.institutionUserId,
    required this.email,
    required this.displayName,
    required this.accountState,
    required this.permissions,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawPermissions = json['permissions'] as List<dynamic>? ?? <dynamic>[];
    return AuthUser(
      id: json['id'] as String,
      institutionId: json['institutionId'] as String,
      institutionSlug: json['institutionSlug'] as String,
      institutionUserId: json['institutionUserId'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      accountState: json['accountState'] as String,
      permissions: rawPermissions.cast<String>(),
    );
  }

  final String id;
  final String institutionId;
  final String institutionSlug;
  final String institutionUserId;
  final String email;
  final String displayName;
  final String accountState;
  final List<String> permissions;
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.sessionId,
    required this.clientType,
  });

  final AuthUser user;
  final String sessionId;
  final String clientType;
}

class LoginResult {
  const LoginResult({
    required this.token,
    required this.expiresAtMs,
  });

  final String token;
  final int expiresAtMs;
}
