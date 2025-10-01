import Dexie, {type EntityTable } from "dexie"
import type Message from "../entity/message/Message"
import type FileInfo from "../entity/file/FileInfo"
import type FileContent from "../entity/file/FileContent"


export const db = new Dexie("IM-Lite-Web") as Dexie & {
    message: EntityTable<Message, "id">,
    fileInfo: EntityTable<FileInfo, "id">,
    fileContent: EntityTable<FileContent, "id">
}

db.version(4).stores({
    message: "&id, localId, sessionId , createTime, updateTime, deleteTime",
    fileInfo: "&id",
    fileContent: "&id"
})