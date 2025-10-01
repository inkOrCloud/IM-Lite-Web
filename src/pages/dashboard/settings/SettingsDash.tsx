import { SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { ConfigProvider, Layout, Menu, type MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";

export default function SettingsDash() {
    const { Sider, Content } = Layout
    const location = useLocation()
    const navigate = useNavigate()
    const items: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined style={{color: "#1677ff"}} />,
            label: '个人资料',
        },
        {
            key: "password",
            icon: <SafetyOutlined style={{color: "#1677ff"}} />,
            label: '修改密码',
        }
    ]
    const onClick: MenuProps['onClick'] = (e) => {
        if(location.pathname.endsWith("settings") || location.pathname.endsWith("settings/")) {
            navigate(e.key)       
        }else{
            navigate("../settings/"+e.key)
        }
    };
    return (
        <ConfigProvider theme={{components: {
            Menu: {
                iconSize: 18
            }
        }}}>
        <Content>
            <Layout className="min-h-full">
                <Sider>
                    <Menu 
                        className="h-full"
                        theme="light"
                        items={items}
                        onClick={onClick}
                    />
                </Sider>
                <Content className="min-h-full">
                <Outlet />
                </Content>
            </Layout>
        </Content>
        </ConfigProvider>
    )
}