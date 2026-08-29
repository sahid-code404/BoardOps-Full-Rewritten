import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StoredAuthToken {
  const StoredAuthToken({required this.token, required this.expiresAtMs});

  final String token;
  final int expiresAtMs;
}

abstract interface class AuthTokenStorage {
  Future<StoredAuthToken?> read();
  Future<void> write(StoredAuthToken value);
  Future<void> clear();
}

class SecureAuthTokenStorage implements AuthTokenStorage {
  SecureAuthTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const String _tokenKey = 'boardops.auth.token';
  static const String _expiryKey = 'boardops.auth.expires_at_ms';

  final FlutterSecureStorage _storage;

  @override
  Future<StoredAuthToken?> read() async {
    final String? token = await _storage.read(key: _tokenKey);
    final String? expiryText = await _storage.read(key: _expiryKey);
    final int? expiresAtMs = int.tryParse(expiryText ?? '');
    if (token == null || token.isEmpty || expiresAtMs == null) return null;
    return StoredAuthToken(token: token, expiresAtMs: expiresAtMs);
  }

  @override
  Future<void> write(StoredAuthToken value) async {
    await _storage.write(key: _tokenKey, value: value.token);
    await _storage.write(
      key: _expiryKey,
      value: value.expiresAtMs.toString(),
    );
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _expiryKey);
  }
}

class MemoryAuthTokenStorage implements AuthTokenStorage {
  StoredAuthToken? _value;

  @override
  Future<StoredAuthToken?> read() async => _value;

  @override
  Future<void> write(StoredAuthToken value) async {
    _value = value;
  }

  @override
  Future<void> clear() async {
    _value = null;
  }
}
