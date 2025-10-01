import { Form, Input, Modal, Upload } from "antd";
import { useDirectoryStore } from "../../../../store/useDirectoryStore";
import { useShallow } from "zustand/shallow";
import useGroupQuery, { updateGroupProfileMutation } from "../../../../store/useGroupQuery";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload";
import useApp from "antd/es/app/useApp";
import { useForm } from "antd/es/form/Form";
import { uploadFile } from "../../../../db/util/FileUtil";

export default function ManageGroup(props: { groupId: number }) {
    const { message } = useApp()
    const { groupId } = props
    const [open, setOpen] = useDirectoryStore(
        useShallow(
            state => [state.manageGroupModalOpen, state.setManageGroupModalOpen]
        )
    )
    const { data: groupProfile } = useGroupQuery(groupId)
    const [imgUrl, setImgUrl] = useState<string>()
    const [form] = useForm()
    const [loading, setLoading] = useState(false)

    const { mutateAsync } = updateGroupProfileMutation()

    const handleBeforeUpload: UploadProps["beforeUpload"] = (file) => {
        if (!file.type.startsWith("image/")) {
            message.error("请上传图片类型的文件")
            return false
        }
        if (file.size > 5 * Math.pow(2, 20)) {
            message.error("请上传小于5MB的图片")
            return false
        }
        return true
    }

    const handleChange: UploadProps["onChange"] = (info) => {
        if (info.file.originFileObj) {
            setImgUrl(URL.createObjectURL(info.file.originFileObj))
        }
    }

    const onFinish = async (values: { avatar: {file:UploadFile}, name: string, description: string }) => {
        try {
            const { avatar, name, description } = values
            setLoading(true)
            let avatarInfo
            if(avatar && avatar.file && avatar.file.originFileObj) {
                avatarInfo = await uploadFile(avatar.file.originFileObj)
            }
            await mutateAsync({groupId, groupProfile: {avatarFileId: avatarInfo?.id, name, biography: description}})
            message.success("修改成功")
        }catch (e) {
            message.error("上传失败")
        }finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setOpen(false)
    }, [setOpen])

    if (groupProfile) {
        return (
            <Modal
                title="管理群组"
                open={open}
                destroyOnHidden={true}
                onCancel={() => {
                    setOpen(false)
                }}
                onOk={() => form.submit()}
                confirmLoading={loading}
            >
                <Form form={form} onFinish={onFinish} preserve={false}>
                    <Form.Item label="群组头像" name="avatar" valuePropName="file">
                        <Upload
                            beforeUpload={handleBeforeUpload}
                            listType="picture-circle"
                            maxCount={1}
                            showUploadList={false}
                            onChange={handleChange}
                        >
                            {imgUrl ?
                                <img src={imgUrl} draggable={false} alt="avatar" className="w-full rounded-full" />
                                :
                                <button type="button" className="border-none bg-none">
                                    <PlusOutlined />
                                    <div className="mt-2">Upload</div>
                                </button>

                                
                            }
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        rules={[
                            { type: "string", max: 20, message: "群组名称过长" },
                            { pattern: /^[_a-zA-Z0-9\u4e00-\u9fa5]+$/, message: "群组名称只能包含中文、英文、数字和下划线" }
                        ]}
                        label="群组名称" name="name">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        rules={[
                            { type: "string", max: 200, message: "群组描述过长" },
                        ]}
                        label="群组描述" name="description">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        )
    } else {
        return <></>
    }
}