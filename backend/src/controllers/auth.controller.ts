import { Request } from 'express';
import { prisma } from '../lib/prisma';
import CustomResponse from '../utils/customResponse';
import sendVerificationEmail, { generateAccessToken } from '../utils/sendMail';
import { generateFileUrl } from '../lib/fileUpload';
import { normalizeUserXp, getTotalXpEarned } from '../utils/xpSystem';
import { updateDailyStreak } from '../utils/streakSystem';

export const register = async (req: Request, res: CustomResponse) => {
    try {
        const { email, ...rest } = req.body;

        // Check if user already exists
        const existing_user = await prisma.user.findFirst({
            where: { email, is_active: true }
        });

        if (existing_user) {
            return res.failure("Email already registered", null, 200);
        }

        // Delete any inactive users with same email
        await prisma.user.deleteMany({
            where: { email, is_active: false }
        });

        // Create new user without password
        const user = await prisma.user.create({
            data: {
                name: rest.name,
                dateOfBirth: rest.dateOfBirth,
                email,
                is_active: false
            }
        });

        const generated_otp = Math.floor(100000 + Math.random() * 900000);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("OTP sent to email for verification", {
            id: user.id,
            email: user.email,
            is_active: user.is_active,
        }, 201);
    } catch (error) {
        res.failure("Failed to register user", error, 500);
    }
};

export const login = async (req: Request, res: CustomResponse) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await prisma.user.findFirst({
            where: { email, is_active: true }
        });

        if (!user) {
            return res.failure("User not found", null, 200);
        }

        if (!user.is_active) {
            return res.failure("Please verify your email first", null, 200);
        }

        // Generate and send OTP for login
        const generated_otp = Math.floor(100000 + Math.random() * 900000);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("OTP sent to email for login", {
            id: user.id,
            email: user.email,
        }, 200);
    } catch (error) {
        res.failure("Failed to send login OTP", error, 500);
    }
};

export const getEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { uid } = req.body;
        
        const user = await prisma.user.findUnique({
            where: { id: uid }
        });

        if (!user) {
            return res.failure("User not found", null, 200);
        }

        const generated_otp = Math.floor(100000 + Math.random() * 900000);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { generated_otp, otp_generated_at: new Date() }
        });

        sendVerificationEmail(user.email, user.name, generated_otp);

        res.success("Email sent successfully", {
            id: user.id,
            email: user.email,
        }, 200);
    } catch (error) {
        res.failure("Failed to get email", error, 500);
    }
}

export const verifyEmail = async (req: Request, res: CustomResponse) => {
    try {
        const { uid, otp } = req.body;

        const user = await prisma.user.findFirst({
            where: { id: uid }
        });

        if (!user) {
            return res.failure("User not found", null, 200);
        }

        if (user.generated_otp !== parseInt(otp)) {
            return res.failure("Invalid OTP", null, 200);
        }

        // check if otp is expired
        const otp_generated_time = user.otp_generated_at;
        if (!otp_generated_time) {
            return res.failure("No OTP found", null, 200);
        }

        const current_time = new Date();
        const time_difference = current_time.getTime() - otp_generated_time.getTime();
        const minutes_difference = Math.floor(time_difference / (1000 * 60));

        if (minutes_difference > 15) {
            return res.failure("OTP has expired", null, 200);
        }

        // Generate JWT token
        const token = generateAccessToken(user.id);
        
        // Activate user and set token
        await prisma.user.update({
            where: { id: uid },
            data: {
                is_active: true,
                generated_otp: null,
                otp_generated_at: null,
                access_token: token,
                last_login: new Date()
            }
        });

        res.success("Email verified successfully", {
            id: user.id,
            name: user.name,
            email: user.email,
            access_token: token,
        }, 200);
    } catch (error) {
        res.failure("Failed to verify email", error, 500);
    }
};

export const getUserProfile = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.failure("User not found", null, 404);
        }

        // Normalize XP system - ensure user's XP and level are consistent
        const totalXpEarned = getTotalXpEarned(user.level, user.currentXp);
        const normalizedXp = normalizeUserXp(totalXpEarned);

        // Update streak on profile fetch (indicates daily app usage)
        const streakResult = updateDailyStreak(
            user.currentStreak,
            user.maxStreak,
            user.lastStreakUpdatedAt,
            new Date()
        );

        // Prepare update data
        const updateData: any = {};
        
        // Add XP normalization updates if needed
        if (normalizedXp.newLevel !== user.level || 
            normalizedXp.currentXp !== user.currentXp || 
            normalizedXp.xpToNextLevel !== user.xpToNextLevel) {
            
            updateData.level = normalizedXp.newLevel;
            updateData.currentXp = normalizedXp.currentXp;
            updateData.xpToNextLevel = normalizedXp.xpToNextLevel;
        }

        // Add streak updates if needed
        if (streakResult.streakUpdated) {
            updateData.currentStreak = streakResult.currentStreak;
            updateData.maxStreak = streakResult.maxStreak;
            updateData.lastStreakUpdatedAt = new Date();
        }

        // Update user if any changes are needed
        let updatedUser = user;
        if (Object.keys(updateData).length > 0) {
            updatedUser = await prisma.user.update({
                where: { id },
                data: updateData
            });
        }

        // Remove sensitive fields before sending response
        const userProfile = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            profile_photo: updatedUser.profile_photo,
            phone: updatedUser.phone,
            dateOfBirth: updatedUser.dateOfBirth,
            gender: updatedUser.gender,
            is_active: updatedUser.is_active,
            riskScore: updatedUser.riskScore,
            detectedAppsCount: updatedUser.detectedAppsCount,
            level: updatedUser.level,
            currentXp: updatedUser.currentXp,
            xpToNextLevel: updatedUser.xpToNextLevel,
            missionsCompleted: updatedUser.missionsCompleted,
            focusDays: updatedUser.focusDays,
            maxStreak: updatedUser.maxStreak,
            currentStreak: updatedUser.currentStreak,
            onboardingDone: updatedUser.onboardingDone,
            // Add streak status for frontend
            streakStatus: streakResult.streakUpdated ? {
                streakBroken: streakResult.streakBroken,
                newRecord: streakResult.newRecord
            } : null
        };

        res.success("User retrieved successfully", userProfile, 200);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.failure("Failed to fetch user", error, 500);
    }
};

export const updateUser = async (req: Request, res: CustomResponse) => {
    try {
        const { id } = (req as any).user;

        console.log('Update user request:', {
            body: req.body,
            file: req.file,
            userId: id
        });

        const updatedData: any = {};

        // Handle form data fields
        if (req.body.name) updatedData.name = req.body.name;
        if (req.body.email) updatedData.email = req.body.email;
        if (req.body.phone) updatedData.phone = req.body.phone;
        if (req.body.gender) updatedData.gender = req.body.gender;
        if (req.body.onboardingDone) updatedData.onboardingDone = req.body.onboardingDone;

        // Handle date of birth
        if (req.body.dateOfBirth) {
            updatedData.dateOfBirth = new Date(req.body.dateOfBirth);
        }

        // Handle profile photo upload
        if (req.file?.filename) {
            const photo = generateFileUrl(req.file.filename);
            updatedData.profile_photo = photo;
            console.log('Profile photo uploaded:', photo);
        }

        // Check if user exists before updating
        const existingUser = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!existingUser) {
            return res.failure("User not found", null, 404);
        }

        // Update user with new data
        const user = await prisma.user.update({
            where: { id: id },
            data: updatedData,
        });

        // Return updated user data (excluding sensitive fields)
        const responseData = {
            id: user.id,
            name: user.name,
            email: user.email,
            profile_photo: user.profile_photo,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            is_active: user.is_active,
            level: user.level,
            currentXp: user.currentXp,
            xpToNextLevel: user.xpToNextLevel,
            currentStreak: user.currentStreak,
            maxStreak: user.maxStreak
        };

        console.log('User updated successfully:', responseData);

        res.success("User updated successfully", responseData, 200);
    } catch (error) {
        console.error('Update user error:', error);
        res.failure("Failed to update user", error, 500);
    }
};
