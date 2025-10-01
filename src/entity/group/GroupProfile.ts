import type { Role } from "./GroupMember";

export default interface GroupProfile {
    id: number;
    name: string;
    groupId: number;
    avatarFileId?: string;
    sessionId?: number;
    biography: string;
    members: {id:number, role:Role}[];
    createTime?: number;
    updateTime?: number;
    deleteTime?: number;
}