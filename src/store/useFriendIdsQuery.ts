import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import pino from "pino";
import QueryClientInstance from "../util/QueryClientInstance";

const logger = pino()
const queryClient = QueryClientInstance

const queryFriendIds = async () => {
    interface FrinedsResponse {
        accountId?: number;
        createTime?: number;
        deleteTime?: number;
        friendId?: number;
        id?: number;
        updateTime?: number;
    }

    const res = await axios.get<FrinedsResponse[]>("/api/friend/get_friends")
    const ids = res.data.map((f) => f.friendId).filter((id): id is number => id !== undefined)
    return ids
}

export default function useFriendIdsQuery(userId: number) {
    return useQuery({
        queryKey: ["friendIds", userId],
        queryFn: queryFriendIds,
        enabled: !!userId,
    })
}

async function removeFriendQuery(friendId: number) {
    return await axios.get("/api/friend/remove_friend?friendId=" + friendId)
}

export function removeFriend(friendId: number, userId: number) {
    return useMutation({
        mutationFn: () => removeFriendQuery(friendId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friendIds", userId] })
            queryClient.invalidateQueries({ queryKey: ["sessions", userId] })
        },
        onError: () => {
            logger.warn("remove friend error, friendId = " + friendId + ", userId = " + userId)
        }
    })
}

export function addFriend(userId: number) {
    return useMutation({
        mutationFn: (friendId: number) => axios.get("/api/friend/add_friend?friendId=" + friendId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friendIds", userId] })
            queryClient.invalidateQueries({ queryKey: ["sessions", userId] })
        },
        onError: (error) => {
            logger.warn("add friend error, " + error.message)
        }
    })
}