import React from 'react';
import type { ActionMessage as ActionMessageType } from '@features/maker/types';

interface ActionMessageProps {
  message: ActionMessageType | null;
}

const ActionMessage: React.FC<ActionMessageProps> = ({ message }) => {
  if (!message) return null;

  const getMessageStyles = () => {
    switch (message.type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      case "warning":
        return "bg-yellow-600 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  return (
    <div className={`p-3 mb-4 rounded-lg ${getMessageStyles()}`}>
      {message.content}
    </div>
  );
};

export default ActionMessage;