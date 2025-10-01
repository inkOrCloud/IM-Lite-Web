import { ConfigProvider, Layout, Menu, type MenuProps } from "antd";
import { Outlet, useNavigate } from "react-router";
import { MessageTwoTone, BookTwoTone, SettingTwoTone } from "@ant-design/icons";

function Index() {
  const { Sider } = Layout;
  const items:MenuProps['items'] = [
    {
      key: 'message',
      icon: <MessageTwoTone />, 
      label: '消息',
    },
    {
      key: 'directory',
      icon: <BookTwoTone />,
      label: '通讯录',
    },
    {
      key: 'settings',
      icon: <SettingTwoTone />,
      label: '设置', 
    }
  ]
  const navigate = useNavigate();
  const onClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'message') {
      navigate('message');
    } else if (e.key === 'directory') {
      navigate('directory');
    } else if (e.key === 'settings') {
      navigate('settings');
    }
  };
  return (
    <ConfigProvider theme={{components: {
      Menu: {
        collapsedIconSize: 24,
        itemMarginBlock: 20
      }
    }}}>
    <Layout className="h-screen">
      <Sider defaultCollapsed={true} collapsed={true} theme="light">
        <Menu items={items} className="h-full" onClick={onClick}/>
      </Sider>
      <Outlet />
    </Layout>
    </ConfigProvider>
  );
}

export default Index;