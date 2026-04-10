export interface HourlyData {
  time: string;
  temp: number;
  prcp: number;
  rhum: number;
  wspd: number;
  pres: number;
}

export interface WeatherResponse {
  hourly: HourlyData[];
  stats: {
    avgTemp: number;
    maxPrcp: number;
    avgRhum: number;
  };
}
