import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('tb_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('tb_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'tb-auth' }
  )
);
