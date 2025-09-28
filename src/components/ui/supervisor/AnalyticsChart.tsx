// src/components/supervisor/AnalyticsChart.tsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Open", value: 10 },
  { name: "In-Progress", value: 5 },
  { name: "Closed", value: 15 },
];

const COLORS = ["#EF4444", "#F59E0B", "#10B981"];

const AnalyticsChart: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow p-4 h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={80} label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
