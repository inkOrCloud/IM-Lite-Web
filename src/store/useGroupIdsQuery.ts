import pino from "pino";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import QueryClientInstance from "../util/QueryClientInstance";
import type { Role } from "../entity/group/GroupMember";

const logger = pino()
const queryClient = QueryClientInstance

const queryGroupIds = async () => {
    interface GroupsResponse {
        createTime?: number;
        deleteTime?: number;
        groupId?: number;
        id?: number;
        memberId?: number;
        role?: Role;
        updateTime?: number;
    }
    const response = await axios.get<GroupsResponse[]>("/api/group/get_group_members_with_user_id");
    const groupIds = response.data.filter(m => m.groupId).map(m => m.groupId as number);
    return groupIds;
}

export default function useGroupIdsQuery(userId: number) {
    return useQuery({
        queryKey: ['groupIds', userId],
        queryFn: queryGroupIds,
        enabled: !!userId,
    })
}


interface GroupResponse {
    createTime?: number;
    deleteTime?: number;
    id?: number;
    updateTime?: number;
}

async function createGroupQuery(name: string) {
    const { data: group } = await axios.get<GroupResponse>("/api/group/create_group?name=" + name);
    return group
}

export function createGroup(userId: number) {
    return useMutation({
        mutationFn: (name: string) => createGroupQuery(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groupIds", userId] })
            queryClient.invalidateQueries({ queryKey: ["sessions", userId] })
            logger.info("create group success")
        },
        onError: () => {
            logger.warn("create group error")
        }
    })
}

async function deleteGroupQuery(groupId: number) {
    const {data:group} = await axios.get<GroupResponse>("/api/group/delete_group?id=" + groupId)
    return group
}

export function deleteGroup(userId: number) {
    return useMutation({
        mutationFn: (groupId: number) => deleteGroupQuery(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["groupIds", userId] })
            queryClient.invalidateQueries({ queryKey: ["sessions", userId] })
            logger.info("delete group success")
        },
        onError: () => {
            logger.warn("delete group error")
        }
    })
}