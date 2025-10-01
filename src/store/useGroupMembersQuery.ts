import { useMutation, useQuery } from "@tanstack/react-query";
import type { GroupMember } from "../entity/group/GroupMember";
import axios, { type AxiosResponse } from "axios";
import pino from "pino";
import QueryClientInstance from "../util/QueryClientInstance";

const logger = pino()
const queryClient = QueryClientInstance

async function queryGroupMembers(groupId: number,) {
    const res = await axios.get<GroupMember[]>(`/api/group/get_group_members?groupId=${groupId}`)
    return res.data
}

export function useGroupMembersQuery(groupId: number) {
    return useQuery({
        queryKey: ["groupMembers", groupId],
        queryFn: () => queryGroupMembers(groupId),
        enabled: !!groupId,
    })
}

async function addMembertoGroupQuery(groupId: number, memberId: number) {
    const member = (await axios.post<GroupMember,
        AxiosResponse<GroupMember>,
        Omit<GroupMember, 'id' | 'createTime' | 'deleteTime' | 'updateTime'>>
        ("/api/group/add_group_member", {
            groupId,
            memberId,
            role: "MEMBER"
        })).data
    return member
}

export function addMembertoGroup() {
    return useMutation({
        mutationFn: (args: {groupId:number, memberId:number}) => addMembertoGroupQuery(args.groupId, args.memberId),
        onSuccess: (_, args) => {
            queryClient.invalidateQueries({ queryKey: ["groupMembers", args.groupId] })
        },
        onError: () => {
            logger.warn("add member to group error")
        }
    })
}

async function deleteMemberFromGroupQuery(groupId: number, memberId: number) {
    const member = (await axios.get<GroupMember>("/api/group/delete_group_member?groupId=" + groupId + "&memberId=" + memberId)).data
    return member
}

export function deleteMemberFromGroup() {
    return useMutation({
        mutationFn: (values: { groupId: number, memberId: number }) =>
            deleteMemberFromGroupQuery(values.groupId, values.memberId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["groupMembers", variables.groupId] })
        },
        onError: () => {
            logger.warn("delete member from group error")
        }
    })
}

