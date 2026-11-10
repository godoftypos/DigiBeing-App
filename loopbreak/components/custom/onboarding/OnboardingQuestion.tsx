import { View, Text, ScrollView } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { OnboardingFormData, Question } from '~/types/onboarding';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { ToggleQuestion } from './ToggleQuestion';

interface OnboardingQuestionProps {
  question: Question;
  control: Control<OnboardingFormData>;
  currentStep: number;
}

export function OnboardingQuestion({ question, control, currentStep }: OnboardingQuestionProps) {
  const getFieldName = (): keyof OnboardingFormData => {
    switch (question.id) {
      case 'interests':
        return 'interests';
      case 'goals':
        return 'goals';
      case 'experience':
        return 'experience';
      case 'preferences':
        return 'preferences';
      default:
        return 'interests';
    }
  };

  const fieldName = getFieldName();

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-1 min-h-full">
        {question.type === 'toggle' ? (
          <ToggleQuestion
            question={question}
            control={control}
            name={fieldName}
          />
        ) : (
          <MultiSelectQuestion
            question={question}
            control={control}
            name={fieldName}
          />
        )}
      </View>
    </ScrollView>
  );
}
