import axios from "axios";
import pino from "pino";
import type GroupProfile from "../entity/group/GroupProfile";
import { useMutation, useQuery } from "@tanstack/react-query";
import QueryClientInstance from "../util/QueryClientInstance";

const logger = pino()
const queryClient = QueryClientInstance

const queryGroupProfile = async (groupId: number) => {
    const { data: group } = await axios.get<GroupProfile>("/api/group/get_group_profile?groupId=" + groupId);
    const { data: sessionId } = await axios.get<number | undefined>("/api/session/get_session_id_with_group_id?groupId=" + groupId);
    group.sessionId = sessionId
    return group
}

export default function useGroupQuery(groupId: number) {
    return useQuery({
        queryKey: ["group", groupId],
        queryFn: () => queryGroupProfile(groupId),
        enabled: !!groupId,
    })
}

async function updateGroupProfile(groupId: number,
    groupProfile: Partial<Omit<GroupProfile, "id" | "groupid" | "createTime" | "updateTime" | "deleteTime">>) {
    const rawProfile = await queryClient.fetchQuery({
        queryKey: ["group", groupId],
        queryFn: () => queryGroupProfile(groupId),
    })
    for (const key in groupProfile) {
        const k = key as keyof typeof groupProfile
        const v = groupProfile[k]
        if (v !== undefined) {
            (rawProfile as any)[k] = v
        }
    }
    return (await axios.post<GroupProfile>("/api/group/update_group_profile", rawProfile)).data
}

export function updateGroupProfileMutation() {
    return useMutation({
        mutationFn: async (args: { groupId: number, 
            groupProfile: Partial<Omit<GroupProfile, "id" | "groupid" | "createTime" | "updateTime" | "deleteTime">> }) => {
            return updateGroupProfile(args.groupId, args.groupProfile)
        },
        onSuccess(_, variables) {
            queryClient.invalidateQueries({ queryKey: ["group", variables.groupId] })
        },
        onError(error) {
            logger.warn(error.message)
        }
    }
    )
}
