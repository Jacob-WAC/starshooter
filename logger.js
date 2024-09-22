// logger.js
export const logger = {
    log: (...args) => {
        console.log('[LOG]', ...args);
    },
    error: (...args) => {
        console.error('[ERROR]', ...args);
    },
    warn: (...args) => {
        console.warn('[WARN]', ...args);
    }
};
