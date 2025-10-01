import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@ant-design/v5-patch-for-react-19';
import './index.css'
import App from './App.tsx'
import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import QueryClientInstance from './util/QueryClientInstance.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleProvider layer>
    <ConfigProvider theme={{cssVar: true, hashed: false}}>
    <QueryClientProvider
      client={QueryClientInstance}
    >
    <AntdApp>
    <App />
    </AntdApp>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </ConfigProvider>
    </StyleProvider>
  </StrictMode>,
)
