import 'package:flutter/material.dart';

import 'design_tokens.dart';

enum BoardOpsStatusTone { info, success, warning, danger }

class BoardOpsStatusChip extends StatelessWidget {
  const BoardOpsStatusChip({
    required this.label,
    super.key,
    this.tone = BoardOpsStatusTone.info,
  });

  final String label;
  final BoardOpsStatusTone tone;

  @override
  Widget build(BuildContext context) {
    final bool dark = Theme.of(context).brightness == Brightness.dark;
    final int colorValue = switch (tone) {
      BoardOpsStatusTone.info => dark ? BoardOpsDarkColors.info : BoardOpsLightColors.info,
      BoardOpsStatusTone.success => dark ? BoardOpsDarkColors.success : BoardOpsLightColors.success,
      BoardOpsStatusTone.warning => dark ? BoardOpsDarkColors.warning : BoardOpsLightColors.warning,
      BoardOpsStatusTone.danger => dark ? BoardOpsDarkColors.danger : BoardOpsLightColors.danger,
    };
    final Color color = Color(colorValue);

    return Container(
      constraints: const BoxConstraints(minHeight: 28),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(BoardOpsRadius.pill),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
