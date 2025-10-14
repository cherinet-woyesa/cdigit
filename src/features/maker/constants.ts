import { 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowPathIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

export const AVG_PROCESS_TIME = "4.2m";

export const METRICS_CONFIG = {
    PENDING_TRANSACTIONS: {
        label: "Pending Transactions",
        color: "fuchsia",
        icon: CurrencyDollarIcon,
        trend: "up"
    },
    COMPLETED_TODAY: {
        label: "Completed Today",
        color: "green",
        icon: ClockIcon,
        trend: "up"
    },
    AVG_PROCESS_TIME: {
        label: "Avg. Process Time",
        color: "blue",
        icon: ArrowPathIcon,
        trend: "down"
    },
    QUEUE_WAITING: {
        label: "Queue Waiting",
        color: "orange",
        icon: UserCircleIcon,
        trend: "neutral"
    }
};