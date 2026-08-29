import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/glass_panel.dart';
import '../../design/status_chip.dart';
import 'auth_api.dart';
import 'auth_controller.dart';
import 'auth_models.dart';

enum _AuthMode { login, register, verify, forgot, reset }

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _institution = TextEditingController(text: 'demo');
  final _identifier = TextEditingController(text: 'admin');
  final _institutionUserId = TextEditingController();
  final _displayName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _verificationToken = TextEditingController();
  final _resetToken = TextEditingController();
  final _newPassword = TextEditingController();

  _AuthMode _mode = _AuthMode.login;
  bool _busy = false;
  String? _message;

  @override
  void dispose() {
    for (final controller in <TextEditingController>[
      _institution,
      _identifier,
      _institutionUserId,
      _displayName,
      _email,
      _password,
      _verificationToken,
      _resetToken,
      _newPassword,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() operation) async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await operation();
    } on AuthApiException catch (error) {
      setState(() => _message = error.message);
    } catch (_) {
      setState(
        () => _message = 'Unable to complete the authentication request.',
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _login() => _run(() async {
    await ref
        .read(authControllerProvider.notifier)
        .login(
          institutionSlug: _institution.text,
          identifier: _identifier.text,
          password: _password.text,
        );
  });

  Future<void> _register() => _run(() async {
    final RegistrationResult result = await ref
        .read(authControllerProvider.notifier)
        .register(
          institutionSlug: _institution.text,
          institutionUserId: _institutionUserId.text,
          displayName: _displayName.text,
          email: _email.text,
          password: _password.text,
        );
    _verificationToken.text = result.developmentVerificationToken ?? '';
    setState(() {
      _mode = _AuthMode.verify;
      _message = 'Registration created. Verify your email to enter administrator review.';
    });
  });

  Future<void> _verify() => _run(() async {
    await ref
        .read(authControllerProvider.notifier)
        .verifyEmail(_verificationToken.text);
    setState(() {
      _mode = _AuthMode.login;
      _message = 'Email verified. Your account is waiting for approval.';
    });
  });

  Future<void> _requestReset() => _run(() async {
    final PasswordResetRequestResult result = await ref
        .read(authControllerProvider.notifier)
        .requestPasswordReset(
          institutionSlug: _institution.text,
          identifier: _identifier.text,
        );
    _resetToken.text = result.developmentResetToken ?? '';
    setState(() {
      _mode = _AuthMode.reset;
      _message = 'If the account exists, reset instructions have been issued.';
    });
  });

  Future<void> _confirmReset() => _run(() async {
    await ref
        .read(authControllerProvider.notifier)
        .confirmPasswordReset(
          token: _resetToken.text,
          newPassword: _newPassword.text,
        );
    setState(() {
      _mode = _AuthMode.login;
      _message = 'Password changed. Existing sessions were revoked.';
    });
  });

  @override
  Widget build(BuildContext context) {
    final AuthState auth = ref.watch(authControllerProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: BoardOpsStatusChip(label: 'SECURE ACCESS'),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'BoardOps',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Institution-scoped identity with approval, revocable sessions, and secure mobile token storage.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 28),
                  GlassPanel(
                    strength: GlassStrength.strong,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        if (_mode == _AuthMode.login ||
                            _mode == _AuthMode.register)
                          SegmentedButton<_AuthMode>(
                            segments: const <ButtonSegment<_AuthMode>>[
                              ButtonSegment<_AuthMode>(
                                value: _AuthMode.login,
                                label: Text('Sign in'),
                              ),
                              ButtonSegment<_AuthMode>(
                                value: _AuthMode.register,
                                label: Text('Register'),
                              ),
                            ],
                            selected: <_AuthMode>{_mode},
                            onSelectionChanged: _busy
                                ? null
                                : (Set<_AuthMode> value) {
                                    setState(() {
                                      _mode = value.first;
                                      _message = null;
                                    });
                                  },
                          ),
                        if (_mode == _AuthMode.login) _loginForm(),
                        if (_mode == _AuthMode.register) _registerForm(),
                        if (_mode == _AuthMode.verify) _verificationForm(),
                        if (_mode == _AuthMode.forgot) _forgotForm(),
                        if (_mode == _AuthMode.reset) _resetForm(),
                        if (_message ?? auth.error case final String message)
                          Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: Text(message),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool password = false,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: TextField(
        controller: controller,
        obscureText: password,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  Widget _loginForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _field(_institution, 'Institution'),
        _field(_identifier, 'Institution User ID or email'),
        _field(_password, 'Password', password: true),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _login,
          child: Text(_busy ? 'Signing in…' : 'Sign in'),
        ),
        TextButton(
          onPressed: _busy
              ? null
              : () => setState(() => _mode = _AuthMode.forgot),
          child: const Text('Forgot password?'),
        ),
      ],
    );
  }

  Widget _registerForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        _field(_institution, 'Institution'),
        _field(_institutionUserId, 'Institution User ID'),
        _field(_displayName, 'Full name'),
        _field(_email, 'Email', keyboardType: TextInputType.emailAddress),
        _field(_password, 'Password (12+ characters)', password: true),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _register,
          child: Text(_busy ? 'Creating account…' : 'Create account'),
        ),
      ],
    );
  }

  Widget _verificationForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text('Verify email', style: Theme.of(context).textTheme.headlineSmall),
        _field(_verificationToken, 'Verification token'),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _verify,
          child: const Text('Verify email'),
        ),
        TextButton(
          onPressed: _busy
              ? null
              : () => setState(() => _mode = _AuthMode.login),
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }

  Widget _forgotForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          'Reset password',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        _field(_institution, 'Institution'),
        _field(_identifier, 'Institution User ID or email'),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _requestReset,
          child: const Text('Send reset instructions'),
        ),
        TextButton(
          onPressed: _busy
              ? null
              : () => setState(() => _mode = _AuthMode.login),
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }

  Widget _resetForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          'Choose a new password',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        _field(_resetToken, 'Reset token'),
        _field(_newPassword, 'New password (12+ characters)', password: true),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : _confirmReset,
          child: const Text('Change password'),
        ),
      ],
    );
  }
}
