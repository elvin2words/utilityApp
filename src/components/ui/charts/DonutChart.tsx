// components/ui/charts/DonutChart.tsx

import { useMemo } from 'react';

type DonutChartProps = {
  data: {
    name: string;
    value: number;
  }[];
  colors?: string[];
  className?: string;
};

export function DonutChart({
  data,
  colors = ['primary', 'secondary', 'critical', 'moderate', 'resolved'],
  className
}: DonutChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  // Calculate the SVG paths for the donut segments
  const segments = useMemo(() => {
    if (!data.length) return [];
    
    let startAngle = 0;
    return data.map((item, index) => {
      const percentage = total > 0 ? item.value / total : 0;
      const angle = percentage * 360;
      
      // Calculate the SVG arc path
      const endAngle = startAngle + angle;
      
      // Calculate the SVG arc path coordinates
      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
      
      // Determine if the arc is more than 180 degrees
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      // Create the SVG path
      const path = `
        M 50 50
        L ${x1} ${y1}
        A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      
      const pathData = {
        path,
        color: colors[index % colors.length],
        percentage
      };
      
      startAngle = endAngle;
      return pathData;
    });
  }, [data, total, colors]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* Draw background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="none"
          fill="#f3f4f6"
        />
        
        {/* Draw each segment */}
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={`hsl(var(--${segment.color}))`}
            stroke="white"
            strokeWidth="1"
          />
        ))}
        
        {/* Draw center circle for donut hole */}
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="none"
          fill="white"
        />
      </svg>
    </div>
  );
}
