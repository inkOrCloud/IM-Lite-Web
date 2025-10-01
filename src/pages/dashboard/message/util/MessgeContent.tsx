import { Card, Image } from "antd";
import type Message from "../../../../entity/message/Message";
import AudioPlayer from "./AudioPlayer";
import type FileInfo from "../../../../entity/file/FileInfo";
import ReactPlayer from "react-player";
import React from "react";
import { CACHE_SIZE, getFileContent, getFileInfo, getFileUrl } from "../../../../db/util/FileUtil";
import { useRequest } from "ahooks";
import pino from "pino";

const logger = pino({ name: 'MessageContent' })


export const MessageContent: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => {


    const {data:file} = useRequest(async () => {
        const file: {info?: FileInfo, fileObjUrl?: string, url?:string} = {}
        if (message.fileId) {
            file.info = await getFileInfo(message.fileId)
            if (file.info) {
                if(file.info.size <= CACHE_SIZE) {
                    const fileContent = await getFileContent(message.fileId)
                    if (fileContent) {
                        file.fileObjUrl = URL.createObjectURL(fileContent)
                    }else{
                        file.url = await getFileUrl(message.fileId)
                    }
                }else{
                    file.url = await getFileUrl(message.fileId) 
                }
            }else{
                logger.warn(`FileInfo not found for fileId: ${message.fileId}`) 
            }
        }
        return file
    }) 


    const baseCardClass = `max-w-full ${isOwn ? 'bg-blue-50' : 'bg-gray-50'}`;
    switch (message.type) {
        case 'TEXT':
            return (
                <Card size="small" className={baseCardClass}>
                    <div className="break-words whitespace-pre-wrap">{message.content}</div>
                    {message.createTime && (
                        <div className="text-xs text-gray-400 mt-1 text-right">
                            {new Date(message.createTime * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </Card>
            );
        case 'IMAGE':
            return (
                <Card size="small" className={baseCardClass}>
                    <Image 
                        src={file?.fileObjUrl?file.fileObjUrl:file?.url} 
                        alt="图片消息"
                        className="max-w-full max-h-64 object-contain"
                    />
                    {message.createTime && (
                        <div className="text-xs text-gray-400 mt-1 text-right">
                            {new Date(message.createTime * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </Card>
            );
        case 'AUDIO':
            return (
                <Card size="small" className={baseCardClass}>
                    <AudioPlayer src={file?.fileObjUrl?file.fileObjUrl:file?.url} filename={file?.info?.name}/>
                    {message.createTime && (
                        <div className="text-xs text-gray-400 mt-1 text-right">
                            {new Date(message.createTime * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </Card>
            );
        case 'VIDEO':
            return (
                <Card size="small" className={baseCardClass}>
                    <ReactPlayer 
                        src={file?.fileObjUrl?file.fileObjUrl:file?.url}
                        controls 
                        width="100%"
                        height="200px"
                    />
                    {message.createTime && (
                        <div className="text-xs text-gray-400 mt-1 text-right">
                            {new Date(message.createTime * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </Card>
            );
        default:
            return (
                <Card size="small" className={baseCardClass}>
                    <div className="text-gray-500">未知的消息类型</div>
                </Card>
            );
    }
};