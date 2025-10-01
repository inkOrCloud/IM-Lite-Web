import { Button, Dropdown, Flex, List, Radio } from "antd"
import useFriendIdsQuery from "../../../store/useFriendIdsQuery"
import { useAuthStore } from "../../../store/useAuthStore"
import useGroupIdsQuery from "../../../store/useGroupIdsQuery"
import DirectoryItem from "./util/DirectoryItem"
import { useDirectoryStore, } from "../../../store/useDirectoryStore"
import { useShallow } from "zustand/shallow"
import { PlusOutlined, UserAddOutlined, UsergroupAddOutlined } from "@ant-design/icons"
import type { ItemType } from "antd/es/menu/interface"
import { AddFriend } from "./util/AddFriend"
import CreateGroup from "./util/CreateGroup"

export default function Directory() {
    const userId = useAuthStore(state => state.userInfo!.userId)
    const [directoryType, setDirectoryType, setSelectedKey] = useDirectoryStore(useShallow(
        state => [state.directoryType, state.setDirectoryType, state.setSelectedKey]
    ))
    const { data: friendIds } = useFriendIdsQuery(userId)
    const { data: groupIds } = useGroupIdsQuery(userId)
    const [setAddFriendOpen, setCreateGroupOpen] = useDirectoryStore(useShallow(
        state => [state.setAddFriendModalOpen, state.setCreateGroupModalOpen]
    ))
    const items:ItemType[] = [
        {
            key: "addFriend",
            icon: <UserAddOutlined />,
            label: "添加好友",
            onClick: () => {
                setAddFriendOpen(true)
            }
        },
        {
            key: "createGroup",
            icon: <UsergroupAddOutlined />,
            label: "创建群组",
            onClick: () => {
                setCreateGroupOpen(true)
            }
        }
     ]

    return (
        <div className="h-full">
            <Flex className="h-full" vertical>
                <Flex justify="center" className="mt-4 mb-4" gap={3}>
                    <Radio.Group
                        options={[
                            "person",
                            "group"
                        ]}
                        defaultValue={"person"}
                        optionType="button"
                        value={directoryType}
                        onChange={e => { setDirectoryType(e.target.value), setSelectedKey() }}
                    />
                    <Dropdown menu={{ items }} trigger={["click"]}>
                        <Button><PlusOutlined /></Button>
                    </Dropdown>                    
                </Flex>
                <List
                    className="overflow-y-auto select-none"
                    itemLayout="horizontal"
                    dataSource={directoryType === "person" ? friendIds || [] : groupIds || []}
                    split={false}
                    renderItem={item => <DirectoryItem key={item} id={item} type={directoryType} />}
                />
            </Flex>
            <AddFriend />
            <CreateGroup />
        </div>
    )
}