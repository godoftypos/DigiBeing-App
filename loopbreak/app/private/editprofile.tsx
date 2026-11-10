import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    TextInput,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { InputField } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { useAuthStore } from '~/lib/store/auth.store';
import { postToAPI } from '~/lib/api';

// Validation Schema
const editProfileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
    dateOfBirth: z.date({ message: 'Date of birth is required' }),
    gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], { 
        message: 'Please select a gender' 
    }),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

const genderOptions = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'other', label: 'Other', icon: 'person' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: 'help-circle' },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile, refreshUser } = useAuthStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [hasImageChanged, setHasImageChanged] = useState(false);

    const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<EditProfileFormData>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            dateOfBirth: new Date(),
            gender: 'prefer-not-to-say',
        }
    });

    // Load initial data from profile when component mounts
    useEffect(() => {
        if (profile) {
            reset({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date(),
                gender: (profile.gender as any) || 'prefer-not-to-say',
            });
            
            // Set initial profile photo if exists
            if (profile.profile_photo) {
                setSelectedImage(profile.profile_photo);
            }
        }
    }, [profile, reset]);

    const selectedDate = watch('dateOfBirth');
    const selectedGender = watch('gender');

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

    const handleProfilePhotoUpdate = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        Alert.alert(
            'Update Profile Photo',
            'Choose an option',
            [
                { 
                    text: 'Camera', 
                    onPress: async () => {
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });

                        if (!result.canceled) {
                            setSelectedImage(result.assets[0].uri);
                            setHasImageChanged(true);
                        }
                    }
                },
                { 
                    text: 'Gallery', 
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });

                        if (!result.canceled) {
                            setSelectedImage(result.assets[0].uri);
                            setHasImageChanged(true);
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const onSubmit = async (data: EditProfileFormData) => {
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("email", data.email);
            formData.append("phone", data.phone);
            formData.append("dateOfBirth", data.dateOfBirth.toISOString());
            formData.append("gender", data.gender);

            // Only include profile_photo if the user has changed it
            if (hasImageChanged && selectedImage) {
                const imageUri = selectedImage;
                const filename = imageUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('profile_photo', {
                    uri: imageUri,
                    name: filename,
                    type,
                } as any);
            }

            const res = await postToAPI("/users/update-profile", formData, true);

            if (res.success) {
                // Refresh user profile in store
                await refreshUser();
                
                Alert.alert(
                    'Success!', 
                    'Your profile has been updated successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', res.message || 'Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            {!profile ? (
                <View className="flex-1 justify-center items-center">
                    <View className="bg-white p-8 rounded-3xl shadow-lg items-center">
                        <Text className="text-lg font-bold text-gray-800 mb-2">Loading Profile...</Text>
                        <Text className="text-sm text-gray-600">Please wait while we fetch your information</Text>
                    </View>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6">
                        {/* Header */}
                        <View className="flex-row items-center mb-6">
                            <TouchableOpacity 
                                onPress={() => router.back()}
                                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mr-4"
                            >
                                <Ionicons name="arrow-back" size={20} color="#374151" />
                            </TouchableOpacity>
                            <View className="flex-1">
                                <Text className="text-2xl font-bold text-gray-800">Edit Profile</Text>
                                <Text className="text-gray-600">Update your personal information</Text>
                            </View>
                        </View>
                    {/* Profile Photo Section */}
                    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                        <Text className="text-lg font-bold text-gray-800 mb-4">Profile Photo</Text>
                        <View className="items-center">
                            <View className="relative">
                                {selectedImage ? (
                                    <Image 
                                        source={{ uri: selectedImage }}
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                                        style={{ resizeMode: 'cover' }}
                                    />
                                ) : (
                                    <View className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full items-center justify-center border-4 border-white shadow-lg">
                                        <Text className="text-white text-2xl font-bold">
                                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity 
                                    onPress={handleProfilePhotoUpdate}
                                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md"
                                >
                                    <Ionicons name="camera" size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                                onPress={handleProfilePhotoUpdate}
                                className="mt-3"
                            >
                                <Text className="text-blue-600 font-medium">Change Photo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form */}
                    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                        <Text className="text-lg font-bold text-gray-800 mb-6">Personal Information</Text>
                        
                        {/* Name Field */}
                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <InputField
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.name?.message}
                                />
                            )}
                        />

                        {/* Email Field */}
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <InputField
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.email?.message}
                                    keyboardType="email-address"
                                />
                            )}
                        />

                        {/* Phone Field */}
                        <Controller
                            control={control}
                            name="phone"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <InputField
                                    label="Phone Number"
                                    placeholder="Enter your phone number"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.phone?.message}
                                    keyboardType="phone-pad"
                                />
                            )}
                        />

                        {/* Date of Birth Field */}
                        <Controller
                            control={control}
                            name="dateOfBirth"
                            render={({ field: { value } }) => (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-medium mb-2">Date of Birth</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        className={`border-2 rounded-xl px-4 py-4 bg-gray-50 flex-row items-center justify-between ${
                                            errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    >
                                        <Text className="text-base text-gray-800">
                                            {value ? formatDate(value) : 'Select your date of birth'}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={20} color="#374151" />
                                    </TouchableOpacity>
                                    {errors.dateOfBirth && (
                                        <Text className="text-red-500 text-sm mt-1">
                                            {errors.dateOfBirth.message}
                                        </Text>
                                    )}
                                </View>
                            )}
                        />

                        {/* Gender Field */}
                        <Controller
                            control={control}
                            name="gender"
                            render={({ field: { onChange, value } }) => (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-medium mb-3">Gender</Text>
                                    <View className="gap-y-3">
                                        {genderOptions.map((option: { value: string; label: string; icon: string }) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                onPress={() => onChange(option.value)}
                                                className={`flex-row items-center p-4 rounded-xl border-2 ${
                                                    selectedGender === option.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                }`}
                                            >
                                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                                                    selectedGender === option.value ? 'bg-blue-500' : 'bg-gray-300'
                                                }`}>
                                                    <Ionicons 
                                                        name={option.icon as any} 
                                                        size={18} 
                                                        color={selectedGender === option.value ? 'white' : '#6B7280'} 
                                                    />
                                                </View>
                                                <Text className={`font-medium ${
                                                    selectedGender === option.value ? 'text-blue-700' : 'text-gray-700'
                                                }`}>
                                                    {option.label}
                                                </Text>
                                                {selectedGender === option.value && (
                                                    <View className="ml-auto">
                                                        <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {errors.gender && (
                                        <Text className="text-red-500 text-sm mt-1">
                                            {errors.gender.message}
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
                    </View>

                    {/* Action Buttons */}
                    <View className="space-y-4">
                        <Button
                            title={isLoading ? 'Saving...' : 'Save Changes'}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                        />
                        
                        <TouchableOpacity 
                            onPress={() => router.back()}
                            className="w-full py-4 rounded-xl items-center justify-center border-2 border-gray-300"
                        >
                            <Text className="font-semibold text-lg text-gray-600">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            )}
        </View>
    );
}