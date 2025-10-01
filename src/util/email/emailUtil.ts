import axios from "axios";

export async function sendEmailCode(email: string): Promise<{ ok: boolean, message?: string }> {
    interface EmailResponse {
        code?: number;
        email?: string;
        message?: string;
    }
    try {
        const res = await axios.get<EmailResponse>(
            encodeURI("/api/email/query_code?email=" + email)
        );
        switch (res.data.code) {
            case 2:
                return { ok: false, message: "发送验证码过于频繁，请稍后再试" };
            case 1:
                return { ok: false, message: "地址格式错误"}
            case 0:
                return { ok: true}
            default:
                return { ok: false, message: "未知错误"}
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { ok: false, message: "网络错误，请稍后再试" };
        }
    }
    return { ok: false, message: "未知错误" };
}