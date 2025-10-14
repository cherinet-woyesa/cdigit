import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function TrafficTabs({ rows }: { rows: any[] }) {
  const [tab, setTab] = useState<"hour" | "day" | "date" | "month" | "year">(
    "hour"
  );

  const buildData = (formatter: (d: Date) => string) => {
    const map: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const dt = new Date(r.submittedAt);
      const k = formatter(dt);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ label: k, count: map[k] }));
  };

  const hourData = buildData((d) => `${d.getHours()}:00`);
  const dayData = buildData((d) =>
    d.toLocaleDateString(undefined, { weekday: "short" })
  );
  const dateData = buildData((d) => d.toISOString().slice(0, 10));
  const monthData = buildData(
    (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  );
  const yearData = buildData((d) => `${d.getFullYear()}`);

  const activeData =
    tab === "hour"
      ? hourData
      : tab === "day"
      ? dayData
      : tab === "date"
      ? dateData
      : tab === "month"
      ? monthData
      : yearData;

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
        {[
          { key: "hour", label: "Hourly" },
          { key: "day", label: "Daily (Weekdays)" },
          { key: "date", label: "By Date" },
          { key: "month", label: "By Month" },
          { key: "year", label: "By Year" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Animated Chart */}
      <div className="relative h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="absolute w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TrafficTabs;