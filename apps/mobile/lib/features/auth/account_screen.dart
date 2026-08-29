import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/glass_panel.dart';
import '../../design/status_chip.dart';
import 'auth_api.dart';
import 'auth_controller.dart';
import 'auth_models.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({required this.session, super.key});

  final AuthSession session;

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final TextEditingController _otpCode = TextEditingController();
  OtpChallenge? _challenge;
  List<DeviceSession>? _sessions;
  bool _busy = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  @override
  void dispose() {
    _otpCode.dispose();
    super.dispose();
  }

  Future<void> _perform(Future<void> Function() operation) async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await operation();
    } on AuthApiException catch (error) {
      if (mounted) setState(() => _message = error.message);
    } catch (_) {
      if (mounted)
        setState(
          () => _message = 'The security operation could not be completed.',
        );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loadSessions() async {
    try {
      final List<DeviceSession> sessions = await ref
          .read(authControllerProvider.notifier)
          .sessions();
      if (mounted) setState(() => _sessions = sessions);
    } catch (_) {
      if (mounted) setState(() => _sessions = const <DeviceSession>[]);
    }
  }

  Future<void> _requestOtp() => _perform(() async {
    final OtpChallenge challenge = await ref
        .read(authControllerProvider.notifier)
        .requestOtp();
    _otpCode.text = challenge.developmentCode ?? '';
    setState(() {
      _challenge = challenge;
      _message = 'Verification code issued. It expires in five minutes.';
    });
  });

  Future<void> _verifyOtp() => _perform(() async {
    final OtpChallenge? challenge = _challenge;
    if (challenge == null) return;
    await ref
        .read(authControllerProvider.notifier)
        .verifyOtp(challengeId: challenge.challengeId, code: _otpCode.text);
    setState(() {
      _challenge = null;
      _otpCode.clear();
      _message = 'Step-up verification complete for this session.';
    });
    await _loadSessions();
  });

  @override
  Widget build(BuildContext context) {
    final AuthSession session =
        ref.watch(authControllerProvider).session ?? widget.session;
    final AuthUser user = session.user;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 920),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      const BoardOpsStatusChip(
                        label: 'AUTHENTICATED',
                        tone: BoardOpsStatusTone.success,
                      ),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: _busy
                            ? null
                            : () => ref
                                  .read(authControllerProvider.notifier)
                                  .logout(),
                        icon: const Icon(Icons.logout_rounded),
                        label: const Text('Sign out'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Welcome, ${user.displayName}',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 8),
                  Text('${user.institutionUserId} · ${user.email}'),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 18,
                    runSpacing: 18,
                    children: <Widget>[
                      SizedBox(
                        width: 430,
                        child: GlassPanel(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                'Account lifecycle',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall,
                              ),
                              const SizedBox(height: 10),
                              BoardOpsStatusChip(
                                label: user.accountState.replaceAll('_', ' '),
                                tone: user.accountState == 'ACTIVE'
                                    ? BoardOpsStatusTone.success
                                    : BoardOpsStatusTone.warning,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '${user.permissions.length} effective permissions',
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Identity and authorization remain separate. Phase 05 expands the permission engine without changing this secure session contract.',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 430,
                        child: GlassPanel(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: <Widget>[
                              Text(
                                'Step-up verification',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                session.stepUpVerifiedAtMs == null
                                    ? 'Request a one-time code before a future sensitive action.'
                                    : 'This session completed step-up verification.',
                              ),
                              if (_challenge != null) ...<Widget>[
                                const SizedBox(height: 14),
                                TextField(
                                  controller: _otpCode,
                                  keyboardType: TextInputType.number,
                                  maxLength: 6,
                                  decoration: const InputDecoration(
                                    labelText: '6-digit verification code',
                                  ),
                                ),
                                FilledButton(
                                  onPressed: _busy ? null : _verifyOtp,
                                  child: const Text('Verify code'),
                                ),
                              ] else ...<Widget>[
                                const SizedBox(height: 14),
                                FilledButton.tonal(
                                  onPressed:
                                      _busy || user.accountState != 'ACTIVE'
                                      ? null
                                      : _requestOtp,
                                  child: const Text('Request one-time code'),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_message != null) ...<Widget>[
                    const SizedBox(height: 16),
                    Text(_message!),
                  ],
                  const SizedBox(height: 20),
                  GlassPanel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Text(
                              'Devices & sessions',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const Spacer(),
                            IconButton(
                              onPressed: _loadSessions,
                              tooltip: 'Refresh sessions',
                              icon: const Icon(Icons.refresh_rounded),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_sessions == null)
                          const LinearProgressIndicator()
                        else if (_sessions!.isEmpty)
                          const Text('No sessions are available.')
                        else
                          ..._sessions!.map(
                            (DeviceSession item) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: Icon(
                                item.clientType == 'MOBILE'
                                    ? Icons.phone_android_rounded
                                    : Icons.language_rounded,
                              ),
                              title: Text(item.deviceName ?? item.clientType),
                              subtitle: Text(
                                item.id == session.sessionId
                                    ? 'Current session'
                                    : 'Last active ${DateTime.fromMillisecondsSinceEpoch(item.lastSeenAtMs).toLocal()}',
                              ),
                              trailing: item.revokedAtMs == null
                                  ? IconButton(
                                      tooltip: 'Revoke session',
                                      onPressed: _busy
                                          ? null
                                          : () => _perform(() async {
                                              await ref
                                                  .read(
                                                    authControllerProvider
                                                        .notifier,
                                                  )
                                                  .revokeSession(item.id);
                                              await _loadSessions();
                                            }),
                                      icon: const Icon(Icons.block_rounded),
                                    )
                                  : const BoardOpsStatusChip(
                                      label: 'REVOKED',
                                      tone: BoardOpsStatusTone.danger,
                                    ),
                            ),
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
}
