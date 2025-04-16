
import { News2Patient } from "./news2Types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { format } from "date-fns";

interface ObservationHistoryProps {
  patient: News2Patient;
}

export function ObservationHistory({ patient }: ObservationHistoryProps) {
  // In a real app, we would fetch the observation history for this patient
  // For now, we'll use mock data based on the patient's latest score and trend
  
  const mockObservations = [
    {
      date: new Date(patient.lastUpdated),
      respRate: patient.latestScore > 7 ? 25 : patient.latestScore > 5 ? 21 : 18,
      spo2: patient.latestScore > 7 ? 91 : patient.latestScore > 5 ? 93 : 97, 
      systolic: patient.latestScore > 7 ? 195 : patient.latestScore > 5 ? 175 : 125,
      pulse: patient.latestScore > 7 ? 125 : patient.latestScore > 5 ? 110 : 75,
      conscious: patient.latestScore > 7 ? "V" : "A",
      temp: patient.latestScore > 7 ? 39.1 : patient.latestScore > 5 ? 38.5 : 37.1,
      o2Therapy: patient.latestScore > 5,
      score: patient.latestScore
    },
    {
      date: new Date(new Date(patient.lastUpdated).getTime() - 1000 * 60 * 60 * 8),
      respRate: patient.trend === "up" ? 
        Math.max(10, (patient.latestScore > 7 ? 23 : patient.latestScore > 5 ? 19 : 17)) : 
        patient.trend === "down" ? 
          Math.min(30, (patient.latestScore > 7 ? 27 : patient.latestScore > 5 ? 23 : 19)) :
          (patient.latestScore > 7 ? 24 : patient.latestScore > 5 ? 21 : 18),
      spo2: patient.trend === "up" ? 
        Math.max(90, (patient.latestScore > 7 ? 93 : patient.latestScore > 5 ? 95 : 98)) : 
        patient.trend === "down" ? 
          Math.min(100, (patient.latestScore > 7 ? 90 : patient.latestScore > 5 ? 92 : 96)) :
          (patient.latestScore > 7 ? 91 : patient.latestScore > 5 ? 94 : 97),
      systolic: patient.trend === "up" ? 
        Math.max(90, (patient.latestScore > 7 ? 185 : patient.latestScore > 5 ? 165 : 120)) : 
        patient.trend === "down" ? 
          Math.min(220, (patient.latestScore > 7 ? 200 : patient.latestScore > 5 ? 180 : 130)) :
          (patient.latestScore > 7 ? 190 : patient.latestScore > 5 ? 170 : 125),
      pulse: patient.trend === "up" ? 
        Math.max(40, (patient.latestScore > 7 ? 115 : patient.latestScore > 5 ? 105 : 70)) : 
        patient.trend === "down" ? 
          Math.min(140, (patient.latestScore > 7 ? 130 : patient.latestScore > 5 ? 115 : 80)) :
          (patient.latestScore > 7 ? 120 : patient.latestScore > 5 ? 110 : 75),
      conscious: patient.latestScore > 7 ? (patient.trend === "up" ? "A" : "P") : "A",
      temp: patient.trend === "up" ? 
        Math.max(35, (patient.latestScore > 7 ? 38.5 : patient.latestScore > 5 ? 38.0 : 36.9)) : 
        patient.trend === "down" ? 
          Math.min(41, (patient.latestScore > 7 ? 39.5 : patient.latestScore > 5 ? 38.8 : 37.3)) :
          (patient.latestScore > 7 ? 39.0 : patient.latestScore > 5 ? 38.4 : 37.0),
      o2Therapy: patient.latestScore > 5,
      score: patient.trend === "up" ? patient.latestScore - 1 : 
             patient.trend === "down" ? patient.latestScore + 1 : 
             patient.latestScore
    },
    {
      date: new Date(new Date(patient.lastUpdated).getTime() - 1000 * 60 * 60 * 24),
      respRate: patient.trend === "up" ? 
        Math.max(10, (patient.latestScore > 7 ? 22 : patient.latestScore > 5 ? 18 : 16)) : 
        patient.trend === "down" ? 
          Math.min(30, (patient.latestScore > 7 ? 28 : patient.latestScore > 5 ? 24 : 20)) :
          (patient.latestScore > 7 ? 25 : patient.latestScore > 5 ? 21 : 18),
      spo2: patient.trend === "up" ? 
        Math.max(90, (patient.latestScore > 7 ? 94 : patient.latestScore > 5 ? 96 : 99)) : 
        patient.trend === "down" ? 
          Math.min(100, (patient.latestScore > 7 ? 89 : patient.latestScore > 5 ? 91 : 95)) :
          (patient.latestScore > 7 ? 91 : patient.latestScore > 5 ? 93 : 97),
      systolic: patient.trend === "up" ? 
        Math.max(90, (patient.latestScore > 7 ? 175 : patient.latestScore > 5 ? 155 : 115)) : 
        patient.trend === "down" ? 
          Math.min(220, (patient.latestScore > 7 ? 205 : patient.latestScore > 5 ? 185 : 135)) :
          (patient.latestScore > 7 ? 195 : patient.latestScore > 5 ? 175 : 125),
      pulse: patient.trend === "up" ? 
        Math.max(40, (patient.latestScore > 7 ? 110 : patient.latestScore > 5 ? 100 : 65)) : 
        patient.trend === "down" ? 
          Math.min(140, (patient.latestScore > 7 ? 135 : patient.latestScore > 5 ? 120 : 85)) :
          (patient.latestScore > 7 ? 125 : patient.latestScore > 5 ? 110 : 75),
      conscious: patient.latestScore > 7 ? (patient.trend === "up" ? "A" : "P") : "A",
      temp: patient.trend === "up" ? 
        Math.max(35, (patient.latestScore > 7 ? 38.0 : patient.latestScore > 5 ? 37.5 : 36.8)) : 
        patient.trend === "down" ? 
          Math.min(41, (patient.latestScore > 7 ? 39.8 : patient.latestScore > 5 ? 39.0 : 37.5)) :
          (patient.latestScore > 7 ? 39.1 : patient.latestScore > 5 ? 38.5 : 37.1),
      o2Therapy: patient.latestScore > 7,
      score: patient.trend === "up" ? patient.latestScore - 2 : 
             patient.trend === "down" ? patient.latestScore + 2 : 
             patient.latestScore
    }
  ];

  const getScoreColorClass = (score: number) => {
    if (score >= 7) return "bg-red-100 text-red-700";
    if (score >= 5) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Time</TableHead>
            <TableHead className="text-center">Resp Rate</TableHead>
            <TableHead className="text-center">SpO₂</TableHead>
            <TableHead className="text-center">Systolic BP</TableHead>
            <TableHead className="text-center">Pulse</TableHead>
            <TableHead className="text-center">Conscious</TableHead>
            <TableHead className="text-center">Temp (°C)</TableHead>
            <TableHead className="text-center">O₂ Therapy</TableHead>
            <TableHead className="text-center">NEWS2 Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockObservations.map((obs, index) => (
            <TableRow key={index}>
              <TableCell>{format(obs.date, "dd MMM yyyy HH:mm")}</TableCell>
              <TableCell className="text-center">{obs.respRate}</TableCell>
              <TableCell className="text-center">{obs.spo2}%</TableCell>
              <TableCell className="text-center">{obs.systolic}</TableCell>
              <TableCell className="text-center">{obs.pulse}</TableCell>
              <TableCell className="text-center">{obs.conscious}</TableCell>
              <TableCell className="text-center">{obs.temp.toFixed(1)}</TableCell>
              <TableCell className="text-center">{obs.o2Therapy ? "Yes" : "No"}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <div className={`px-3 py-1 rounded-full ${getScoreColorClass(obs.score)}`}>
                    {obs.score}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
