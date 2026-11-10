import ExpoAppUsageModule from './ExpoAppUsageModule';
import { InstalledAppsResult, SocialMediaUsageResult, UsagePeriod } from './ExpoAppUsage.types';

export async function getInstalledSocialMediaApps(): Promise<InstalledAppsResult> {
  return await ExpoAppUsageModule.getInstalledSocialMediaApps();
}

export async function getSocialMediaUsage(period: UsagePeriod): Promise<SocialMediaUsageResult> {
  return await ExpoAppUsageModule.getSocialMediaUsage(period);
}

export async function hasUsagePermission(): Promise<boolean> {
  return await ExpoAppUsageModule.hasUsagePermission();
}

export async function requestUsagePermission(): Promise<void> {
  return await ExpoAppUsageModule.requestUsagePermission();
}
