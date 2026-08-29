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
    final List<dynamic> rawPermissions =
        json['permissions'] as List<dynamic>? ?? <dynamic>[];
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
    this.stepUpVerifiedAtMs,
  });

  final AuthUser user;
  final String sessionId;
  final String clientType;
  final int? stepUpVerifiedAtMs;
}

class LoginResult {
  const LoginResult({required this.token, required this.expiresAtMs});

  final String token;
  final int expiresAtMs;
}

class RegistrationResult {
  const RegistrationResult({
    required this.userId,
    this.developmentVerificationToken,
  });

  final String userId;
  final String? developmentVerificationToken;
}

class PasswordResetRequestResult {
  const PasswordResetRequestResult({this.developmentResetToken});

  final String? developmentResetToken;
}

class OtpChallenge {
  const OtpChallenge({
    required this.challengeId,
    required this.expiresAtMs,
    this.developmentCode,
  });

  final String challengeId;
  final int expiresAtMs;
  final String? developmentCode;
}

class DeviceSession {
  const DeviceSession({
    required this.id,
    required this.clientType,
    required this.createdAtMs,
    required this.lastSeenAtMs,
    required this.expiresAtMs,
    this.deviceName,
    this.revokedAtMs,
    this.stepUpVerifiedAtMs,
  });

  factory DeviceSession.fromJson(Map<String, dynamic> json) {
    return DeviceSession(
      id: json['id'] as String,
      clientType: json['client_type'] as String,
      deviceName: json['device_name'] as String?,
      createdAtMs: (json['created_at_ms'] as num).toInt(),
      lastSeenAtMs: (json['last_seen_at_ms'] as num).toInt(),
      expiresAtMs: (json['expires_at_ms'] as num).toInt(),
      revokedAtMs: (json['revoked_at_ms'] as num?)?.toInt(),
      stepUpVerifiedAtMs: (json['step_up_verified_at_ms'] as num?)?.toInt(),
    );
  }

  final String id;
  final String clientType;
  final String? deviceName;
  final int createdAtMs;
  final int lastSeenAtMs;
  final int expiresAtMs;
  final int? revokedAtMs;
  final int? stepUpVerifiedAtMs;
}
