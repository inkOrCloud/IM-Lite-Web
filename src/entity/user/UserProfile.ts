export default interface UserProfile {
    id: number;
    userId: number;
    name: string;
    email: string;
    biography: string;
    avatarFileId: string;
    sessionId?: number;
    createTime: number;
    updateTime: number;
    deleteTime: number;
}