import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    Alert,
    TouchableOpacity,
    Platform,
    ScrollView
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { InputField } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { BottomModal } from '~/components/ui/BottomModal';
import { OTPForm, OtpFormData } from '~/components/custom/auth/OTPForm';
import { useAuthStore } from '~/lib/store/auth.store';

const registerSchema = z.object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters long' }),
    email: z.email({ message: 'Please enter a valid email address' }),
    dateOfBirth: z.date({ message: 'Date of birth is required' }),
});

// Infer the type from the schema
type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
    const router = useRouter();
    const { register, verifyOTP, getOTP } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [uid, setUid] = useState<string>("");
    const [isModalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const selectedDate = watch('dateOfBirth');

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setValue('dateOfBirth', selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    async function handleVerifyOTP(data: OtpFormData) {
        setLoading(true);
        const res = await verifyOTP(uid, parseInt(data.otp));
        setLoading(false);

        if (res.success) {
            Alert.alert("OTP Verified", "You are now logged in");
            router.push("/private/(tabs)")
        } else {
            Alert.alert("OTP Verification Failed", res.message);
        }
    }

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        const res = await register(data);

        if (res.success) {
            setUid(res.data.id);
            const otp = await getOTP(res.data.id);
            if (otp.success) {
                setLoading(false);
                setModalVisible(true);
            } else {
                setLoading(false);
                Alert.alert("Failed to send OTP", otp.message);
            }
        } else {
            setLoading(false);
            Alert.alert("Login failed", res.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 justify-center px-6 py-8">
                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4 shadow-lg">
                            <Ionicons name="person-add" size={32} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-gray-800 mb-2">Create Account</Text>
                        <Text className="text-gray-600 text-center text-base">
                            Join us today and start your journey
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <InputField
                                    label="Full Name"
                                    placeholder="John Doe"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.name?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <InputField
                                    label="Email Address"
                                    placeholder="you@example.com"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.email?.message}
                                    keyboardType="email-address"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="dateOfBirth"
                            render={({ field: { value } }) => (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-medium mb-2">Date of Birth</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        className={`border-2 rounded-xl px-4 py-4 bg-gray-50 flex-row items-center justify-between ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                    >
                                        <Text className={`text-base ${value ? 'text-gray-800' : 'text-gray-400'
                                            }`}>
                                            {value ? formatDate(value) : 'Select your date of birth'}
                                        </Text>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={20}
                                            color={value ? "#374151" : "#9CA3AF"}
                                        />
                                    </TouchableOpacity>
                                    {errors.dateOfBirth && (
                                        <Text className="text-red-500 text-sm mt-1">
                                            {errors.dateOfBirth.message}
                                        </Text>
                                    )}
                                </View>
                            )}
                        />

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                maximumDate={new Date()}
                                minimumDate={new Date(1900, 0, 1)}
                            />
                        )}

                        <Button
                            title='Create Account'
                            loading={loading}
                            onPress={handleSubmit(onSubmit)}
                        />
                    </View>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-gray-600 text-base">
                            Already have an account?
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)')}
                            className="ml-1"
                        >
                            <Text className="text-blue-600 font-semibold text-base">
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <BottomModal isVisible={isModalVisible} onClose={() => setModalVisible(false)}>
                <OTPForm onSubmit={handleVerifyOTP} loading={loading} />
            </BottomModal>
        </SafeAreaView>
    );
};

export default RegisterScreen;