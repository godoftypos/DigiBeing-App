import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import upload from '../lib/fileUpload';

const userRouter: any = express.Router();

// Auth routes
userRouter.post('/register', authController.register);
userRouter.post('/login', authController.login);
userRouter.post('/verify-email', authController.verifyEmail);
userRouter.post('/get-email', authController.getEmail);

// User management Routes
userRouter.get('/get-profile', authenticate, authController.getUserProfile);
userRouter.post('/update-profile', authenticate, upload.single('profile_photo'), authController.updateUser);

// User App Routes
userRouter.get('/dashboard', authenticate, userController.dashboard);
userRouter.post('/update-usage-data', authenticate, userController.updateUsageData);
userRouter.get('/all-missions', authenticate, userController.allMissions);
userRouter.post('/mark-mission-as-complete', authenticate, userController.markMissionAsComplete);
userRouter.get('/analytics', authenticate, userController.analytics);
userRouter.get('/achievements', authenticate, userController.getAchievements);

export default userRouter;
