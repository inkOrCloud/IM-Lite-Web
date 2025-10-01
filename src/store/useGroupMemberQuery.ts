import axios from "axios";
import type { GroupMember, Role } from "../entity/group/GroupMember";
import { useMutation, useQuery } from "@tanstack/react-query";
import QueryClientInstance from "../util/QueryClientInstance";
import pino from "pino";

const queryClient = QueryClientInstance
const logger = pino()
async function queryGroupMember(groupId: number, memberId: number) {
    return (await axios.get<GroupMember>(
        `/api/group/get_group_member_with_group_id_and_user_id?groupId=${groupId}&userId=${memberId}`
    )).data
}

export function useGroupMemberQuery(groupId: number, memberId: number) {
    return useQuery({
        queryKey: ["groupMember", groupId, memberId],
        queryFn: () => queryGroupMember(groupId, memberId),
        enabled: !!groupId && !!memberId,
    })
}

async function setGroupMemberRole(memberId: number, groupId: number, role: Role) {
    const member = await queryClient.fetchQuery({
        queryKey: ["groupMember", groupId, memberId],
        queryFn: () => queryGroupMember(groupId, memberId),
    })
    member.role = role
    return (await axios.post<GroupMember>("/api/group/update_group_member", member)).data
}

export function setGroupMemberRoleMutation() {
    return useMutation({
        mutationFn: async (args: { memberId: number, groupId: number, role: Role }) => {
            return setGroupMemberRole(args.memberId, args.groupId, args.role)
        },
        onSuccess: (_, args) => {
            queryClient.invalidateQueries({ queryKey: ["groupMember", args.groupId, args.memberId] })
        },
        onError: () => {
            logger.warn("set group member role error")
        }
    })
}