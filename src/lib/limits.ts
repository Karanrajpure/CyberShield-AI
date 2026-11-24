/** Free-plan hourly limits, enforced server-side by counting the user's own rows. */
export const LIMITS = { urlScansPerHour: 20, messageScansPerHour: 10 } as const;
export const MAX_URL_LENGTH = 2048;
export const MAX_MESSAGE_LENGTH = 10000;
export const CHAT_LIMITS = { messagesPerHour: 30, maxMessageLength: 4000, historyTurns: 30 } as const;
export const THREAT_REFRESH_MINUTES = 30;
