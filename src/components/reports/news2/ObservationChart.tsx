
import { News2Patient } from "./news2Types";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { format, subHours, subDays } from "date-fns";

interface ObservationChartProps {
  patient: News2Patient;
}

export function ObservationChart({ patient }: ObservationChartProps) {
  // In a real app, we would fetch the chart data for this patient
  // For now, we'll generate mock data based on the patient's latest score and trend
  
  const generateMockData = () => {
    const data = [];
    const now = new Date();
    
    // Create data points based on the patient's trend and score
    for (let i = 14; i >= 0; i--) {
      let date;
      let score;
      let respRate, spo2, systolic, pulse, temp;
      
      if (i === 0) {
        // Most recent observation
        date = now;
        score = patient.latestScore;
      } else if (i < 3) {
        // Recent observations (last 24 hours)
        date = subHours(now, i * 8);
        
        if (patient.trend === "up") {
          score = Math.max(0, Math.min(10, patient.latestScore - Math.ceil(i/2)));
        } else if (patient.trend === "down") {
          score = Math.max(0, Math.min(10, patient.latestScore + Math.ceil(i/2)));
        } else {
          score = patient.latestScore;
        }
      } else {
        // Older observations
        date = subDays(now, Math.ceil(i/3));
        
        if (patient.trend === "up") {
          score = Math.max(0, Math.min(10, patient.latestScore - Math.ceil(i/3) - 1));
        } else if (patient.trend === "down") {
          score = Math.max(0, Math.min(10, patient.latestScore + Math.ceil(i/3) - 1));
        } else {
          // Random fluctuation around the current score
          const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          score = Math.max(0, Math.min(10, patient.latestScore + variation));
        }
      }
      
      // Generate associated vital signs based on score
      respRate = score >= 7 ? 22 + Math.floor(Math.random() * 6) : 
                 score >= 5 ? 20 + Math.floor(Math.random() * 4) : 
                 12 + Math.floor(Math.random() * 8);
      
      spo2 = score >= 7 ? 88 + Math.floor(Math.random() * 4) : 
             score >= 5 ? 92 + Math.floor(Math.random() * 3) : 
             95 + Math.floor(Math.random() * 5);
      
      systolic = score >= 7 ? 180 + Math.floor(Math.random() * 20) : 
                 score >= 5 ? 160 + Math.floor(Math.random() * 20) : 
                 110 + Math.floor(Math.random() * 30);
      
      pulse = score >= 7 ? 120 + Math.floor(Math.random() * 15) : 
              score >= 5 ? 100 + Math.floor(Math.random() * 20) : 
              60 + Math.floor(Math.random() * 30);
      
      temp = score >= 7 ? 38.5 + (Math.random() * 0.9) : 
             score >= 5 ? 38.0 + (Math.random() * 0.7) : 
             36.5 + (Math.random() * 1.0);
      
      data.push({
        date,
        formattedDate: format(date, "MMM dd HH:mm"),
        score,
        respRate,
        spo2,
        systolic,
        pulse,
        temp: parseFloat(temp.toFixed(1))
      });
    }
    
    return data;
  };

  const data = generateMockData();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-medium text-lg">NEWS2 Score Trend</h3>
          <p className="text-sm text-gray-500">Showing the last 14 days of observations</p>
        </div>
        
        <div className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" domain={[0, 12]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  name="NEWS2 Score"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="p-4 border-t pt-6">
          <h3 className="font-medium mb-4">Vital Signs Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Respiratory Rate & SpO₂</h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="respRate" 
                      stroke="#10b981" 
                      name="Resp Rate" 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="spo2" 
                      stroke="#6366f1" 
                      name="SpO₂ (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">BP & Pulse</h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" domain={[60, 220]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#ef4444" 
                      name="Systolic BP" 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="pulse" 
                      stroke="#f59e0b" 
                      name="Pulse" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Temperature (°C)</h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                    <YAxis domain={[35, 40]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#d946ef" 
                      name="Temperature" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
