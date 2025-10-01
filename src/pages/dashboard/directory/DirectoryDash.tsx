import { Flex, Layout } from "antd";
import Directory from "./Directory";
import PersonProfile from "./util/PersonProfile";

export default function DirectoryDash() {
    const { Sider, Content } = Layout;
    return (
        <Layout className="h-full">
            <Sider theme="light" className="w-64">
            <Directory />
            </Sider>
            <Content>
                <Flex justify="center" align="center" className="w-full h-full"><PersonProfile/></Flex>
            </Content>
        </Layout>
    )
}