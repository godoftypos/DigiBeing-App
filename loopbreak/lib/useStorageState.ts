import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

// Define types for the state
type AsyncState<T> = [boolean, T | null];
type SetState<T> = (value: T | null) => void;

// Custom hook to manage async state
function useAsyncState<T>(initialValue: AsyncState<T> = [true, null]): any {
    return React.useReducer(
        (state: any, action: T | null) => [false, action],
        initialValue
    );
}

export async function getStorageItemAsync<T>(key: string): Promise<T | null> {
    try {
        if (Platform.OS === 'web') {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } else {
            const item = await SecureStore.getItemAsync(key);
            return item ? JSON.parse(item) : null;
        }
    } catch (e) {
        console.error('Failed to get storage item:', e);
        return null;
    }
}

// Function to set an item in storage
export async function setStorageItemAsync<T>(key: string, value: T | null): Promise<void> {
    if (Platform.OS === 'web') {
        try {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error('Local storage is unavailable:', e);
        }
    } else {
        if (value == null) {
            await SecureStore.deleteItemAsync(key);
        } else {
            await SecureStore.setItemAsync(key, JSON.stringify(value));
        }
    }
}

// Custom hook to manage storage state
export function useStorageState<T>(key: string): [AsyncState<T>, SetState<T>] {
    const [state, setState] = useAsyncState<T>();

    React.useEffect(() => {
        if (Platform.OS === 'web') {
            try {
                if (typeof localStorage !== 'undefined') {
                    const storedValue = localStorage.getItem(key);
                    setState(storedValue ? JSON.parse(storedValue) : null);
                }
            } catch (e) {
                console.error('Local storage is unavailable:', e);
            }
        } else {
            SecureStore.getItemAsync(key).then(value => {
                setState(value ? JSON.parse(value) : null);
            });
        }
    }, [key]);

    const setValue = React.useCallback(
        (value: T | null) => {
            setState(value);
            setStorageItemAsync(key, value);
        },
        [key]
    );

    return [state, setValue];
}
