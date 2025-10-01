import { Avatar, Card, Flex } from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import { useDirectoryStore } from "../../../../store/useDirectoryStore";
import { useShallow } from "zustand/shallow";
import useGroupQuery from "../../../../store/useGroupQuery";
import useUserQuery from "../../../../store/useUserQuery";
import { useDebounceFn, useRequest } from "ahooks";
import { getFileContent } from "../../../../db/util/FileUtil";
import { useNavigate } from "react-router";
import { deleteMemberFromGroup } from "../../../../store/useGroupMembersQuery";
import { useAuthStore } from "../../../../store/useAuthStore";
import { removeFriend } from "../../../../store/useFriendIdsQuery";
import { useGroupMemberQuery } from "../../../../store/useGroupMemberQuery";
import ManageGroup from "./ManageGroup";
import { ManagerGroupMember } from "./ManageGroupMember";
import { deleteGroup } from "../../../../store/useGroupIdsQuery";

function QuitGroup(props: { groupId: number }) {
    const { groupId } = props
    const userId = useAuthStore((state) => state.userInfo?.userId)
    const { mutateAsync } = deleteMemberFromGroup()
    const { run } = useDebounceFn(() => mutateAsync({ groupId, memberId: userId || 0 }), { wait: 5 * 1000, leading: true, trailing: false })
    return <span onClick={run}>退出群聊</span>
}

function DeleteGroup(props: { groupId: number }) {
    const { groupId } = props
    const userId = useAuthStore((state) => state.userInfo?.userId)
    const { mutateAsync } = deleteGroup(userId || 0)
    const { run } = useDebounceFn(() => mutateAsync(groupId), { wait: 5 * 1000, leading: true, trailing: false })
    return <span onClick={run}>删除群组</span>
}

function DeleteFriend(props: { friendId: number }) {
    const { friendId } = props
    const userId = useAuthStore((state) => state.userInfo?.userId)
    const { mutateAsync } = removeFriend(friendId, userId || 0)
    const { run } = useDebounceFn(mutateAsync, { wait: 5 * 1000, leading: true, trailing: false })
    return <span onClick={run}>删除好友</span>
}

export default function PersonProfile() {
    const userId = useAuthStore((state) => state.userInfo?.userId)
    const [directoryType, selectedKey] = useDirectoryStore(useShallow(state => [state.directoryType, state.selectedKey]))
    const { data: group } = useGroupQuery(directoryType === "group" ? selectedKey || 0 : 0)
    const { data: user } = useUserQuery(directoryType === "person" ? selectedKey || 0 : 0, userId)
    const { data: member } = useGroupMemberQuery(directoryType === "group" ? selectedKey || 0 : 0, userId || 0)
    const setManageGroupModalOpen = useDirectoryStore(state => state.setManageGroupModalOpen)
    const setManageGroupMemberModalOpen = useDirectoryStore(state => state.setManageGroupMemberModalOpen)
    const avatarFileId = group?.avatarFileId || user?.avatarFileId || 0
    const navigate = useNavigate()
    const { data: avatarFileUrl } = useRequest(async () => {
        if (avatarFileId) {
            const file = await getFileContent(avatarFileId)
            if (file) {
                return URL.createObjectURL(file)
            }
        }
    }, {
        refreshDeps: [avatarFileId]
    })
    if (!selectedKey) {
        return <></>
    }

    let id
    if (directoryType === "person") {
        id = "UID: " + user?.userId
    } else {
        id = "GID: " + group?.groupId
    }

    let actions: React.ReactNode[] = []

    switch (directoryType) {
        case "person":
            actions = [
                <span onClick={
                    () => { navigate("../message/" + user?.sessionId) }
                }>发消息</span>,
                <DeleteFriend friendId={user?.userId || 0} />
            ]
            break
        case "group":
            actions = [
                <span onClick={
                    () => { navigate("../message/" + group?.groupId) }
                }>发消息</span>
            ]
            if (member && (member.role === "OWNER" || member.role === "ADMIN")) {
                actions.push(<span onClick={() => setManageGroupModalOpen(true)}>管理群组</span>)
                actions.push(<span onClick={() => setManageGroupMemberModalOpen(true)}>管理群成员</span>)
            }
            if (member && member.role === "OWNER") {
                actions.push(<DeleteGroup groupId={group?.id || 0} />)
            }else{
                actions.push(<QuitGroup groupId={group?.id || 0} />)
            }
    }
    return <Card
        className="max-w-sm"
        actions={actions}
    >
        <div>
            <Flex>
                <div className="mr-4">
                    <Avatar size={64} src={avatarFileUrl}>{user?.name?.charAt(0)||group?.name?.charAt(0)}</Avatar>
                </div>
                <div>
                    <strong className="text-base">{user?.name || group?.name}</strong>
                    <p className="text-gray-400">{id}</p>
                    <Paragraph className="text-gray-400">{user?.biography || group?.biography}</Paragraph>
                </div>
            </Flex>
        </div>
        <ManageGroup groupId={group?.id || 0} />
        <ManagerGroupMember groupId={group?.id || 0} />
    </Card>;
}
