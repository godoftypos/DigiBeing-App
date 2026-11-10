// Reexport the native module. On web, it will be resolved to ExpoAppUsageModule.web.ts
// and on native platforms to ExpoAppUsageModule.ts
export { default } from './src/ExpoAppUsageModule';
export { default as ExpoAppUsageView } from './src/ExpoAppUsageView';
export * from  './src/ExpoAppUsage.types';
