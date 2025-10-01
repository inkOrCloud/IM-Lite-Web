import { createBrowserRouter, RouterProvider, Navigate, type RouteObject } from 'react-router'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import Dashboard from './pages/dashboard/Index'
import MessageDash from './pages/dashboard/message/MessageDash'
import './App.css'
import DirectoryDash from './pages/dashboard/directory/DirectoryDash'
import ForgotPassword from './pages/forget/ForgotPasswd'
import UserDataInit from './pages/UserDataInit'
import { enableMapSet } from 'immer'
import ChatDash from './pages/dashboard/message/ChatDash'
import SettingsDash from './pages/dashboard/settings/SettingsDash'
import Profile from './pages/dashboard/settings/sub/Profile'
import ChangePasswd from './pages/dashboard/settings/sub/ChangePasswd'


function App() {
  enableMapSet()

  const messageDashRouter: RouteObject[] = [
    {
      path: "message",
      element: <MessageDash />,
      children: [
        {
          path: ":sessionId",
          element: <ChatDash />
        }
      ]
    },
    {
      path: 'directory',
      element: <DirectoryDash />,
    },
    {
      path: 'settings',
      element: <SettingsDash />,
      children: [
        {
          path: 'profile',
          element: <Profile />
        },
        {
          path: 'password',
          element: <ChangePasswd />
        }
      ]
    }
  ]

  const router = createBrowserRouter([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: "/reset",
      element: <ForgotPassword />
    },
    {
      element: <UserDataInit />,
      children: [
        {
          path: '/',
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: '/dashboard',
          element: <Dashboard />,
          children: messageDashRouter
        },
      ]
    }
  ])
  return <RouterProvider router={router} />
}

export default App
