import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type ExpoAppUsageModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoAppUsageViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

// App Usage Types
export interface AppUsageData {
  packageName: string;
  appName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
}

export interface InstalledAppsResult {
  totalCount: number;
  apps: Array<{
    packageName: string;
    appName: string;
  }>;
}

export interface SocialMediaUsageResult {
  period: 'today' | 'week' | 'month';
  totalUsageTime: number;
  apps: AppUsageData[];
}

export type UsagePeriod = 'today' | 'week' | 'month';
