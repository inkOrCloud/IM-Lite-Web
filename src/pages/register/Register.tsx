import { Layout, Form, Card, Button, Input, Flex } from "antd";
import useApp from "antd/es/app/useApp";
import { useForm } from "antd/es/form/Form";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";
import { sendEmailCode } from "../../util/email/emailUtil";
import { useCountDown, useRequest } from "ahooks";


function Register() {
    const { Content } = Layout;
    const navigate = useNavigate();
    const [form] = useForm<{ email: string; password: string; code: string }>()
    const [registering, setRegistering] = useState(false)
    const { message } = useApp()
    const [targetDate, setTargetDate] = useState(0)
    const [countDown] = useCountDown({
        targetDate
    })
    const { runAsync: sendEmail } = useRequest(async () => {
        try {
            const value: string = await form.getFieldValue(["email"])
            const { ok, message: m } = await sendEmailCode(value)
            if (ok) {
                message.success("验证码发送成功，请注意查收")
                setTargetDate(Date.now() + 60 * 1000)
            } else {
                message.error(m)
            }
        } catch { }

    }, {
        manual: true,
        debounceWait: 3000,
        debounceLeading: true,
        debounceTrailing: false,
    })

    const onFinish = (values: { email: string; password: string; code: string }) => {
        interface Request {
            code: string;
            email: string;
            passwd?: string;
        }
        interface RegisterResponse {
            code?: number;
            id?: number;
            message?: string;
        }
        setRegistering(true)
        axios.post<RegisterResponse, AxiosResponse<RegisterResponse>, Request>("/api/register/email", {
            email: values.email,
            passwd: values.password,
            code: values.code
        })
            .then((res) => {
                if (res.data.code === undefined) {
                    message.error("未知错误")
                    return
                }
                switch (res.data.code) {
                    case 0:
                        message.success("注册成功")
                        navigate("/login")
                        break
                }
            })
            .catch((err: AxiosError) => {
                switch (err.response?.status) {
                    case 409:
                        message.error("该邮箱已注册")
                        break
                    case 422:
                        message.error("验证码错误")
                        break
                    default:
                        message.error("未知错误")
                }
            })
            .finally(() => {
                setRegistering(false)
            })
    };



    return (
        <Layout>
            <Content className="flex items-center justify-center h-screen">
                <Flex justify="center" align="center" className="w-full h-full">
                    <Card className="w-96 shadow-lg rounded-2xl">
                        <h2 className="text-center text-xl font-semibold mb-6">用户注册</h2>
                        <Form name="register" onFinish={onFinish} layout="vertical" form={form}>
                            <Form.Item
                                label="用户邮箱"
                                name="email"
                                rules={[
                                    { required: true, message: "请输入邮箱地址" },
                                    { type: "email", message: "请输入有效邮箱地址" }
                                ]}
                            >
                                <Input placeholder="请输入邮箱地址" />
                            </Form.Item>
                            <Form.Item
                                label="邮箱验证码"
                                required
                            >
                                <Flex gap="small">
                                    <Form.Item
                                        name="code"
                                        rules={[{ required: true, message: "请输入验证码" }]}
                                        noStyle
                                    >
                                        <Input placeholder="请输入验证码" />
                                    </Form.Item>
                                    <Button onClick={sendEmail} disabled={countDown > 0}>
                                        {countDown <= 0 ? "发送验证码" : Math.floor(countDown / 1000) + " 秒后重发"}
                                    </Button>
                                </Flex>
                            </Form.Item>
                            <Form.Item
                                label="密码"
                                name="password"
                                rules={[{ required: true, message: "请输入密码" }]}
                            >
                                <Input.Password placeholder="请输入密码" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" disabled={registering} block>
                                    注册
                                </Button>
                            </Form.Item>
                            <Form.Item>
                                <Button type="link" onClick={() => navigate("/login")}>
                                    已有账号？去登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Flex>
            </Content>
        </Layout>
    );
}

export default Register;