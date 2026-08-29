import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_api.dart';
import 'auth_models.dart';
import 'auth_storage.dart';

class AuthState {
  const AuthState({
    this.initializing = false,
    this.busy = false,
    this.session,
    this.error,
  });

  final bool initializing;
  final bool busy;
  final AuthSession? session;
  final String? error;
}

final Provider<AuthApi> authApiProvider = Provider<AuthApi>((ref) => AuthApi());
final Provider<AuthTokenStorage> authTokenStorageProvider =
    Provider<AuthTokenStorage>((ref) => SecureAuthTokenStorage());
final NotifierProvider<AuthController, AuthState> authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  AuthApi get _api => ref.read(authApiProvider);
  AuthTokenStorage get _storage => ref.read(authTokenStorageProvider);

  @override
  AuthState build() {
    unawaited(_restoreSession());
    return const AuthState(initializing: true);
  }

  Future<void> _restoreSession() async {
    try {
      final StoredAuthToken? stored = await _storage.read();
      if (stored == null || stored.expiresAtMs <= DateTime.now().millisecondsSinceEpoch) {
        if (stored != null) await _storage.clear();
        state = const AuthState();
        return;
      }
      final AuthSession session = await _api.me(stored.token);
      state = AuthState(session: session);
    } catch (_) {
      await _storage.clear();
      state = const AuthState();
    }
  }

  Future<void> login({
    required String institutionSlug,
    required String identifier,
    required String password,
  }) async {
    state = AuthState(busy: true, session: state.session);
    try {
      final LoginResult result = await _api.login(
        institutionSlug: institutionSlug,
        identifier: identifier,
        password: password,
      );
      await _storage.write(
        StoredAuthToken(token: result.token, expiresAtMs: result.expiresAtMs),
      );
      final AuthSession session = await _api.me(result.token);
      state = AuthState(session: session);
    } catch (error) {
      final String message = _message(error);
      state = AuthState(session: state.session, error: message);
      rethrow;
    }
  }

  Future<RegistrationResult> register({
    required String institutionSlug,
    required String institutionUserId,
    required String displayName,
    required String email,
    required String password,
  }) {
    return _api.register(
      institutionSlug: institutionSlug,
      institutionUserId: institutionUserId,
      displayName: displayName,
      email: email,
      password: password,
    );
  }

  Future<void> verifyEmail(String token) => _api.verifyEmail(token);

  Future<PasswordResetRequestResult> requestPasswordReset({
    required String institutionSlug,
    required String identifier,
  }) {
    return _api.requestPasswordReset(
      institutionSlug: institutionSlug,
      identifier: identifier,
    );
  }

  Future<void> confirmPasswordReset({
    required String token,
    required String newPassword,
  }) {
    return _api.confirmPasswordReset(token: token, newPassword: newPassword);
  }

  Future<OtpChallenge> requestOtp() async {
    final StoredAuthToken stored = await _requireStoredToken();
    return _api.requestOtp(stored.token);
  }

  Future<void> verifyOtp({
    required String challengeId,
    required String code,
  }) async {
    final StoredAuthToken stored = await _requireStoredToken();
    await _api.verifyOtp(
      token: stored.token,
      challengeId: challengeId,
      code: code,
    );
    final AuthSession refreshed = await _api.me(stored.token);
    state = AuthState(session: refreshed);
  }

  Future<List<DeviceSession>> sessions() async {
    final StoredAuthToken stored = await _requireStoredToken();
    return _api.sessions(stored.token);
  }

  Future<void> revokeSession(String sessionId) async {
    final StoredAuthToken stored = await _requireStoredToken();
    await _api.revokeSession(stored.token, sessionId);
    if (state.session?.sessionId == sessionId) {
      await _storage.clear();
      state = const AuthState();
    }
  }

  Future<void> logout() async {
    final StoredAuthToken? stored = await _storage.read();
    try {
      if (stored != null) await _api.logout(stored.token);
    } finally {
      await _storage.clear();
      state = const AuthState();
    }
  }

  Future<StoredAuthToken> _requireStoredToken() async {
    final StoredAuthToken? stored = await _storage.read();
    if (stored == null || stored.expiresAtMs <= DateTime.now().millisecondsSinceEpoch) {
      await _storage.clear();
      state = const AuthState(error: 'Your session has expired. Sign in again.');
      throw const AuthApiException('Your session has expired. Sign in again.');
    }
    return stored;
  }

  String _message(Object error) {
    return error is AuthApiException
        ? error.message
        : 'Authentication could not be completed.';
  }
}
