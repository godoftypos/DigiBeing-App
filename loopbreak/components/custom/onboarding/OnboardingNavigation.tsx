import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isNextDisabled = false,
  isLoading = false
}: OnboardingNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <View className="pt-6 border-t border-gray-100">
      {/* Top buttons row */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          onPress={onPrevious}
          disabled={isFirstStep}
          className={`flex-row items-center px-4 py-2 rounded-lg ${
            isFirstStep ? 'opacity-40' : ''
          }`}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={isFirstStep ? '#9ca3af' : '#374151'} 
          />
          <Text className={`ml-1 font-medium ${
            isFirstStep ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          className="px-4 py-2 rounded-lg"
        >
          <Text className="text-gray-500 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main action button */}
      <TouchableOpacity
        onPress={onNext}
        disabled={isNextDisabled || isLoading}
        className={`w-full py-4 rounded-xl items-center justify-center flex-row ${
          isNextDisabled || isLoading
            ? 'bg-gray-300'
            : 'bg-blue-500'
        }`}
      >
        <Text className={`font-semibold text-lg ${
          isNextDisabled || isLoading
            ? 'text-gray-500'
            : 'text-white'
        }`}>
          {isLoading ? 'Loading...' : isLastStep ? 'Get Started' : 'Next'}
        </Text>
        {!isLoading && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isNextDisabled ? '#6b7280' : '#ffffff'}
            style={{ marginLeft: 8 }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
