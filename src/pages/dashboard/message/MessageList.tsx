import { List, ConfigProvider } from "antd";
import { useLiveQuery } from "dexie-react-hooks"
import { getLastMessageWithSessionId } from "../../../db/util/MessageUtil";
import MessageListItem from "./util/MessageListItem";
import useSessionQuery from "../../../store/useSessionQuery";
import { useAuthStore } from "../../../store/useAuthStore";

function MessageList() {
    const userId = useAuthStore(state => state.userInfo?.userId)
    const { data: sessions } = useSessionQuery(userId || 0)
    const list = useLiveQuery(async () => {
        const result = []
        if (sessions) {
            for (let v of sessions) {
                result.push({
                    session: v,
                    lastMessage: await getLastMessageWithSessionId(v.id),
                })
            }
        }
        return result
    }, [sessions])
    if (list) {
        list.sort((a, b) => (b.lastMessage?.createTime || 0) - (a.lastMessage?.createTime || 0))
    }
    return (
        <ConfigProvider theme={{ token: { lineHeight: 1.2 } }}>
            <List
                className="w-full h-full overflow-y-auto select-none"
                split={false}
                itemLayout="horizontal"
                dataSource={list}
                renderItem={(item) => <MessageListItem session={item.session} lastMessage={item.lastMessage} />}
            />
        </ConfigProvider>
    );
}

export default MessageList;