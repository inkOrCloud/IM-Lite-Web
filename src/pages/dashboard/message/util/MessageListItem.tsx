import type Session from "../../../../entity/session/Session";
import type Message from "../../../../entity/message/Message";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { getFileContent } from "../../../../db/util/FileUtil";
import { List, Avatar } from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import useUserQuery from "../../../../store/useUserQuery";
import useGroupQuery from "../../../../store/useGroupQuery";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigate, useParams } from "react-router";

export default function MessageListItem(props: { session: Session, lastMessage?: Message }) {
    const { sessionId } = useParams()
    const userId = useAuthStore(state => state.userInfo?.userId)
    const { lastMessage, session } = props
    const [name, setName] = useState("" + session.id)
    const [avatarFileUrl, setAvatarFileUrl] = useState<string>()
    const memberId = session.memberIds.find(id => id !== userId)
    const { data: group } = useGroupQuery(session.type === "GROUP" && session.groupId ? session.groupId : 0)
    const { data: user } = useUserQuery(session.type === "PRIVATE" && memberId ? memberId : 0)
    const navigate = useNavigate()
    const [style, setStyle] = useState<Record<"item" | "title", CSSProperties>>({ item: {}, title: {} })
    const [description, setDescription] = useState<string>()
    const [selectedSessionId, setSelectedSessionId] = useState<number>()
    const { data: sender } = useUserQuery(lastMessage?.userId || 0)
    useEffect(() => {
        if (sessionId) {
            setSelectedSessionId(Number.parseInt(sessionId))
        }
    }, [sessionId])
    useEffect(() => {
        let name: string | undefined, avatarFileId: string | undefined
        if (group) {
            name = group.name
            avatarFileId = group.avatarFileId
        }
        if (user) {
            name = user.name
            avatarFileId = user.avatarFileId
        }
        if (name) {
            setName(name)
        }
        if (avatarFileId) {
            getFileContent(avatarFileId).then((file) => {
                if (file) {
                    setAvatarFileUrl(URL.createObjectURL(file))
                }
            })
        }
    }, [group, user])
    useEffect(() => {
        if (selectedSessionId === session.id) {
            setStyle({
                item: {
                    backgroundColor: "#0d6ecf"
                },
                title: {
                    color: "white"
                }
            })
        }else{
            setStyle({
                item: {},
                title: {}
            })
        }
    }, [session.id, selectedSessionId])
    useEffect(() => {
        if (lastMessage) {
            const senderName = sender?.name || lastMessage.userId
            switch (lastMessage.type) {
                case "TEXT":
                    setDescription(senderName + ":" + lastMessage.content)
                    break
                case "AUDIO":
                    setDescription(senderName + ":[音频]")
                    break
                case "IMAGE":
                    setDescription(senderName + ":[图片]")
                    break
                case "FILE":
                    setDescription(senderName + ":[文件]")
                    break
                case "VIDEO":
                    setDescription(senderName + ":[视频]")
                    break
                case "OPRERATION_DELETE":
                    setDescription(senderName + "撤回了一条消息")
                    break
            }
        }
    }, [lastMessage, sender])
    const onClick = useCallback(() => {
        const to = selectedSessionId ? "../message/" + session.id : "./" + session.id
        navigate(to)
    }, [session.id, selectedSessionId, navigate])
    return (<div className="w-full h-full text-left">
        <List.Item
            className="p-0"
            style={style.item}
            onClick={onClick}>
            <List.Item.Meta
                className="h-15 m-4"
                avatar={<Avatar src={avatarFileUrl} >{name.charAt(0)}</Avatar>}
                title={<Paragraph style={style.title} ellipsis>{name}</Paragraph>}
                description={lastMessage && <Paragraph ellipsis type="secondary" className="text-sm">
                    {description}
                </Paragraph>}
            />
        </List.Item>
    </div>)
}