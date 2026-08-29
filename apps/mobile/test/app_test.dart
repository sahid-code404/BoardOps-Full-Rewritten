import 'package:boardops/app/boardops_app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('boots the Phase 02 shared design language', (WidgetTester tester) async {
    await tester.pumpWidget(const BoardOpsApp());
    await tester.pumpAndSettle();
    expect(find.text('BoardOps'), findsOneWidget);
    expect(find.text('PHASE 02 · SHARED DESIGN LANGUAGE'), findsOneWidget);
    expect(find.text('One bounded blur layer'), findsOneWidget);
  });
}
