export interface ActionMessage {
    type: 'success' | 'error' | 'info' | 'warning';
    content: string;
    duration?: number; // Optional: auto-dismiss after milliseconds
};