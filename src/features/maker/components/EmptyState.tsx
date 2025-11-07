import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: React.ElementType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
    title = "No Data", 
    message = "There is no data to display at the moment.",
    icon: Icon = DocumentIcon 
}) => {
    return (
        <div className="text-center py-16 px-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
        </div>
    );
};

export default EmptyState;