import { Button, Form, Input, Modal } from "antd";
import { useDirectoryStore } from "../../../../store/useDirectoryStore";
import { useShallow } from "zustand/shallow";
import { createGroup } from "../../../../store/useGroupIdsQuery";
import { useAuthStore } from "../../../../store/useAuthStore";
import useApp from "antd/es/app/useApp";
import { useEffect } from "react";

export default function CreateGroup() {
    const[open , setOpen] = useDirectoryStore(
        useShallow(
            state => [state.createGroupModalOpen, state.setCreateGroupModalOpen]
        )
    )
    const {message} = useApp()
    const userId = useAuthStore(state => state.userInfo?.userId)
    const { mutate } = createGroup(userId || 0)
    const onFinish = (values: {name: string}) => {
        mutate(values.name, {
            onSuccess: () => {
                message.success("创建成功")
            },
            onError: () => {
                message.error("创建失败")
            }
        })
        setOpen(false)
    }

    useEffect(() => {
        setOpen(false)
    }, [setOpen])

    return (
        <Modal
            title="创建群组"
            open={open}
            footer={null}
            destroyOnHidden={true}
            onCancel={() => {
                setOpen(false)
            }}
        >
            <Form layout="inline" preserve={false}  onFinish={onFinish}>
                <Form.Item label="群组名称">
                    <Form.Item 
                    rules={[
                        { required: true, message: "请输入群组名称" },
                        { type:"string" , max: 20, message: "群组名称过长" },
                        { pattern: /^[_a-zA-Z0-9\u4e00-\u9fa5]+$/, message: "群组名称只能包含中文、英文、数字和下划线" }
                    ]}
                    name="name">
                        <Input />
                    </Form.Item>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">创建</Button>
                </Form.Item>
            </Form>
        </Modal>
    )
}