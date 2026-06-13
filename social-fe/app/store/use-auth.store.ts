import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    username: string | null;
    email: string | null;
    isAuthenticated: boolean;
    setAuth: (token: string, username: string, email: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            username: null,
            email: null,
            isAuthenticated: false,

            setAuth: (token, username, email) =>
                set({ accessToken: token, username, email, isAuthenticated: true }),

            clearAuth: () =>
                set({ accessToken: null, username: null, email: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Chỉ lưu username và email vào LocalStorage, KHÔNG lưu accessToken
            partialize: (state) => ({
                username: state.username,
                email: state.email,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);