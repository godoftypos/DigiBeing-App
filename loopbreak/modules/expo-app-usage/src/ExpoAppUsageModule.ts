import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAppUsageModuleEvents, InstalledAppsResult, SocialMediaUsageResult, UsagePeriod } from './ExpoAppUsage.types';

declare class ExpoAppUsageModule extends NativeModule<ExpoAppUsageModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  getInstalledSocialMediaApps(): Promise<InstalledAppsResult>;
  getSocialMediaUsage(period: UsagePeriod): Promise<SocialMediaUsageResult>;
  hasUsagePermission(): Promise<boolean>;
  requestUsagePermission(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAppUsageModule>('ExpoAppUsage');
