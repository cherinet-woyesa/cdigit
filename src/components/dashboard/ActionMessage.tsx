
import React from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/solid';

export type ActionMessageType = 'success' | 'error' | 'warning' | 'info';

export interface ActionMessage {
    type: ActionMessageType;
    content: string;
}

interface ActionMessageProps {
    message: ActionMessage | null;
    onDismiss?: () => void;
}

const iconMap: Record<ActionMessageType, React.ElementType> = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
};

const colorMap: Record<ActionMessageType, { bg: string; border: string; text: string; icon: string }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-400',
        text: 'text-green-800',
        icon: 'text-green-400',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-800',
        icon: 'text-red-400',
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        text: 'text-yellow-800',
        icon: 'text-yellow-400',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        text: 'text-blue-800',
        icon: 'text-blue-400',
    },
};

const ActionMessageComponent: React.FC<ActionMessageProps> = ({ message, onDismiss }) => {
    if (!message) return null;

    const Icon = iconMap[message.type];
    const colors = colorMap[message.type];

    return (
        <div className={`mb-8 rounded-xl p-4 border-l-4 ${colors.bg} ${colors.border}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${colors.text}`}>{message.content}</p>
                </div>
                {onDismiss && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={onDismiss}
                                className={`inline-flex rounded-md p-1.5 ${colors.text} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.bg}`}
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionMessageComponent;
