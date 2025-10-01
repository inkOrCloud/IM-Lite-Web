import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Upload, type UploadFile, type UploadProps } from "antd";
import useApp from "antd/es/app/useApp";
import { useState } from "react";
import { useAuthStore } from "../../../../store/useAuthStore";
import useUserQuery, { updateUserProfileMutation } from "../../../../store/useUserQuery";
import { useDebounceFn } from "ahooks";
import type UserProfile from "../../../../entity/user/UserProfile";
import { uploadFile } from "../../../../db/util/FileUtil";
import type FileInfo from "../../../../entity/file/FileInfo";

export default function Profile() {
    const [imgUrl, setImgUrl] = useState<string>()
    const userId = useAuthStore(state => state.userInfo?.userId)
    const { data: rawProfile } = useUserQuery(userId || 0)
    const { message } = useApp()
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

    const { mutateAsync } = updateUserProfileMutation()
    const { run } = useDebounceFn(async ( username: string, biography: string, avatar: {file: UploadFile},) => {
        const profile:Partial<UserProfile> = {
            name: username,
            biography,
        }
        let fileInfo:FileInfo|undefined
        if (avatar?.file.originFileObj) {
            fileInfo = await uploadFile(avatar.file.originFileObj)
        }
        if (fileInfo) {
            profile.avatarFileId = fileInfo.id
        }
        await mutateAsync({
            userId: userId || 0,
            profile
        }, {
            onSuccess() {
                message.success("更新成功")
            },
            onError(error) {
                message.error(error.message)
            }
        })
    }, { wait: 3000, leading: true, trailing: false })
    const handleSubmit = async (values: { avatar: { file: UploadFile }, username: string, biography: string }) => {
        run(values.username, values.biography, values.avatar)
    }
    return (
        <div className="m-10 lg:mr-40 lg:ml-40">
            <Form preserve={false} onFinish={handleSubmit}>
                <Form.Item name="avatar" valuePropName="file">
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
                <Form.Item label="用户id" name="userId" initialValue={userId} className="max-w-100">
                    <Input disabled />
                </Form.Item>
                <Form.Item 
                label="用户名" 
                name="username" 
                initialValue={rawProfile?.name} 
                className="max-w-100"
                rules={[
                    {type: "string", max: 30, message: "用户名长度不能超过30个字符"},
                    { pattern: /^[_a-zA-Z0-9\u4e00-\u9fa5]+$/, message: "群组名称只能包含中文、英文、数字和下划线" }
                ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                label="签名" 
                name="biography" 
                initialValue={rawProfile?.biography}
                rules={[
                    {type: "string", max: 100, message: "签名长度不能超过100个字符"}
                ]}
                >
                    <Input.TextArea />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">保存</Button>
                </Form.Item>
            </Form>
        </div>
    )
}