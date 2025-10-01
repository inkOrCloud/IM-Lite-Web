import type { SessionType } from "./SessionType";

export default interface Session {
    id: number;
    type: SessionType;
    memberIds: Array<number>;
    groupId?: number;
}

