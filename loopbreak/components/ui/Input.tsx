import { Text, TextInput, View, TextInputProps } from "react-native";

interface InputFieldProps extends TextInputProps {
    label: string;
    error?: string;
    className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    placeholder,
    error,
    className,
    ...props
}) => {
    return (
        <View className="w-full mb-4">
            <Text className="text-base text-gray-600 mb-2">{label}</Text>
            <TextInput
                className={`border ${error ? 'border-red-500' : 'border-gray-300'} p-4 rounded-lg text-base ${className}`}
                placeholder={placeholder}
                placeholderTextColor="#A0AEC0"
                {...props}
            />
            {error && <Text className="text-red-500 mt-1">{error}</Text>}
        </View>
    );
};