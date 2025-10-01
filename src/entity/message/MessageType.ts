export const MessageType = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
    FILE: 'FILE',
    OPRERATION_DELETE: 'OPRERATION_DELETE',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType]