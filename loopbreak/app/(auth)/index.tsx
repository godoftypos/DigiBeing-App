import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StatusBar,
    Alert,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { set, z } from 'zod';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '~/components/ui/Input';
import { BottomModal } from '~/components/ui/BottomModal';
import { OTPForm, OtpFormData } from '~/components/custom/auth/OTPForm';
import { Button } from '~/components/ui/Button';
import { useAuthStore } from '~/lib/store/auth.store';

const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Infer the type from the schema
type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = () => {

    const router = useRouter();
    const { login, verifyOTP, getOTP } = useAuthStore();

    const [uid, setUid] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);


    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

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

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        const res = await login(data);
        
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
                            <Ionicons name="log-in" size={32} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</Text>
                        <Text className="text-gray-600 text-center text-base">
                            Sign in to continue your journey
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
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

                        <Button 
                            title="Send OTP"
                            loading={loading}
                            onPress={handleSubmit(onSubmit)}
                        />
                    </View>

                    {/* Register Link */}
                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-gray-600 text-base">
                            Don't have an account? 
                        </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/(auth)/register')}
                            className="ml-1"
                        >
                            <Text className="text-blue-600 font-semibold text-base">
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Additional Features */}
                    <View className="mt-8 space-y-4">
                        <View className="flex-row items-center justify-center">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Text className="mx-4 text-gray-500 text-sm">Secure Login</Text>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>
                        
                        <View className="flex-row justify-center gap-8 mt-4">
                            <View className="items-center">
                                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="shield-checkmark" size={20} color="#059669" />
                                </View>
                                <Text className="text-xs text-gray-600">Secure</Text>
                            </View>
                            <View className="items-center">
                                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="flash" size={20} color="#2563eb" />
                                </View>
                                <Text className="text-xs text-gray-600">Fast</Text>
                            </View>
                            <View className="items-center">
                                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="lock-closed" size={20} color="#7c3aed" />
                                </View>
                                <Text className="text-xs text-gray-600">Private</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <BottomModal isVisible={isModalVisible} onClose={() => setModalVisible(false)}>
                <OTPForm onSubmit={handleVerifyOTP} loading={loading} />
            </BottomModal>
        </SafeAreaView>
    );
};

export default LoginScreen;