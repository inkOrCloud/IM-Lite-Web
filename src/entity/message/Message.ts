import type { MessageType } from "./MessageType";

export default interface Message {
    id: string;
    localId: string;
    type: MessageType;
    sessionId: number;
    userId: number;
    content?: string;
    fileId?: string;
    token?: string;
    createTime?: number;
    updateTime?: number;
    deleteTime?: number;
}
