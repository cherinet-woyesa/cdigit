import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StatCardProps {
    title: string;
    value: number;
    icon: any;
    bgColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon, 
    bgColor = "bg-gradient-to-br from-fuchsia-600 to-purple-600",
    trend = 'neutral',
    trendValue = 0
}) => {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return '↗';
            case 'down':
                return '↘';
            default:
                return '→';
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-300';
            case 'down':
                return 'text-red-300';
            default:
                return 'text-gray-300';
        }
    };

    return (
        <div
            className={`${bgColor} rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-white/80 font-medium mb-1">{title}</p>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-white">{value}</p>
                        {trend !== 'neutral' && (
                            <span className={`text-sm font-semibold ${getTrendColor()} flex items-center`}>
                                {getTrendIcon()} {trendValue}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                    <FontAwesomeIcon 
                        icon={icon} 
                        className="text-white text-xl" 
                    />
                </div>
            </div>
            
            {/* Progress bar for visual indication */}
            <div className="mt-3 w-full bg-white/20 rounded-full h-1">
                <div 
                    className="bg-white h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((value / 50) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

export default StatCard;