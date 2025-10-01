/**
 * GroupMember
 */
export interface GroupMember {
    createTime?: number;
    deleteTime?: number;
    groupId: number;
    id: number;
    memberId: number;
    role: Role;
    updateTime?: number;
}

export type Role = "MEMBER" | "ADMIN" | "OWNER";