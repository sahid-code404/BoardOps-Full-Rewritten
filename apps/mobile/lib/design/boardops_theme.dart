import 'package:flutter/material.dart';

import 'design_tokens.dart';

ThemeData buildBoardOpsTheme(Brightness brightness) {
  final bool dark = brightness == Brightness.dark;
  final int background = dark ? BoardOpsDarkColors.background : BoardOpsLightColors.background;
  final int surface = dark ? BoardOpsDarkColors.surface : BoardOpsLightColors.surface;
  final int foreground = dark ? BoardOpsDarkColors.foreground : BoardOpsLightColors.foreground;
  final int muted = dark ? BoardOpsDarkColors.foregroundMuted : BoardOpsLightColors.foregroundMuted;
  final int primary = dark ? BoardOpsDarkColors.primary : BoardOpsLightColors.primary;
  final int onPrimary = dark ? BoardOpsDarkColors.primaryForeground : BoardOpsLightColors.primaryForeground;
  final int accent = dark ? BoardOpsDarkColors.accent : BoardOpsLightColors.accent;
  final int danger = dark ? BoardOpsDarkColors.danger : BoardOpsLightColors.danger;

  final ColorScheme scheme = ColorScheme(
    brightness: brightness,
    primary: Color(primary),
    onPrimary: Color(onPrimary),
    secondary: Color(accent),
    onSecondary: dark ? const Color(0xFF1B1420) : Colors.white,
    error: Color(danger),
    onError: Colors.white,
    surface: Color(surface),
    onSurface: Color(foreground),
  );

  final TextTheme baseText = Typography.material2021(platform: TargetPlatform.android)
      .black
      .apply(
        bodyColor: Color(foreground),
        displayColor: Color(foreground),
      );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: Color(background),
    textTheme: baseText.copyWith(
      displayLarge: baseText.displayLarge?.copyWith(
        fontSize: 56,
        fontWeight: FontWeight.w700,
        letterSpacing: -2.4,
        height: 0.98,
      ),
      headlineMedium: baseText.headlineMedium?.copyWith(
        fontSize: 34,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
      ),
      titleLarge: baseText.titleLarge?.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.6,
      ),
      bodyLarge: baseText.bodyLarge?.copyWith(
        fontSize: 16,
        height: 1.55,
      ),
      bodyMedium: baseText.bodyMedium?.copyWith(
        color: Color(muted),
        height: 1.5,
      ),
      labelLarge: baseText.labelLarge?.copyWith(
        fontWeight: FontWeight.w700,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, BoardOpsAccessibility.minimumTouchTarget),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        shape: const StadiumBorder(),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, BoardOpsAccessibility.minimumTouchTarget),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        shape: const StadiumBorder(),
      ),
    ),
  );
}
