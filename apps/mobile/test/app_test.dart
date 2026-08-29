import 'package:boardops/app/boardops_app.dart';
import 'package:boardops/features/auth/auth_controller.dart';
import 'package:boardops/features/auth/auth_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('boots the secure authentication entry point',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authTokenStorageProvider.overrideWithValue(MemoryAuthTokenStorage()),
        ],
        child: const BoardOpsApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('BoardOps'), findsOneWidget);
    expect(find.text('SECURE ACCESS'), findsOneWidget);
    expect(find.text('Sign in'), findsWidgets);
    expect(find.text('Register'), findsOneWidget);
  });
}
