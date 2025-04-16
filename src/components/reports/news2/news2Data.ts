
import { News2Patient } from "./news2Types";
import { format, subHours, subDays } from "date-fns";

export const getNews2Patients = (): News2Patient[] => {
  const now = new Date();
  
  return [
    {
      id: "PT-1001",
      name: "Sarah Johnson",
      age: 72,
      latestScore: 9,
      trend: "up",
      lastUpdated: format(subHours(now, 2), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1002",
      name: "Robert Miller",
      age: 65,
      latestScore: 8,
      trend: "stable",
      lastUpdated: format(subHours(now, 4), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1003",
      name: "Emma Wilson",
      age: 81,
      latestScore: 6,
      trend: "down",
      lastUpdated: format(subHours(now, 3), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1004",
      name: "James Thompson",
      age: 59,
      latestScore: 7,
      trend: "up",
      lastUpdated: format(subHours(now, 1), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1005",
      name: "Margaret Clark",
      age: 78,
      latestScore: 5,
      trend: "stable",
      lastUpdated: format(subHours(now, 6), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1006",
      name: "David Lewis",
      age: 68,
      latestScore: 4,
      trend: "stable",
      lastUpdated: format(subHours(now, 5), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1007",
      name: "Patricia Walker",
      age: 76,
      latestScore: 3,
      trend: "up",
      lastUpdated: format(subHours(now, 8), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1008",
      name: "George Harris",
      age: 77,
      latestScore: 2,
      trend: "down",
      lastUpdated: format(subHours(now, 10), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1009",
      name: "Elizabeth Young",
      age: 82,
      latestScore: 2,
      trend: "stable",
      lastUpdated: format(subDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1010",
      name: "Thomas Martin",
      age: 71,
      latestScore: 1,
      trend: "stable",
      lastUpdated: format(subDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss")
    },
    {
      id: "PT-1011",
      name: "Jennifer Wright",
      age: 60,
      latestScore: 0,
      trend: "stable",
      lastUpdated: format(subDays(now, 2), "yyyy-MM-dd'T'HH:mm:ss")
    }
  ];
};
