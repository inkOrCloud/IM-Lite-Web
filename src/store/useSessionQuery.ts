import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type Session from "../entity/session/Session";


const querySessions = async () => {
    const { data: sessions } = await axios.get<Session[]>("/api/session/get_sessions_with_user_info")
    for (let session of sessions) {
        const { data: memberIds } = await axios.get<number[]>(`/api/session/get_user_ids_with_session_id?sessionId=${session.id}`)
        session.memberIds = memberIds
        if (session.type === "GROUP") {
            const { data: group } = await axios.get<number>("/api/session/get_group_id_with_session_id?sessionId=" + session.id)
            session.groupId = group
        }
    }
    return sessions
}

export default function useSessionQuery(userId: number) {
    return useQuery({
        queryKey: ["sessions", userId],
        queryFn: querySessions,
        enabled: !!userId,
        staleTime: Infinity,
        gcTime: Infinity,
    })
}