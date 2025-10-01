import React, { useEffect } from "react";
import { Form, Input, Button, Card, Flex, Layout } from "antd";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router";
import axios, { type AxiosResponse } from "axios";
import useApp from "antd/es/app/useApp";

const Login: React.FC = () => {
  const { Content } = Layout;
  const login = useAuthStore((state) => state.login);
  const expire = useAuthStore((state) => state.expire)
  const navigate = useNavigate();
  const App = useApp()
  const { message } = App;
  const onFinish = async (values: { email: string; password: string }) => {
    interface Request {
      email?: string;
      num?: number;
      passwd: string;
      time: number;
    }

    interface Response {
      code?: number;
      id?: number;
      message?: string;
      time?: number;
      token?: string;
    }

    // 模拟请求，这里可以改成 axios.post("/api/login", values)
    axios.post<Response, AxiosResponse<Response>, Request>("/api/login/email",
      {
        email: values.email,
        passwd: values.password,
        time: Math.floor(Date.now() / 1000),
        num: Math.round(Math.random() * Math.pow(10, 8))
      }
    )
      .then(
        (r) => {
          if (r.data && r.data.code === 0) {
            login(r.data.token as string)
            message.success("登录成功")
            navigate("/dashboard")
          } else if (r.data && r.data.code === 1) {
            message.error("用户名或密码错误")
          } else {
            message.error("未知错误")
          }
        }
      )
      .catch(
        () => {
          message.error("未知错误")
        }
      )
  };

  useEffect(() => {
    if (expire && expire > Math.floor(Date.now() / 1000)) {
      navigate("/dashboard")
    }
  })

  return (
    <Layout>
      <Content>
        <Flex className="flex items-center justify-center min-h-screen" justify="center" align="center">
          <Card className="w-96 shadow-lg rounded-2xl">
            <h2 className="text-center text-xl font-semibold mb-6">用户登录</h2>
            <Form name="login" onFinish={onFinish} layout="vertical">
              <Form.Item
                label="用户邮箱"
                name="email"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  登录
                </Button>
              </Form.Item>

              <Form.Item>
                <Button type="link" onClick={() => navigate("/register")}>
                  没有账号？注册新用户
                </Button>
              </Form.Item>

              <Form.Item>
                <Button type="link" onClick={() => navigate("/reset")}>
                  忘记密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Flex>
      </Content>
    </Layout>
  );
};

export default Login;
