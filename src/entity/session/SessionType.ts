export const SessionType = {
    PRIVATE: 'PRIVATE',
    GROUP: 'GROUP',
} as const;

export type SessionType = typeof SessionType[keyof typeof SessionType];
