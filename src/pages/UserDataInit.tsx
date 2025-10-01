import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import axios, { isAxiosError } from "axios";
import pino from "pino";
import { messageService } from "../service/MessageService";
import { useEffect } from "react";
import useSessionQuery from "../store/useSessionQuery";

export default function UserDataInit() {
    const navigate = useNavigate()
    const jwt = useAuthStore((state) => state.jwt)
    const userId = useAuthStore((state) => state.userInfo?.userId)
    const logout = useAuthStore((state) => state.logout)
    const logger = pino()

    // 设置请求头（依赖JWT）
    axios.defaults.headers.common['Authorization'] = "Bearer " + jwt;

    useEffect(() => {
        // 1. 登录状态检查（核心职责：路由跳转）
        if (!jwt) {
            navigate("/login");
            return;
        }
        axios.get("/api/auth/vali_online_status")
            .then(() => logger.info("vali online status success"))
            .catch((err) => {
                if (isAxiosError(err) && err.status && err.status >= 400 && err.status < 500) {
                    logger.warn("token expire")
                    logout()
                    navigate("/login")
                }
            })
    }, [jwt])

    const { data: sessions } = useSessionQuery(userId!)

    useEffect(() => {
        if (jwt && sessions) {
            messageService.start(jwt, Array.from(sessions.values(), (v) => v.id))
        }
    }, [jwt, sessions])

    return (<Outlet />)
}