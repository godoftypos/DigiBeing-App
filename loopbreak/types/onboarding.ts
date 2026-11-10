import { z } from 'zod';

// Onboarding form schema
export const onboardingSchema = z.object({
  interests: z.array(z.string()).min(3, "Please select at least 3 interests"),
  goals: z.array(z.string()).min(1, "Please select at least 1 goal"),
  experience: z.string().min(1, "Please select your experience level"),
  preferences: z.object({
    notifications: z.boolean(),
    dataSharing: z.boolean(),
    analytics: z.boolean(),
  })
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Question data types
export interface Option {
  id: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  title: string;
  subtitle: string;
  type: 'multiSelect' | 'singleSelect' | 'toggle';
  options: Option[];
  minSelections?: number;
  maxSelections?: number;
}

// Onboarding questions data
export const onboardingQuestions: Question[] = [
  {
    id: 'interests',
    title: 'What are your interests?',
    subtitle: 'Please select at least 3 interests to proceed.',
    type: 'multiSelect',
    minSelections: 3,
    options: [
      { id: 'action', label: 'Action' },
      { id: 'comedy', label: 'Comedy' },
      { id: 'thriller', label: 'Thriller' },
      { id: 'horror', label: 'Horror' },
      { id: 'sci-fi', label: 'Sci-Fi' },
      { id: 'drama', label: 'Drama' },
      { id: 'crime', label: 'Crime' },
      { id: 'romance', label: 'Romance' },
      { id: 'family', label: 'Family' },
      { id: 'documentary', label: 'Documentary' },
      { id: 'cartoon', label: 'Cartoon' },
      { id: 'biography', label: 'Biography' },
      { id: 'shorts', label: 'Shorts' },
    ]
  },
  {
    id: 'goals',
    title: 'What are your goals?',
    subtitle: 'Select what you want to achieve with our app.',
    type: 'multiSelect',
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: 'productivity', label: 'Increase Productivity', description: 'Better time management' },
      { id: 'wellness', label: 'Digital Wellness', description: 'Healthier screen time habits' },
      { id: 'focus', label: 'Improve Focus', description: 'Reduce distractions' },
      { id: 'balance', label: 'Work-Life Balance', description: 'Better boundaries' },
      { id: 'awareness', label: 'Self Awareness', description: 'Understand your habits' },
      { id: 'control', label: 'Take Control', description: 'Manage app usage' },
    ]
  },
  {
    id: 'experience',
    title: 'What\'s your experience level?',
    subtitle: 'Help us customize your experience.',
    type: 'singleSelect',
    options: [
      { id: 'beginner', label: 'Beginner', description: 'New to digital wellness' },
      { id: 'intermediate', label: 'Intermediate', description: 'Some experience with apps' },
      { id: 'advanced', label: 'Advanced', description: 'Very familiar with productivity tools' },
      { id: 'expert', label: 'Expert', description: 'I\'m a digital wellness pro' },
    ]
  },
  {
    id: 'preferences',
    title: 'Set your preferences',
    subtitle: 'Customize how the app works for you.',
    type: 'toggle',
    options: [
      { id: 'notifications', label: 'Push Notifications', description: 'Get reminders and insights' },
      { id: 'dataSharing', label: 'Anonymous Data Sharing', description: 'Help improve the app' },
      { id: 'analytics', label: 'Advanced Analytics', description: 'Detailed usage reports' },
    ]
  }
];
