import { View, Text, TouchableOpacity } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { OnboardingFormData, Question } from '~/types/onboarding';

interface MultiSelectQuestionProps {
  question: Question;
  control: Control<OnboardingFormData>;
  name: keyof OnboardingFormData;
}

export function MultiSelectQuestion({ question, control, name }: MultiSelectQuestionProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value = [] }, fieldState: { error } }) => (
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

          <View className="flex-1">
            {question.type === 'multiSelect' && (
              <View className="space-y-4">
                {question.options.map((option) => {
                  const isSelected = Array.isArray(value) && value.includes(option.id);
                  
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (isSelected) {
                          onChange(currentValues.filter(id => id !== option.id));
                        } else {
                          if (question.maxSelections && currentValues.length >= question.maxSelections) {
                            return;
                          }
                          onChange([...currentValues, option.id]);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`font-medium text-base ${
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
            )}

            {question.type === 'singleSelect' && (
              <View className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = value === option.id;
                  
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => onChange(option.id)}
                      className={`p-4 rounded-xl border-2 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`font-medium text-base ${
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
            )}
          </View>
        </View>
      )}
    />
  );
}
