import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// 🎨 Palette premium
const COLORS = ["#f27f0d", "#ffb347", "#ffcc80", "#7d5a37", "#493622"];

const renderPieLabel = ({ name, percent, x, y }) => {
  if (!name || percent < 0.03) return null;
  const shortName = name.length > 20 ? `${name.slice(0, 18)}...` : name;
  return (
    <text
      x={x}
      y={y}
      fill="#FFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
    >
      <tspan x={x} dy="0">
        {shortName}
      </tspan>
      <tspan x={x} dy="1.4em">
        {`${(percent * 100).toFixed(0)}%`}
      </tspan>
    </text>
  );
};

//
// ✨ TOOLTIP MODERNE
//
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-xl bg-[#1a140d]/90 border border-[#493622] px-4 py-3 rounded-2xl shadow-2xl">
        <p className="text-[#cbad90] text-[8px] uppercase tracking-widest mb-1">
          {label || payload[0]?.name}
        </p>

        {payload.map((entry, index) => (
          <p key={index} className="text-white text-sm font-bold">
            {entry.name} :
            <span className="text-primary ml-2">
              {entry.value?.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

//
// 🔥 PIE CHART PRO
//
export const RechartsPieChart = ({ data = [], isLoading }) => {
  if (isLoading) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={105}
          innerRadius={60} // 👈 effet donut
          paddingAngle={4}
          isAnimationActive
          animationDuration={800}
          labelLine={false}
          label={renderPieLabel}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) =>
            value.length > 24 ? `${value.slice(0, 22)}...` : value
          }
          wrapperStyle={{ marginTop: 10 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

//
// 📊 BAR CHART PRO
//
export const RechartsBarChartStats = ({ data = [], isLoading }) => {
  if (isLoading) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3a2d1d" />

        <XAxis
          dataKey="hour"
          tick={{ fill: "#cbad90", fontSize: 11 }}
          axisLine={false}
          minTickGap={10}
        />

        <YAxis 
          tickFormatter={(value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value;
          }}
          tick={{ fill: "#cbad90", fontSize: 11 }} 
          axisLine={false} 
        />

        <Tooltip content={<CustomTooltip />} />

        <Bar
          dataKey="count"
          radius={[10, 10, 0, 0]}
          fill="#f27f0d"
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

//
// 📈 AREA CHART PRO (UPGRADE)
//
export const RechartsAreaChart = ({ data = [], isLoading }) => {
  if (isLoading) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSingle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f27f0d" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#f27f0d" stopOpacity={0} />
          </linearGradient>

          <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Removed CartesianGrid for a cleaner "Apple/Stripe" look */}

        <XAxis
          dataKey="name"
          tick={{ fill: "#cbad90", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          minTickGap={15}
          dy={10}
        />

        {/* HIDDEN Y-AXIS to save 100% of horizontal space for mobile */}
        <YAxis hide={true} domain={['dataMin', 'dataMax * 1.05']} />

        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ stroke: '#cbad90', strokeWidth: 1, strokeDasharray: '4 4' }} 
        />
        
        <Legend 
          layout="horizontal" 
          align="center" 
          verticalAlign="top" 
          wrapperStyle={{ paddingBottom: '30px' }}
          iconType="circle"
        />

        <Area
          type="monotone"
          dataKey="matchUnique"
          name="Match Unique"
          stroke="#f27f0d"
          fill="url(#colorSingle)"
          strokeWidth={4} // Thicker sleek lines
          animationDuration={1200}
          activeDot={{ r: 6, fill: '#f27f0d', stroke: '#fff', strokeWidth: 2 }}
        />

        <Area
          type="monotone"
          dataKey="abonnement"
          name="Abonnement"
          stroke="#3b82f6"
          fill="url(#colorSub)"
          strokeWidth={4}
          animationDuration={1200}
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
