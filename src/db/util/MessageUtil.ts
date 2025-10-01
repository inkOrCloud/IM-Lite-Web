import { db } from "../db";
import type Message from "../../entity/message/Message";
import { useAuthStore } from "../../store/useAuthStore";
import { MessageType } from "../../entity/message/MessageType";

let timestamp = Math.floor(Date.now() / 1000), pre = 0

export async function syncMessage(message: Message) {
    if (message.userId === useAuthStore.getState().userInfo?.userId) {
        const m = await db.message.where("localId").equals(message.localId).filter(v => v.userId === message.userId).first()
        if (m) {
            db.message.delete(m.id)
        }
    }
    db.message.add(message)
}

export async function addMessage(message: Omit<Message, "id" | "localId" | "createTime" | "updateTime" | "deleteTime">):Promise<Message> {
    const now = Math.floor(Date.now() / 1000)
    if (now > timestamp) {
        timestamp = now
        pre = 0
    }
    const m = {
        ...message,
        id:  "tmp" + (timestamp*1000 + pre),
        localId: timestamp * 1000 + pre + "",
        createTime: timestamp,
    }
    pre++
    await db.message.add(m)
    return m
}

export async function syncMessages(messages: Message[]) {
    for (let message of messages) {
        if (message.userId === useAuthStore.getState().userInfo?.userId) {
            const m = await db.message.where("localId").equals(message.localId).filter(v => v.userId === message.userId).first()
            if (m) {
                await db.message.delete(m.id)
            }
        }
        if (message.type === MessageType.OPRERATION_DELETE && message.content) {
            await db.message.delete(message.content)
        }
    }
    db.message.bulkPut(messages)
}

export async function softDeleteMessage(id: string) {
    const m = await db.message.get(id)
    if (m) {
        m.deleteTime = Math.floor(Date.now() / 1000)
        await db.message.update(id, m)
    }
}

export async function getMessagesBySessionId(sessionId: number, offset: number, limit: number, order: "asc" | "desc") {
    const messages = await db.message.where("sessionId").equals(sessionId).sortBy("createTime")
    if(order === "desc") {
        messages.reverse()
    }
    return messages.slice(offset, offset+limit)
}

export async function getMessageById(id: string) {
    return db.message.get(id)
}

export async function getLastMessageWithSessionId(sessionId: number) {
    const messages = await db.message.where("sessionId").equals(sessionId).sortBy("createTime")
    if(messages.length >= 0) {
        return messages[messages.length-1]
    }
}

export async function getLastMessageTimeWithSessionId(sessionId: number) {
    const last = await getLastMessageWithSessionId(sessionId)
    if(last && last.createTime) {
        return last.createTime
    }
    return 0
}

export async function getLastMessageTime() {
    const last = await db.message.orderBy("createTime").reverse().first()
    if(!last?.createTime) {
        return 0
    }
    return last.createTime
}