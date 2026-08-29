import 'package:flutter/material.dart';

import '../design/boardops_theme.dart';
import '../routing/app_router.dart';

class BoardOpsApp extends StatelessWidget {
  const BoardOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'BoardOps',
      debugShowCheckedModeBanner: false,
      theme: buildBoardOpsTheme(Brightness.light),
      darkTheme: buildBoardOpsTheme(Brightness.dark),
      themeMode: ThemeMode.system,
      routerConfig: appRouter,
    );
  }
}
