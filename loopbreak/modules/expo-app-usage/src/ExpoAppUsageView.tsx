import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoAppUsageViewProps } from './ExpoAppUsage.types';

const NativeView: React.ComponentType<ExpoAppUsageViewProps> =
  requireNativeView('ExpoAppUsage');

export default function ExpoAppUsageView(props: ExpoAppUsageViewProps) {
  return <NativeView {...props} />;
}
