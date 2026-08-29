import 'package:boardops/app/boardops_app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('boots the BoardOps foundation', (WidgetTester tester) async {
    await tester.pumpWidget(const BoardOpsApp());
    await tester.pumpAndSettle();
    expect(find.text('BoardOps'), findsOneWidget);
    expect(find.text('PHASE 01 · ARCHITECTURE'), findsOneWidget);
  });
}
