import 'package:flutter/material.dart';

import '../../design/design.dart';

class FoundationScreen extends StatelessWidget {
  const FoundationScreen({super.key});

  static const List<({String label, String value, String detail, BoardOpsStatusTone tone})> _kpis = <({String label, String value, String detail, BoardOpsStatusTone tone})>[
    (label: 'Residents', value: '248', detail: '+12 this month', tone: BoardOpsStatusTone.success),
    (label: 'Collection', value: '₹1.84L', detail: '92.4% posted', tone: BoardOpsStatusTone.info),
    (label: 'Pending', value: '₹15.2K', detail: '8 accounts', tone: BoardOpsStatusTone.warning),
  ];

  @override
  Widget build(BuildContext context) {
    final bool dark = Theme.of(context).brightness == Brightness.dark;
    final Color primary = Color(dark ? BoardOpsDarkColors.primary : BoardOpsLightColors.primary);
    final Color accent = Color(dark ? BoardOpsDarkColors.accent : BoardOpsLightColors.accent);

    return Scaffold(
      body: Stack(
        children: <Widget>[
          Positioned(
            top: -120,
            left: -100,
            child: _AmbientOrb(color: primary),
          ),
          Positioned(
            right: -120,
            bottom: -160,
            child: _AmbientOrb(color: accent),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                final double horizontal = constraints.maxWidth < BoardOpsBreakpoints.compact
                    ? BoardOpsSpacing.lg
                    : BoardOpsSpacing.xl;
                return SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                    horizontal,
                    BoardOpsSpacing.xl,
                    horizontal,
                    BoardOpsSpacing.xxl,
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1180),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'PHASE 02 · SHARED DESIGN LANGUAGE',
                            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                  color: primary,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.6,
                                ),
                          ),
                          const SizedBox(height: BoardOpsSpacing.md),
                          Text('BoardOps', style: Theme.of(context).textTheme.displayLarge),
                          const SizedBox(height: BoardOpsSpacing.md),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 720),
                            child: Text(
                              'Premium institutional clarity with the purple/graphite identity, bounded glass, large rounded geometry, and purposeful motion.',
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: Theme.of(context).textTheme.bodyMedium?.color,
                                  ),
                            ),
                          ),
                          const SizedBox(height: BoardOpsSpacing.xxl),
                          Wrap(
                            spacing: BoardOpsSpacing.lg,
                            runSpacing: BoardOpsSpacing.lg,
                            children: _kpis
                                .map(
                                  (item) => SizedBox(
                                    width: constraints.maxWidth < BoardOpsBreakpoints.compact
                                        ? constraints.maxWidth - horizontal * 2
                                        : 300,
                                    child: GlassPanel(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: <Widget>[
                                          Row(
                                            children: <Widget>[
                                              Expanded(child: Text(item.label)),
                                              BoardOpsStatusChip(label: item.detail, tone: item.tone),
                                            ],
                                          ),
                                          const SizedBox(height: BoardOpsSpacing.xl),
                                          Text(
                                            item.value,
                                            style: Theme.of(context).textTheme.headlineMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: BoardOpsSpacing.lg),
                          GlassPanel(
                            strength: GlassStrength.strong,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Row(
                                  children: <Widget>[
                                    Expanded(
                                      child: Text(
                                        'One bounded blur layer',
                                        style: Theme.of(context).textTheme.titleLarge,
                                      ),
                                    ),
                                    const BoardOpsStatusChip(
                                      label: 'GPU-aware',
                                      tone: BoardOpsStatusTone.success,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: BoardOpsSpacing.md),
                                Text(
                                  'Parent surfaces own backdrop blur. Nested content stays translucent instead of stacking filters.',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: BoardOpsSpacing.xl),
                                Wrap(
                                  spacing: BoardOpsSpacing.sm,
                                  runSpacing: BoardOpsSpacing.sm,
                                  children: <Widget>[
                                    FilledButton(onPressed: () {}, child: const Text('Primary action')),
                                    OutlinedButton(onPressed: () {}, child: const Text('Secondary')),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _AmbientOrb extends StatelessWidget {
  const _AmbientOrb({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    final bool reduceMotion = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    return TweenAnimationBuilder<double>(
      duration: reduceMotion ? Duration.zero : BoardOpsMotion.emphasized,
      tween: Tween<double>(begin: 0.28, end: 0.38),
      builder: (BuildContext context, double opacity, Widget? child) {
        return Container(
          width: 320,
          height: 320,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: color.withValues(alpha: opacity),
                blurRadius: 150,
                spreadRadius: 24,
              ),
            ],
          ),
        );
      },
    );
  }
}
