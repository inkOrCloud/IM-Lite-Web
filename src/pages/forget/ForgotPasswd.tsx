import { Layout, Form, Input, Button, Card, Flex } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCountDown, useRequest } from "ahooks"
import axios, { AxiosError, type AxiosResponse } from "axios";
import useApp from "antd/es/app/useApp";
import { sendEmailCode } from "../../util/email/emailUtil";

const { Content } = Layout;

export default function ForgotPassword() {
    const { message } = useApp()
    const navigate = useNavigate()
    const [form] = Form.useForm<{ email: string, code: string, newPassword: string }>()
    const [targetDate, setTargetDate] = useState<number | undefined>()
    const [prev] = useCountDown({
        targetDate
    })

    const sendCode = async () => {
        const value = await form.validateFields(["email"])
        sendEmailCode(value.email)
            .then(res => {
                if (res.ok) {
                    message.success("验证码发送成功，请注意查收")
                    setTargetDate(Date.now() + 60000)
                } else {
                    message.error(res.message)
                }
            })
    };

    const sendCodeState = useRequest(sendCode, { manual: true })

    const onFinish = async (values: { email: string, code: string, newPassword: string }) => {
        interface Request {
            code: string;
            email: string;
            password: string;
        }
        type Code = "SUCCESS" | "CODE_ERROR";
        interface ResetPasswdResponse {
            code?: Code;
            id?: number;
            message?: string;
        }
        try {
            const res = await axios.post<ResetPasswdResponse, AxiosResponse<ResetPasswdResponse>, Request>("/api/security/reset", {
                code: values.code,
                email: values.email,
                password: values.newPassword
            })
            switch (res.data.code) {
                case "SUCCESS":
                    message.success("密码修改成功")
                    navigate("/login")
                    break
                case "CODE_ERROR":
                    message.error("验证码错误")
                    break
                default:
                    message.error("未知错误")
            }
        } catch (err) {
            if ((err as AxiosError).response?.status === 422) {
                message.error("请点击发送验证码")
            } else {
                message.error("未知错误")
            }
        }
    };

    const onFinishState = useRequest(onFinish, { manual: true })

    return (
        <Layout>
            <Content>
                <Flex className="flex items-center justify-center min-h-screen" justify="center" align="center">
                    <Card className="w-96 shadow-lg rounded-2xl">
                        <h2 className="text-center text-xl font-semibold mb-6">找回密码</h2>
                        <Form form={form} name="forgot-password" onFinish={onFinishState.runAsync} layout="vertical">
                            <Form.Item
                                label="用户邮箱"
                                name="email"
                                rules={[{ required: true, message: "请输入邮箱" }]}
                            >
                                <Input placeholder="请输入注册邮箱" />
                            </Form.Item>

                            <Form.Item
                                label="验证码"
                                name="code"
                                rules={[{ required: true, message: "请输入验证码" }]}
                            >
                                <Flex gap={8}>
                                    <Input placeholder="请输入验证码" />
                                    <Button onClick={sendCodeState.runAsync} disabled={!!prev || sendCodeState.loading}>
                                        {prev ?
                                            Math.round(prev/1000) + "秒后重新发送"
                                            : "发送验证码"
                                        }
                                    </Button>
                                </Flex>
                            </Form.Item>

                            <Form.Item
                                label="新密码"
                                name="newPassword"
                                rules={[{ required: true, message: "请输入新密码" }]}
                            >
                                <Input.Password placeholder="请输入新密码" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    重置密码
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Flex>
            </Content>
        </Layout>
    );
}
