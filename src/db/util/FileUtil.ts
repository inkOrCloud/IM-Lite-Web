import axios, { isAxiosError } from "axios";
import { db } from "../db";
import type FileInfo from "../../entity/file/FileInfo";
import pino from "pino";
import qs from "qs"
import { createSHA512 } from "hash-wasm"
import { uint8ArrayToBase64 } from "binconv"

const logger = pino()
export const CACHE_SIZE = Math.pow(2, 20) * 10

export async function getFileInfo(fileId: string, token?: string) {
    let fileInfo = await db.fileInfo.get(fileId)
    if (!fileInfo) {
        try {
            fileInfo = (await axios.get<FileInfo>(`/api/file/get_file_with_token?fileId=${fileId}&token=${token}`)).data
            db.fileInfo.add(fileInfo)
        } catch (err) {
            if (isAxiosError(err)) {
                logger.warn("get file info failed, axios err = " + err.message)
            }
        }
    } else {
        (async () => {
            try {
                const cloudFileInfo = (await axios.get<FileInfo>(`/api/file/get_file_with_token?fileId=${fileId}&token=${token}`)).data
                db.fileInfo.update(fileInfo.id, cloudFileInfo)
            } catch (err) {
                if (isAxiosError(err)) {
                    logger.warn("get file info from server failed, axios err = " + err.message)
                }
            }
        })()
    }
    return fileInfo;
}

export async function getFileContent(fileId: string, token?: string) {
    const fileInfo = await getFileInfo(fileId, token)
    if (!fileInfo) {
        logger.warn("get file info failed")
        return
    }
    if (fileInfo.size <= CACHE_SIZE) {
        const fileContent = await db.fileContent.get(fileId)
        if (fileContent && fileContent.hash === fileInfo.hash) {
            return fileContent.content
        }
    }
    let fileURL = ""
    try {
        fileURL = (await axios.get(`/api/file/get_read_url_with_token?fileId=${fileId}&token=${token}`)).data
    } catch (err) {
        if (isAxiosError(err)) {
            logger.warn("get file url failed, axios err = " + err.message)
        }
        return
    }
    let file: File
    try {
        const res = (await axios.get<ArrayBuffer>(fileURL, {
            responseType: "arraybuffer",
            headers: {
                "Authorization": undefined
            }
        }))
        file = new File([res.data], fileInfo.name ? fileInfo.name : "", {type: res.headers["content-type"]})
    } catch (err) {
        if (isAxiosError(err)) {
            logger.warn("downlaod file failed, axios err = " + err.message)
        }
        return
    }
    if (file.size <= CACHE_SIZE) {
        (async () => {
            db.fileContent.put({ id: fileId, content: file, hash: fileInfo.hash })
        }
        )()
    }
    return file
}

export async function getFileUrl(fileId: string, token?: string) {
    try {
        return (await axios.get(`/api/file/get_read_url_with_token?fileId=${fileId}&token=${token}`)).data
    } catch (err) {
        if (isAxiosError(err)) {
            logger.warn("get file url failed, axios err = " + err.message)
        }
        return
    }
}

async function createUploadTask(name: string, size: number, hash: string, withToken?: boolean) {
    interface Task {
        file?: FileInfo;
        isExisting?: boolean;
        uploadUrl?: string;
    }
    const { data: task } = await axios.post<Task>("/api/file/create_upload_task",
        qs.stringify({
            name,
            size,
            hash,
            withToken
        })
        ,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
    return task

}

async function fileSHA512(file: File) {
    const sha512 = await createSHA512();
    let offset = 0;
    const sliceSize = Math.pow(2, 20) * 10;
    while (offset < file.size) {
        const slice = file.slice(offset, offset + sliceSize);
        const arr = new Uint8Array(await slice.arrayBuffer())
        sha512.update(arr);
        offset += sliceSize;
    }
    return sha512.digest("binary");
}

export async function uploadFile(file: File, withToken?: boolean) {
    const base64 = uint8ArrayToBase64(await fileSHA512(file))
    const task = await createUploadTask(file.name, file.size, base64, withToken)
    if (task?.isExisting) {
        return task.file
    }
    if (!task?.uploadUrl) {
        logger.error("uploadFile: task.uploadUrl is null")
        throw new Error("uploadFile: task.uploadUrl is null")
    }
    await axios.put(task.uploadUrl, file, {
        headers: {
            "Content-Type": file.type,
            "Authorization": undefined
        }
    })
    const fileInfo = (await axios.get<FileInfo>("/api/file/finish_upload_task?fileId=" + task.file?.id)).data
    if(file.size <= CACHE_SIZE) {
        db.fileContent.put({ id: fileInfo.id, content: file, hash: base64 })
    }
    return fileInfo
}