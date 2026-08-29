import 'package:go_router/go_router.dart';

import '../features/auth/auth_gate.dart';
import '../features/foundation/foundation_screen.dart';

final GoRouter appRouter = GoRouter(
  routes: <RouteBase>[
    GoRoute(path: '/', builder: (context, state) => const AuthGate()),
    GoRoute(
      path: '/foundation',
      builder: (context, state) => const FoundationScreen(),
    ),
  ],
);
