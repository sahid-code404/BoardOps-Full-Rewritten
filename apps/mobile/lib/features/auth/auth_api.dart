import 'package:dio/dio.dart';

import 'auth_models.dart';

const String boardOpsApiBaseUrl = String.fromEnvironment(
  'BOARDOPS_API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8787/api/v1',
);

class AuthApiException implements Exception {
  const AuthApiException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => message;
}

class AuthApi {
  AuthApi({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: boardOpsApiBaseUrl,
              connectTimeout: const Duration(seconds: 8),
              receiveTimeout: const Duration(seconds: 12),
              headers: const <String, String>{
                'content-type': 'application/json',
              },
            ),
          );

  final Dio _dio;

  Future<LoginResult> login({
    required String institutionSlug,
    required String identifier,
    required String password,
    String deviceName = 'BoardOps mobile',
  }) async {
    final Map<String, dynamic> body = await _post(
      '/auth/login',
      data: <String, dynamic>{
        'institutionSlug': institutionSlug,
        'identifier': identifier,
        'password': password,
        'clientType': 'MOBILE',
        'deviceName': deviceName,
      },
    );
    final Map<String, dynamic> session = _jsonMap(
      body['session'],
      field: 'session',
    );
    final String? token = session['token'] as String?;
    final int? expiresAtMs = (session['expiresAtMs'] as num?)?.toInt();
    if (token == null || expiresAtMs == null) {
      throw const AuthApiException(
        'The server returned an incomplete mobile session.',
      );
    }
    return LoginResult(token: token, expiresAtMs: expiresAtMs);
  }

  Future<RegistrationResult> register({
    required String institutionSlug,
    required String institutionUserId,
    required String displayName,
    required String email,
    required String password,
  }) async {
    final Map<String, dynamic> body = await _post(
      '/auth/register',
      data: <String, dynamic>{
        'institutionSlug': institutionSlug,
        'institutionUserId': institutionUserId,
        'displayName': displayName,
        'email': email,
        'password': password,
      },
    );
    return RegistrationResult(
      userId: body['userId'] as String,
      developmentVerificationToken:
          body['developmentVerificationToken'] as String?,
    );
  }

  Future<void> verifyEmail(String token) async {
    await _post('/auth/verify-email', data: <String, dynamic>{'token': token});
  }

  Future<PasswordResetRequestResult> requestPasswordReset({
    required String institutionSlug,
    required String identifier,
  }) async {
    final Map<String, dynamic> body = await _post(
      '/auth/password-reset/request',
      data: <String, dynamic>{
        'institutionSlug': institutionSlug,
        'identifier': identifier,
      },
    );
    return PasswordResetRequestResult(
      developmentResetToken: body['developmentResetToken'] as String?,
    );
  }

  Future<void> confirmPasswordReset({
    required String token,
    required String newPassword,
  }) async {
    await _post(
      '/auth/password-reset/confirm',
      data: <String, dynamic>{'token': token, 'newPassword': newPassword},
    );
  }

  Future<AuthSession> me(String token) async {
    final Map<String, dynamic> body = await _get('/auth/me', token: token);
    final Map<String, dynamic> userJson = _jsonMap(body['user'], field: 'user');
    final Map<String, dynamic> sessionJson = _jsonMap(
      body['session'],
      field: 'session',
    );
    return AuthSession(
      user: AuthUser.fromJson(userJson),
      sessionId: sessionJson['id'] as String,
      clientType: sessionJson['clientType'] as String,
      stepUpVerifiedAtMs: (sessionJson['stepUpVerifiedAtMs'] as num?)?.toInt(),
    );
  }

  Future<void> logout(String token) async {
    await _post('/auth/logout', token: token, data: const <String, dynamic>{});
  }

  Future<OtpChallenge> requestOtp(String token) async {
    final Map<String, dynamic> body = await _post(
      '/auth/otp/request',
      token: token,
      data: const <String, dynamic>{'purpose': 'STEP_UP'},
    );
    return OtpChallenge(
      challengeId: body['challengeId'] as String,
      expiresAtMs: (body['expiresAtMs'] as num).toInt(),
      developmentCode: body['developmentOtpCode'] as String?,
    );
  }

  Future<void> verifyOtp({
    required String token,
    required String challengeId,
    required String code,
  }) async {
    await _post(
      '/auth/otp/verify',
      token: token,
      data: <String, dynamic>{'challengeId': challengeId, 'code': code},
    );
  }

  Future<List<DeviceSession>> sessions(String token) async {
    final Map<String, dynamic> body = await _get(
      '/auth/sessions',
      token: token,
    );
    final List<dynamic> raw = body['sessions'] as List<dynamic>? ?? <dynamic>[];
    return raw
        .map((dynamic value) => DeviceSession.fromJson(_jsonMap(value)))
        .toList(growable: false);
  }

  Future<void> revokeSession(String token, String sessionId) async {
    await _delete(
      '/auth/sessions/${Uri.encodeComponent(sessionId)}',
      token: token,
    );
  }

  Future<Map<String, dynamic>> _get(String path, {String? token}) async {
    try {
      final Response<dynamic> response = await _dio.get<dynamic>(
        path,
        options: _options(token),
      );
      return _jsonObject(response.data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> _post(
    String path, {
    required Map<String, dynamic> data,
    String? token,
  }) async {
    try {
      final Response<dynamic> response = await _dio.post<dynamic>(
        path,
        data: data,
        options: _options(token),
      );
      return _jsonObject(response.data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> _delete(String path, {required String token}) async {
    try {
      await _dio.delete<dynamic>(path, options: _options(token));
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Options _options(String? token) {
    return Options(
      headers: token == null
          ? null
          : <String, String>{'authorization': 'Bearer $token'},
    );
  }

  Map<String, dynamic> _jsonObject(dynamic value) => _jsonMap(value);

  Map<String, dynamic> _jsonMap(dynamic value, {String field = 'response'}) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return value.cast<String, dynamic>();
    throw AuthApiException('The server returned an invalid $field.');
  }

  AuthApiException _mapError(DioException error) {
    final dynamic data = error.response?.data;
    if (data is Map) {
      final dynamic rawError = data['error'];
      if (rawError is Map) {
        final String? message = rawError['message'] as String?;
        final String? code = rawError['code'] as String?;
        if (message != null) return AuthApiException(message, code: code);
      }
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return const AuthApiException('BoardOps could not reach the server.');
    }
    return const AuthApiException('Authentication request failed.');
  }
}
