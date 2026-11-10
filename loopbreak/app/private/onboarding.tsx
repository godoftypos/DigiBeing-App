import { StatusBar, View, Text, TouchableOpacity, ScrollView, Switch, Alert } from "react-native";
import { Container } from "~/components/layout/Container";
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { postToAPI } from "~/lib/api";

// Types and validation schema
const onboardingSchema = z.object({
  scrollingReason: z.string().min(1, "Please select your biggest reason for scrolling"),
  scrollingTime: z.string().min(1, "Please select when you doomscroll the most"),
  scrollingStyle: z.string().min(1, "Please select your scrolling style"),
  afterScrollingFeel: z.string().min(1, "Please select how you feel after scrolling"),
  productivityRelationship: z.string().min(1, "Please select your relationship with productivity"),
  appGoals: z.string().min(1, "Please select what you hope to gain")
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  type: 'multiSelect' | 'singleSelect' | 'toggle';
  options: Option[];
  minSelections?: number;
  maxSelections?: number;
}

// Questions data
const onboardingQuestions: Question[] = [
  {
    id: 'scrollingReason',
    title: 'What\'s your biggest reason for scrolling endlessly?',
    subtitle: 'Understanding your motivation helps us create better solutions.',
    type: 'singleSelect',
    options: [
      { id: 'bored', label: '🧠 I\'m bored and need mental stimulation' },
      { id: 'avoiding', label: '😞 I\'m avoiding something or feeling overwhelmed' },
      { id: 'mindless', label: '😶‍🌫️ It just happens — I lose track of time' },
    ]
  },
  {
    id: 'scrollingTime',
    title: 'When do you find yourself doomscrolling the most?',
    subtitle: 'Knowing your patterns helps us provide timely interventions.',
    type: 'singleSelect',
    options: [
      { id: 'night', label: '🌙 At night before bed' },
      { id: 'day', label: '🌤️ During the day when I\'m taking breaks' },
      { id: 'morning', label: '⏰ As soon as I wake up' },
    ]
  },
  {
    id: 'scrollingStyle',
    title: 'Which of these best describes your scrolling style?',
    subtitle: 'Different styles need different approaches.',
    type: 'singleSelect',
    options: [
      { id: 'endless', label: '🔁 Endless — I hop from app to app' },
      { id: 'deepdive', label: '🕳️ Deep dive — I stick to one app and lose hours' },
      { id: 'curious', label: '🧭 Curious — I chase links and explore rabbit holes' },
    ]
  },
  {
    id: 'afterScrollingFeel',
    title: 'How do you usually feel after a doomscrolling session?',
    subtitle: 'Your feelings matter and guide our recommendations.',
    type: 'singleSelect',
    options: [
      { id: 'drained', label: '😔 Drained or guilty' },
      { id: 'numb', label: '😵‍💫 Numb or zoned out' },
      { id: 'indifferent', label: '😐 I don\'t really think about it' },
    ]
  },
  {
    id: 'productivityRelationship',
    title: 'What\'s your current relationship with productivity?',
    subtitle: 'We\'ll tailor your experience to match your work style.',
    type: 'singleSelect',
    options: [
      { id: 'struggle', label: '🐢 I struggle to get going' },
      { id: 'decent', label: '⚖️ I\'m decent but easily thrown off track' },
      { id: 'overwork', label: '🐎 I\'m always working — but maybe too much' },
    ]
  },
  {
    id: 'appGoals',
    title: 'What are you hoping to gain by using this app?',
    subtitle: 'Your goals will shape your personalized experience.',
    type: 'singleSelect',
    options: [
      { id: 'peace', label: '🧘‍♂️ Peace of mind' },
      { id: 'control', label: '🚀 More control over my time' },
      { id: 'healthy', label: '💪 A healthier relationship with tech' },
    ]
  }
];

// Progress Bar Component
function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
      <View 
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </View>
  );
}

// Multi-Select and Single-Select Question Component
function MultiSelectQuestion({ question, control, name }: { 
  question: Question; 
  control: any; 
  name: keyof OnboardingFormData 
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value = '' }, fieldState: { error } }) => (
        <View className="flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-2 font-[Poppins] text-gray-800">
              {question.title}
            </Text>
            <Text className="text-gray-600 text-base">
              {question.subtitle}
            </Text>
            {error && (
              <Text className="text-red-500 text-sm mt-2">
                {error.message}
              </Text>
            )}
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="space-y-4">
              {question.options.map((option) => {
                const isSelected = question.type === 'multiSelect' 
                  ? Array.isArray(value) && value.includes(option.id)
                  : value === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      if (question.type === 'multiSelect') {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (isSelected) {
                          const newValues = currentValues.filter(id => id !== option.id);
                          onChange(newValues);
                        } else {
                          if (question.maxSelections && currentValues.length >= question.maxSelections) {
                            return;
                          }
                          const newValues = [...currentValues, option.id];
                          onChange(newValues);
                        }
                      } else {
                        onChange(option.id);
                      }
                    }}
                    className={`p-5 mb-4 rounded-2xl border-2 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    } shadow-sm`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`font-medium text-md ${
                          isSelected ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text className={`text-sm mt-1 ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {option.description}
                          </Text>
                        )}
                      </View>
                      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <View className="w-3 h-3 rounded-full bg-white" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    />
  );
}

// Navigation Component
function OnboardingNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isNextDisabled = false,
  isLoading = false
}: {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <View className="pt-6 border-t border-gray-100">
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

// Main Onboarding Component
export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, watch, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      scrollingReason: '',
      scrollingTime: '',
      scrollingStyle: '',
      afterScrollingFeel: '',
      productivityRelationship: '',
      appGoals: ''
    }
  });

  const watchedValues = watch();
  const currentQuestion = onboardingQuestions[currentStep - 1];
  const totalSteps = onboardingQuestions.length;

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return watchedValues.scrollingReason && watchedValues.scrollingReason.length > 0;
      case 2:
        return watchedValues.scrollingTime && watchedValues.scrollingTime.length > 0;
      case 3:
        return watchedValues.scrollingStyle && watchedValues.scrollingStyle.length > 0;
      case 4:
        return watchedValues.afterScrollingFeel && watchedValues.afterScrollingFeel.length > 0;
      case 5:
        return watchedValues.productivityRelationship && watchedValues.productivityRelationship.length > 0;
      case 6:
        return watchedValues.appGoals && watchedValues.appGoals.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      // Move to next step
      setCurrentStep(currentStep + 1);
    } else {
      // If it's the last step, complete onboarding and go to home
      router.replace('/private/(tabs)');
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      const res = await postToAPI("/users/update-profile", {onboardingDone: true})
      
      if (res.success) {
        Alert.alert(
          'Welcome!', 
          'Your profile has been set up successfully.',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/private/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update onboarding. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <StatusBar barStyle="dark-content" />
      
      <View className="w-full flex-1">
        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        
        {/* Step indicator */}
        <Text className="text-center text-gray-500 text-sm mb-6">
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Question Content */}
        <View className="flex-1">
          <MultiSelectQuestion
            question={currentQuestion}
            control={control}
            name={currentQuestion.id as keyof OnboardingFormData}
          />
        </View>

        {/* Navigation */}
        <OnboardingNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          isNextDisabled={!isCurrentStepValid()}
          isLoading={isLoading}
        />
      </View>
    </Container>
  );
}
