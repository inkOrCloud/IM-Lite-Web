import { Avatar, Button, Card, Form, InputNumber, Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { addFriend } from "../../../../store/useFriendIdsQuery";
import { useAuthStore } from "../../../../store/useAuthStore";
import useUserQuery from "../../../../store/useUserQuery";
import { useDebounceFn, useRequest } from "ahooks";
import { getFileContent } from "../../../../db/util/FileUtil";
import useApp from "antd/es/app/useApp";
import { useDirectoryStore } from "../../../../store/useDirectoryStore";
import { useShallow } from "zustand/shallow";
export function AddFriend() {
    const [addFriendModalOpen, setAddFriendModalOpen] = useDirectoryStore(
        useShallow(
            state => [state.addFriendModalOpen, state.setAddFriendModalOpen]
        )
    )
    const { message } = useApp()
    const userId = useAuthStore(state => state.userInfo?.userId)
    const [queryUserId, setQueryUserId] = useState<number>(0)
    const { data: desUser, isLoading } = useUserQuery(queryUserId)
    const { data: avatarFileUrl } = useRequest(async () => {
        if (desUser?.avatarFileId) {
            const file = await getFileContent(desUser.avatarFileId)
            if (file) {
                return URL.createObjectURL(file)
            }
        }
    }, {
        refreshDeps: [desUser]
    })
        
    const { mutateAsync } = addFriend(userId || 0)
    const { run } = useDebounceFn(() => {
        mutateAsync(queryUserId , {
            onSuccess: () => {
                message.success("添加成功")
            },
            onError: () => {
                message.error("添加失败")
            }
        })
    }, { wait: 5 * 1000, leading: true, trailing: false })

    useEffect(() => {
        setAddFriendModalOpen(false)
    }, [setAddFriendModalOpen])

    return (
        <Modal
            open={addFriendModalOpen}
            title="添加好友"
            destroyOnHidden={true}
            onCancel={() => setAddFriendModalOpen(false)}
            footer={null}
        >
            <Form layout="inline" preserve={false} onFinish={(values:{userId:number}) => setQueryUserId(values.userId)}>
                <Form.Item
                    name="userId"
                    label="用户id"
                    rules={[
                        { required: true, message: "请输入用户id" },
                        {type:"number" , min: 1, message: "请输入有效用户id" }
                    ]}
                >
                    <InputNumber placeholder="请输入用户id" controls={false} className="w-70"/>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">搜索</Button>
                </Form.Item>
            </Form>
            <br/>
            {isLoading && (<Spin />)}
            {desUser && (
                <Card
                    actions={[<span onClick={run}>添加好友</span>]}
                >
                    <Card.Meta
                        title={desUser.name}
                        avatar={avatarFileUrl && <Avatar src={avatarFileUrl} />}
                        description={desUser.biography}
                    />
                </Card>
            )}
        </Modal>
    )
}