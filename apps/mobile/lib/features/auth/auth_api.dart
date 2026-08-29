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
      : _dio = dio ??
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
    final Map<String, dynamic> session =
        body['session'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final String? token = session['token'] as String?;
    final int? expiresAtMs = session['expiresAtMs'] as int?;
    if (token == null || expiresAtMs == null) {
      throw const AuthApiException('The server returned an incomplete mobile session.');
    }
    return LoginResult(token: token, expiresAtMs: expiresAtMs);
  }

  Future<AuthSession> me(String token) async {
    final Map<String, dynamic> body = await _get('/auth/me', token: token);
    final Map<String, dynamic> userJson =
        body['user'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final Map<String, dynamic> sessionJson =
        body['session'] as Map<String, dynamic>? ?? <String, dynamic>{};
    return AuthSession(
      user: AuthUser.fromJson(userJson),
      sessionId: sessionJson['id'] as String,
      clientType: sessionJson['clientType'] as String,
    );
  }

  Future<void> logout(String token) async {
    await _post('/auth/logout', token: token, data: const <String, dynamic>{});
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

  Options _options(String? token) {
    return Options(
      headers: token == null
          ? null
          : <String, String>{'authorization': 'Bearer $token'},
    );
  }

  Map<String, dynamic> _jsonObject(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return value.cast<String, dynamic>();
    throw const AuthApiException('The server returned an invalid response.');
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
