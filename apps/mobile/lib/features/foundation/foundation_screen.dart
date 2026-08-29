import 'package:flutter/material.dart';

class FoundationScreen extends StatelessWidget {
  const FoundationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('PHASE 01 · ARCHITECTURE', style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: 12),
                  Text('BoardOps', style: Theme.of(context).textTheme.displayMedium),
                  const SizedBox(height: 12),
                  const Text('The Flutter surface is running. Business modules remain intentionally absent until the architecture foundation is verified.'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
