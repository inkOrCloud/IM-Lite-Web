import { Client } from "@stomp/stompjs"
import type Message from "../entity/message/Message"
import pino from "pino"
import { addMessage, getLastMessageTime, syncMessage, syncMessages } from "../db/util/MessageUtil"
import axios, { isAxiosError } from "axios"
import { useAuthStore } from "../store/useAuthStore"

const logger = pino()

class MessageService {
    private _client?: Client

    public start(jwt: string, sessionIds: number[]) {
        if (this._client) {
            this._client.deactivate()
            logger.info("message service stop")
        }
        this._client = new Client({
            brokerURL: "/ws-chat",
            connectHeaders: {
                Authorization: "Bearer " + jwt
            },
            onConnect: () => {
                logger.info("message service connected")
                sessionIds.forEach((v) => {
                    this._client!.subscribe("/topic/session." + v, (msg) => {
                        const message: Message = JSON.parse(msg.body)
                        syncMessage(message)
                    })
                })
                getLastMessageTime()
                    .then((last) => {
                        logger.info("sync messages from last time: " + last)
                        axios.get<Message[]>(`/api/message/get_messages_with_user_info?start=${last}&end=${Math.floor(Date.now() / 1000)}`)
                            .then(res => {
                                syncMessages(res.data)
                            })
                            .catch(err => {
                                if (isAxiosError(err)) {
                                    logger.warn("sync message error, axios error = " + err)
                                }
                            })
                    })
            },
            onDisconnect: () => logger.warn("message service disconnected"),
        })
        this._client.activate()
    }

    public async sendMessage(message: Omit<Message, 'id' | 'createTime' | 'updateTime' | 'deleteTime' | 'userId' | 'localId'>) {
        if (!this._client) {
            logger.error("send message failed, STOMP client is undefined")
            return
        }
        const m = await addMessage({...message, userId: useAuthStore.getState().userInfo?.userId as number})
        this._client.publish({
            destination: "/app/chat/send",
            body: JSON.stringify({...message, localId: m.localId}),
        })
    }
}

export const messageService = new MessageService()