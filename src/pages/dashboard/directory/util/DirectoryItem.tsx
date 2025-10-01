import { Avatar, Flex, List } from "antd"
import Paragraph from "antd/es/typography/Paragraph"
import { useDirectoryStore, type DirectoryType } from "../../../../store/useDirectoryStore";
import { useRequest } from "ahooks";
import { getFileContent } from "../../../../db/util/FileUtil";
import useGroupQuery from "../../../../store/useGroupQuery";
import useUserQuery from "../../../../store/useUserQuery";

export default function DirectoryItem(props: { id: number, type: DirectoryType }) {
    const { id, type } = props
    const setSelectedKey = useDirectoryStore(state => state.setSelectedKey)
    const selectedKey = useDirectoryStore(state => state.selectedKey)
    const { data: group } = useGroupQuery(type === "group" ? id : 0)
    const { data: user } = useUserQuery(type === "person" ? id : 0)
    let avatarFileId: string | undefined
    if (type === "person") {
        avatarFileId = user?.avatarFileId
    } else if (type === "group") {
        avatarFileId = group?.avatarFileId
    }
    const { data: avatarFile } = useRequest(async () => {
        if (avatarFileId) {
            return await getFileContent(avatarFileId)
        }
    }, {
        refreshDeps: [avatarFileId],
    })
    return (
        <List.Item className="p-0" style={{backgroundColor: id === selectedKey ? "#0d6ecf" : undefined}}
            onClick={() => {
                setSelectedKey(id)
            }}
        >
            <div className="h-15 mr-2 ml-2 mt-1 mb-1 h-10 w-full">
                <Flex align="center" className="w-full h-full">
                    <Avatar className="mr-3" size={"large"} src={avatarFile && URL.createObjectURL(avatarFile)} >
                        {user?.name?.charAt(0) || group?.name?.charAt(0)}
                    </Avatar>
                    <Paragraph ellipsis className="m-0" style={{color:id === selectedKey ? "white" : undefined}} >
                        {group?.name || user?.name || id}
                    </Paragraph>
                </Flex>
            </div>
        </List.Item>
    )
}