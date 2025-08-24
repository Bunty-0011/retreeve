import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
  } from "recharts";
  
  export default function ProgressChart({ testHistory }) {
    // Expect: [{ attempt: 1, score: 20 }, { attempt: 2, score: 40 }, ...]
  
    // --- Compute simple trend line (linear regression) ---
    const n = testHistory.length;
    let trendData = [];
    if (n > 1) {
      const sumX = testHistory.reduce((acc, d) => acc + d.attempt, 0);
      const sumY = testHistory.reduce((acc, d) => acc + d.score, 0);
      const sumXY = testHistory.reduce((acc, d) => acc + d.attempt * d.score, 0);
      const sumX2 = testHistory.reduce((acc, d) => acc + d.attempt * d.attempt, 0);
  
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
      const intercept = sumY / n - slope * (sumX / n);
  
      trendData = testHistory.map((d) => ({
        attempt: d.attempt,
        trend: slope * d.attempt + intercept,
      }));
    }
  
    return (
      <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Progress Over Attempts
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={testHistory}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
  
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="attempt" tick={{ fill: "#374151" }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#374151" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
              }}
            />
  
            {/* Filled curve area */}
            <Area
              type="monotone"
              dataKey="score"
              stroke={false}
              fill="url(#colorScore)"
            />
  
            {/* Actual scores */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, stroke: "#2563eb", strokeWidth: 2, fill: "white" }}
              activeDot={{ r: 7 }}
            />
  
            {/* Trend line (average progress) */}
            {trendData.length > 0 && (
              <Line
                type="monotone"
                data={trendData}
                dataKey="trend"
                stroke="#10b981" // teal/green for trend
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  