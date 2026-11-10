import { create } from 'zustand';
import { fetchFromAPI, postToAPI } from '~/lib/api';
import { getStorageItemAsync, setStorageItemAsync } from '~/lib/useStorageState';
import { Alert } from 'react-native';
import { User } from '~/type/user';

interface APIResponse {
  success: boolean;
  message: any;
  data: any;
}

interface AuthState {
  session: { access_token: string } | null;
  profile: User | null;
  isLoading: boolean;
  isSessionInitialized: boolean;

  getOTP: (id: string) => Promise<APIResponse>;
  verifyOTP: (id: string, otp: number) => Promise<APIResponse>;
  login: (values: any) => Promise<APIResponse>;
  register: (values: any) => Promise<APIResponse>;
  rehydrateSession: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkToken: (router: any) => Promise<boolean>;
}

// Key used for SecureStore
const STORAGE_KEY = 'session';

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isSessionInitialized: false,

  async getOTP(uid: string) {
    return await postToAPI(`/users/get-email`, { uid });
  },

  async verifyOTP(uid: string, otp: number) {
    const res = await postToAPI(`/users/verify-email`, { uid, otp });

    if (res.success) {
      const sessionData = { access_token: res.data.access_token };
      set({ session: sessionData });
      await setStorageItemAsync(STORAGE_KEY, sessionData); // Save to SecureStore
      await get().refreshUser();
    }

    return res;
  },

  async login(values: any) {
    return await postToAPI('/users/login', values);
  },

  async register(values: any) {
    return await postToAPI('/users/register', values);
  },

  async logOut() {
    await setStorageItemAsync(STORAGE_KEY, null);
    set({ session: null, profile: null, isSessionInitialized: false });
  },

  rehydrateSession: async () => {
    set({ isLoading: true });
    try {
      const storedSession: any = await getStorageItemAsync(STORAGE_KEY);
      if (storedSession?.access_token) {
        set({ session: storedSession });
        await get().refreshUser();
      }
    } catch (error) {
      console.error('[rehydrateSession error]', error);
    } finally {
      set({ isLoading: false, isSessionInitialized: true });
    }
  },


  async refreshUser() {
    try {
      const res = await fetchFromAPI('/users/get-profile');
      set({ profile: res?.data });
    } catch (error) {
      console.error('[refreshUser error]', error);
    }
  },

  async checkToken(router: any) {
    const session = get().session;
    if (!session || !session.access_token) {
      router.replace('/');
      Alert.alert(
        'Authentication Required',
        'Please log in to access this page',
        [
          {
            text: 'OK'
          }
        ]
      );
      return false;
    }
    return true;
  },
}));
