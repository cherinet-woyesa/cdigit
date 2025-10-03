// src/components/StatCard.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDoorOpen,
    faSpinner,
    faCheckCircle,
    faUserClock,
    faMoneyBillWave,
    faShuffle,
    faSackDollar,
} from "@fortawesome/free-solid-svg-icons";


/** Stat card */
/** Stat card */
const StatCard = ({
    title,
    value,
    icon,
    bgColor, // default fallback
    textColor, // optional text color
}: {
    title: string;
    value: number;
    icon: any;
    bgColor?: string;
    textColor?: string;
}) => (
    <div
        className={`${bgColor} rounded-2xl shadow p-5 border border-gray-100 hover:shadow-md transition`}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-200 font-bold">{title}</p>
                <p className={`text-2xl text-gray-200 font-extrabold `}>{value}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
                <FontAwesomeIcon icon={icon} className="text-white" />
            </div>
        </div>
    </div>
);


export default StatCard;