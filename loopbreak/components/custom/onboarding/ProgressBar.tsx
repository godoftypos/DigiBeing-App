import { View } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressBar({ currentStep, totalSteps, className = '' }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <View 
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </View>
  );
}
