import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

interface Point {
  metric: string;
  value: number;
  letter: string;
}

export function FinalRadar({
  data,
  color,
  dim = false,
}: {
  data: Point[];
  color: string;
  dim?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#D9CFC3" />
        <PolarAngleAxis
          dataKey="letter"
          tick={{ fill: "#6B6566", fontSize: 11, fontFamily: "Cera Pro" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: "#D9CFC3", fontSize: 9 }}
          axisLine={false}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={dim ? 0.15 : 0.35}
          strokeWidth={2}
          isAnimationActive
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
