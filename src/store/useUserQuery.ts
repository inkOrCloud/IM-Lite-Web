import axios from "axios"
import { useMutation, useQueries, useQuery } from "@tanstack/react-query"
import type UserProfile from "../entity/user/UserProfile"
import QueryClientInstance from "../util/QueryClientInstance"

const queryClient = QueryClientInstance

const userInfo = async (userId: number, ownUserId?: number) => {
    const { data: user } = await axios.get<UserProfile>("/api/account/info/get_profile?accountId=" + userId)
    if (ownUserId && ownUserId !== userId) {
        const { data: sessionId } = await axios.get<number | undefined>("/api/session/get_session_id_with_user_id?user=" + userId)
        user.sessionId = sessionId
    }
    return user
}

export default function useUserQuery(userId: number, ownUserId?: number) {
    return useQuery({
        queryKey: ["user", userId, ownUserId],
        queryFn: () => userInfo(userId, ownUserId),
        enabled: !!userId,
    })
}

export function useUserQueries(userIds: number[], ownUserId?: number) {
    return useQueries({
        queries: userIds.map(userId => ({
            queryKey: ["user", userId, ownUserId],
            queryFn: () => userInfo(userId, ownUserId),
            enbaled: !!userId,
        })),
    })
}

export function queryUserManually(userId: number, ownUserId?: number) {
    return queryClient.fetchQuery({
        queryKey: ["user", userId, ownUserId],
        queryFn: () => userInfo(userId, ownUserId),
    })
}

async function updayeUserProfile(
    userId: number, 
    profile: Partial<Omit<UserProfile, "id" | "userId" | "createTime" | "updateTime" | "deleteTime">>
){
    const rawProfile = await queryUserManually(userId)
    for(const key in profile) {
        const k = key as keyof typeof profile
        const v = profile[k]
        if(v !== undefined) {
            (rawProfile as any)[k] = v
        }
    }
    const res = await axios.post<UserProfile>("/api/account/info/update_profile", rawProfile)
    return res.data
}

export function updateUserProfileMutation() {
    return useMutation({
        mutationFn: async (args: 
            {
                 userId: number, 
                 profile: Partial<Omit<UserProfile, "id" | "userId" | "createTime" | "updateTime" | "deleteTime">> 
                }) => {
            return updayeUserProfile(args.userId, args.profile)
        },
        onSuccess(_, variables) {
            queryClient.invalidateQueries({ queryKey: ["user", variables.userId]})
        }
    })
}