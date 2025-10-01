export default interface FileInfo {
    id: string;
    uploaderId?: string;
    token?: string;
    name?: string;
    size: number;
    hash: string;
    createTime?: number;
    updateTime?: number;
    deleteTime?: number;
}