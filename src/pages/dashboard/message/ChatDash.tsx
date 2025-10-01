import { Divider, Layout, Flex, Input, Form, Button, Splitter, Avatar, Spin } from "antd";
import type Message from "../../../entity/message/Message";
import React, { useRef, useEffect, useState, useCallback } from "react";
import Panel from "antd/es/splitter/Panel";
import { getFileContent } from "../../../db/util/FileUtil";
import { getMessagesBySessionId } from "../../../db/util/MessageUtil";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuthStore } from "../../../store/useAuthStore";
import { useRequest, useInfiniteScroll } from "ahooks";
import useUserQuery from "../../../store/useUserQuery";
import { MessageContent } from "./util/MessgeContent";
import { messageService } from "../../../service/MessageService";
import { useParams } from "react-router";
import pino from "pino";
import useSessionQuery from "../../../store/useSessionQuery";
import axios, { isAxiosError } from "axios";
import useGroupQuery from "../../../store/useGroupQuery";

const logger = pino({ level: "debug" })

export default function ChatDash() {
    const { Header, Content } = Layout;
    const { sessionId } = useParams()
    const userId = useAuthStore(state => state.userInfo?.userId)
    let id: number | undefined
    const { data: sessions } = useSessionQuery(userId || 0)
    if (sessionId) {
        id = Number.parseInt(sessionId)
    }
    const {data:sessionInfo} = useRequest(async () => {
        const session = sessions?.find(session => session.id === id)
        try {
            switch (session?.type) {
                case "PRIVATE":
                    let desUserIds = (await axios.get<number[]>("/api/session/get_user_ids_with_session_id?sessionId=" + sessionId)).data
                    desUserIds = desUserIds.filter(id => id !== userId)
                    return { type: "PRIVATE", id: desUserIds[0]}
                case "GROUP":
                    const groupId = (await axios.get<number>("/api/session/get_group_id_with_session_id?sessionId=" + sessionId)).data
                    return { type: "GROUP", id: groupId}
            }
        }catch (err) {
            if (isAxiosError(err)) {
                logger.error("Failed to fetch session info: " + err.message)
            }
        }
    }, {
        refreshDeps: [sessionId, sessions]
    })
    const { data: userInfo } = useUserQuery(sessionInfo?.type === "PRIVATE" ? sessionInfo.id : 0, userId)
    const { data: groupInfo } = useGroupQuery(sessionInfo?.type === "GROUP" ? sessionInfo.id : 0)
    if (sessionId) {
        return (
            <Layout className="h-screen">
                <Header className="h-15 bg-white text-black dark:bg-black dark:text-white">
                    {userInfo?.name || groupInfo?.name || sessionId}
                </Header>
                <Divider className="m-0" />
                <Content className="p-0">
                    <Splitter lazy layout="vertical">
                        <Panel>
                            <MessageList sessionId={id} />
                        </Panel>
                        <Panel min={"10%"} max={"60%"} defaultSize={"30%"}>
                            <ChatInputBox className="h-full p-4" />
                        </Panel>
                    </Splitter>
                </Content>
            </Layout>
        );
    } else {
        return <></>
    }
}

// 消息列表组件
function MessageList({ sessionId }: { sessionId?: number }) {
    const currentUserId = useAuthStore((state) => state.userInfo?.userId);
    const containerRef = useRef<HTMLDivElement>(null);

    // 监听消息变化，用于实时更新
    const latestMessages = useLiveQuery(
        () => {
            if (!sessionId) return [];
            return getMessagesBySessionId(sessionId, 0, 50, 'desc')
        },
        [sessionId],
        []
    );

    // 无限滚动加载消息
    const { data, loading, loadingMore, noMore } = useInfiniteScroll(
        async (d) => {
            if (!sessionId) return { list: [], hasMore: false };

            const offset = d?.list?.length || 0;
            const messages = await getMessagesBySessionId(sessionId, offset, 50, 'desc');
            return {
                list: messages,
                hasMore: messages.length === 50,
            };
        },
        {
            target: containerRef,
            isNoMore: (d) => d?.hasMore === false,
            reloadDeps: [sessionId],
            direction: 'top',
        }
    );

    // 合并实时消息和加载的消息
    const allMessages = React.useMemo(() => {
        const loadedMessages = data?.list || [];

        if (!latestMessages || latestMessages.length === 0) {
            return loadedMessages;
        }

        // 去重合并，优先使用实时消息
        const messageMap = new Map();

        // 先添加加载的消息
        loadedMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
        });

        // 实时消息覆盖加载的消息（保持最新状态）
        latestMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
        });

        return Array.from(messageMap.values())
            .sort((a, b) => (b.createTime || 0) - (a.createTime || 0));
    }, [data?.list, latestMessages]);

    // 自动滚动到底部
    useEffect(() => {
        if (containerRef.current && latestMessages?.length) {
            const container = containerRef.current;
            // 只有当前已经在底部附近时才自动滚动
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [latestMessages?.length]);

    if (!sessionId) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                请选择一个会话
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto p-4"
            style={{ display: 'flex', flexDirection: 'column-reverse' }}
        >
            {loading && !loadingMore ? (
                <div className="flex justify-center p-4">
                    <Spin />
                </div>
            ) : (
                <>
                    {allMessages.map((message) => (
                        <EnhancedMessageItem
                            key={message.id}
                            message={message}
                            isOwn={message.userId === currentUserId}
                        />
                    ))}
                    {loadingMore && (
                        <div className="flex justify-center p-2">
                            <Spin size="small" />
                        </div>
                    )}
                    {noMore && allMessages.length > 0 && (
                        <div className="text-center text-gray-400 text-sm p-2">
                            没有更多消息了
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// 增强的消息项组件
const EnhancedMessageItem: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => {
    const { data: userInfo } = useUserQuery(message.userId);

    const { data: avatar } = useRequest(async () => {
        const avatarId = userInfo?.avatarFileId
        if (avatarId) {
            const avatar = await getFileContent(avatarId)
            if (avatar) {
                return URL.createObjectURL(avatar)
            }
        }
    }, {
        refreshDeps: [userInfo]
    })

    return (
        <Flex
            justify={isOwn ? "end" : "start"}
            align="end"
            gap="small"
            className="mb-4"
        >
            {!isOwn && (
                <Avatar
                    src={avatar}
                    alt={userInfo?.name}
                    className="flex-shrink-0"
                >
                    {userInfo?.name?.charAt(0)}
                </Avatar>
            )}

            <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                {!isOwn && (
                    <div className="text-xs text-gray-500 mb-1 ml-2">
                        {userInfo?.name}
                    </div>
                )}
                <MessageContent message={message} isOwn={isOwn} />
            </div>

            {isOwn && (
                <Avatar
                    src={avatar}
                    alt={userInfo?.name}
                    className="flex-shrink-0 order-3"
                >
                    {userInfo?.name?.charAt(0)}
                </Avatar>
            )}
        </Flex>
    );
};


function ChatInputBox(props: { className?: string }) {
    const { sessionId } = useParams()
    const [selectedSessionId, setSelectedSessionId] = useState<number>(0);
    const [form] = Form.useForm<{ message: string }>()
    const [messageText, setMessageText] = useState("");

    useEffect(() => {
        if (sessionId) {
            setSelectedSessionId(Number.parseInt(sessionId))
        }
    }, [sessionId, setSelectedSessionId])
    const handleSubmit = async (value: { message: string }) => {
        messageService.sendMessage({
            sessionId: selectedSessionId,
            type: "TEXT",
            content: value.message,
        })
        form.resetFields()
    };
    const onPressEnter = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!e.shiftKey) {
            form.submit()
        }
    }, [form]);
    return (
        <Form variant="borderless" className={props.className} onFinish={handleSubmit} form={form}>
            <Flex vertical className="h-full">
                <Form.Item name="message" onReset={() => setMessageText("")} noStyle>
                    <Input.TextArea
                        onPressEnter={onPressEnter}
                        className="resize-none flex-1"
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        placeholder="Type your message..."
                        onChange={(e) => setMessageText(e.target.value)}
                    />
                </Form.Item>
                <Flex justify="end">
                    <Form.Item className="mb-1">
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={!messageText.trim() || selectedSessionId <= 0}
                        >
                            发送
                        </Button>
                    </Form.Item>
                </Flex>
            </Flex>
        </Form>
    );
}