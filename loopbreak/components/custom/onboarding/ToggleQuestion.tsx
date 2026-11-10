import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { OnboardingFormData, Question } from '~/types/onboarding';

interface ToggleQuestionProps {
  question: Question;
  control: Control<OnboardingFormData>;
  name: keyof OnboardingFormData;
}

export function ToggleQuestion({ question, control, name }: ToggleQuestionProps) {
  return (
    <View className="flex-1">
      <View className="mb-8">
        <Text className="text-2xl font-bold mb-2 font-[Poppins] text-gray-800">
          {question.title}
        </Text>
        <Text className="text-gray-600 text-base">
          {question.subtitle}
        </Text>
      </View>

      <View className="flex-1 space-y-4">
        {question.options.map((option) => (
          <Controller
            key={option.id}
            control={control}
            name={`${name}.${option.id}` as any}
            defaultValue={false}
            render={({ field: { onChange, value } }) => (
              <View className="p-4 rounded-xl border-2 border-gray-200 bg-white">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="font-medium text-base text-gray-800">
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text className="text-sm mt-1 text-gray-500">
                        {option.description}
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#e5e5e5', true: '#3b82f6' }}
                    thumbColor={value ? '#ffffff' : '#ffffff'}
                    ios_backgroundColor="#e5e5e5"
                  />
                </View>
              </View>
            )}
          />
        ))}
      </View>
    </View>
  );
}
