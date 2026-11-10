import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = 'http://192.168.0.157:8000'

axios.defaults.baseURL = API_URL;

interface Session {
    access_token?: string;
    // Add other session properties if needed   
}

interface ApiResponse<T = any> {
    data: T;
    message?: string;
    verified?: boolean;
    success: boolean;
}

export async function postToAPI<T>(
    url: string,
    data: any,
    sendingFile: boolean = false
): Promise<ApiResponse<T> | any> {
    try {
        const res: AxiosResponse<ApiResponse<T>> = await axios.post(url, data, {
            headers: {
                'Content-Type': sendingFile ? 'multipart/form-data' : 'application/json',
            },
        });
        return res.data;
    } catch (err: any) {
        if (err.response) {
            console.error('[postToAPI] Error Response:', err.response);
        }
        if (err.request) {
            console.error('[postToAPI] Error Request:', err.request);
        }
        if (err.message) {
            console.error('[postToAPI] Error Message:', err.message);
        }
        return undefined;
    }
}

export async function fetchFromAPI<T>(url: string): Promise<ApiResponse<T> | any> {
    try {
        const sessionString = await SecureStore.getItemAsync('session');
        const session: Session = sessionString ? JSON.parse(sessionString) : {};
        if (session.access_token) {
            axios.defaults.headers.common.Authorization = `Bearer ${session.access_token}`;
        }
        const res: AxiosResponse<ApiResponse<T>> = await axios.get(url);
        return res.data;
    } catch (err: any) {
        console.error('[fetchFromAPI] Error:', err);
        if (err.response) {
            console.error('[fetchFromAPI] Error Response:', err.response);
        }
        if (err.request) {
            console.error('[fetchFromAPI] Error Request:', err.request);
        }
        if (err.message) {
            console.error('[fetchFromAPI] Error Message:', err.message);
        }
        return { success: false };
    }
}

export async function putToAPI<T>(
    url: string,
    data: any,
    sendingFile: boolean = false
): Promise<ApiResponse<T> | any> {
    try {
        const sessionString = await SecureStore.getItemAsync('session');
        const session: Session = sessionString ? JSON.parse(sessionString) : {};
        const res: AxiosResponse<ApiResponse<T>> = await axios.put(url, data, {
            headers: {
                'Content-Type': sendingFile ? 'multipart/form-data' : 'application/json',
                Authorization: session.access_token ? `Bearer ${session.access_token}` : '',
            },
        });
        return res.data;
    } catch (err: any) {
        if (err.response) {
            console.error('[putToAPI] Error Response:', err.response);
        }
        if (err.request) {
            console.error('[putToAPI] Error Request:', err.request);
        }
        if (err.message) {
            console.error('[putToAPI] Error Message:', err.message);
        }
        return undefined;
    }
}


export async function axiosRequest<T>(
    url: string,
    reqParams: AxiosRequestConfig,
    sendingMedia: boolean
): Promise<ApiResponse<T> | any> {
    const sessionString = await SecureStore.getItemAsync('session');
    const session: Session = sessionString ? JSON.parse(sessionString) : {};

    try {
        const res: AxiosResponse<ApiResponse<T>> = await axios.request({
            url: API_URL + '/' + url,
            ...reqParams,
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                Accept: 'application/json',
                'Content-Type': sendingMedia ? 'multipart/form-data' : 'application/json',
            },
        });
        return res.data;
    } catch (err: any) {
        console.error('[axiosRequest] Error:', err);
        if (err.response) {
            console.error('[axiosRequest] Error Response:', err.response);
        }
        if (err.request) {
            console.error('[axiosRequest] Error Request:', err.request);
        }
        if (err.message) {
            console.error('[axiosRequest] Error Message:', err.message);
        }
        return undefined;
    }
}
