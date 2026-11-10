import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { InputField } from "~/components/ui/Input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/Button";
import { useState } from "react";

const otpSchema = z.object({
    otp: z.string().length(6, { message: 'OTP must be 5 digits' }),
});
export type OtpFormData = z.infer<typeof otpSchema>;

interface OTPFormProps {
    onSubmit: (data: OtpFormData) => void;
    loading: boolean;
}

export const OTPForm: React.FC<OTPFormProps> = ({ onSubmit, loading }) => {

    const { control, handleSubmit, formState: { errors } } = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
    });

    return (
        <View className="w-full items-center">
            <Text className="text-2xl font-bold mb-2">Enter OTP</Text>
            <Text className="text-center text-gray-600 mb-6">
                A 6-digit code has been sent to your email.
            </Text>

            <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                    <InputField
                        label="Enter OTP"
                        className={`border ${errors.otp ? 'border-red-500' : 'border-gray-300'} p-4 rounded-lg text-2xl w-full text-center tracking-[16px]`}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        maxLength={6}
                        keyboardType="number-pad"
                    />
                )}
            />
            {errors.otp && <Text className="text-red-500 mt-2">{errors.otp.message}</Text>}


            <Button 
                title="Verify & Login"
                className="w-full"
                loading={loading}
                onPress={handleSubmit(onSubmit)}
            />
        </View>
    );
};