import { useRequest } from "ahooks";
import { Button, Form, Input, type FormItemProps } from "antd";
import useApp from "antd/es/app/useApp";
import axios, { type AxiosResponse } from "axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useShallow } from "zustand/shallow";

export default function ChangePasswd() {
    const { message } = useApp()
    const [userId, logout] = useAuthStore(
        useShallow(
            state => [state.userInfo?.userId, state.logout]
        )
    )
    const rules: FormItemProps["rules"] = [
        {
            required: true,
            message: "请输入密码"
        },
        {
            min: 6,
            message: "密码长度不能小于6"
        },
        {
            max: 16,
            message: "密码长度不能大于16"
        },
        {
            pattern: /^[a-zA-Z0-9_@.]+$/,
            message: "密码只能包含字母、数字和_@."
        }
    ]


    const [form] = Form.useForm();

    const { runAsync } = useRequest(async (values: { oldPasswd: string, newPasswd: string, confirmPasswd: string }) => {
        interface Request {
            id ?: number;
            newPass: string;
            oldPass: string;
        }
        interface Response {
            code?: Code;
            id?: number;
            message?: string;
        }

        type Code = "SUCCESS" | "PASSWORD_ERROR";
        const res = await axios.post<Response, AxiosResponse<Response>, Request>(
            "/api/security/change_passwd",
            {
                id: userId,
                oldPass: values.oldPasswd,
                newPass: values.newPasswd
            }
        )
        switch (res.data.code) {
            case "SUCCESS":
                message.success("密码修改成功")
                logout()
                break
            case "PASSWORD_ERROR":
                message.error("旧密码错误")
                break
            default:
                message.error("未知错误")
        }
    }, {
        manual: true,
        debounceWait: 3000,
        debounceLeading: true,
        debounceTrailing: false
    })

    return (
        <div className="m-10 lg:mr-40 lg:ml-40">
            <Form className="max-w-100" form={form} onFinish={runAsync}>
                <Form.Item
                    rules={rules}
                    name="oldPasswd"
                    label="旧密码">
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    rules={rules}
                    name="newPasswd"
                    label="新密码">
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    dependencies={["newPasswd"]}
                    rules={[
                        ...rules,
                        ({ getFieldValue }) => ({
                            validator: (_, value) => {
                                if (value !== getFieldValue("newPasswd")) {
                                    return Promise.reject("两次输入的密码不一致");
                                }
                                return Promise.resolve();
                            }
                        })
                    ]}
                    name="confirmPasswd"
                    label="确认密码">
                    <Input.Password />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">修改密码</Button>
                </Form.Item>
            </Form>
        </div>
    )
}