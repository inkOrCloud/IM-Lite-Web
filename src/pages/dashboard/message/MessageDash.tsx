import { Divider, Layout } from "antd";
import MessageList from "./MessageList";
import { Outlet } from "react-router";

function MessageDash() {
    const { Sider, Content } = Layout;
    return (
        <Layout className="w-full h-full">
            <Sider className="w-64 pt-4 pb-4 overflow-y-auto" theme="light">
                <MessageList />
            </Sider>
            <Divider type="vertical" className="h-full m-0"/>
            <Content>
                <Outlet />
            </Content>
        </Layout>
    )
}

export default MessageDash;