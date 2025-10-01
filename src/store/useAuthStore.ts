import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer";
import { jwtDecode } from "jwt-decode"

export interface UserInfo {
  userId: number,
  profileId: number
}

export interface AuthState {
  userInfo?: UserInfo
  expire?: number
  jwt?: string
  login: (jwt: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer(
      (set) => ({
        login: (jwt) => set((state) => {
          const jwtObj: { userInfo: UserInfo, expire: number } = jwtDecode(jwt)
          state.jwt = jwt
          state.userInfo = jwtObj.userInfo
          state.expire = jwtObj.expire
        }),
        logout: () => set((state) => {
          state.jwt = undefined
          state.expire = undefined
          state.userInfo = undefined
        })
      })
    ),
    {
      name: "auth-state",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
