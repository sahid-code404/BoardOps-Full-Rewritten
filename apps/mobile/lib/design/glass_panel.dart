import 'dart:ui';

import 'package:flutter/material.dart';

import 'design_tokens.dart';

enum GlassStrength { soft, regular, strong }

class GlassPanel extends StatelessWidget {
  const GlassPanel({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(BoardOpsSpacing.xl),
    this.strength = GlassStrength.regular,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final GlassStrength strength;

  @override
  Widget build(BuildContext context) {
    final bool dark = Theme.of(context).brightness == Brightness.dark;
    final double blur = switch (strength) {
      GlassStrength.soft => BoardOpsGlass.blurSoft,
      GlassStrength.regular => BoardOpsGlass.blurRegular,
      GlassStrength.strong => BoardOpsGlass.blurStrong,
    };
    final Color fill = Color(
      dark
          ? (strength == GlassStrength.strong
              ? BoardOpsDarkColors.glassStrong
              : BoardOpsDarkColors.glass)
          : (strength == GlassStrength.strong
              ? BoardOpsLightColors.glassStrong
              : BoardOpsLightColors.glass),
    );
    final Color border = Color(
      dark ? BoardOpsDarkColors.border : BoardOpsLightColors.border,
    );

    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(BoardOpsRadius.xxl),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: fill,
              borderRadius: BorderRadius.circular(BoardOpsRadius.xxl),
              border: Border.all(color: border),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: Color(0x24120D19),
                  blurRadius: 36,
                  offset: Offset(0, 14),
                ),
              ],
            ),
            child: Padding(padding: padding, child: child),
          ),
        ),
      ),
    );
  }
}
