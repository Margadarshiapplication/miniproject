import { useQuery } from "@tanstack/react-query";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  feels_like: number;
  city: string;
}

// Using Open-Meteo (free, no API key needed)
export const useWeather = (lat?: number, lon?: number) => {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: async (): Promise<WeatherData> => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      );
      if (!res.ok) throw new Error("Weather fetch failed");
      const data = await res.json();
      const current = data.current;

      const weatherCodeMap: Record<number, { desc: string; icon: string }> = {
        0: { desc: "Clear sky", icon: "☀️" },
        1: { desc: "Mainly clear", icon: "🌤️" },
        2: { desc: "Partly cloudy", icon: "⛅" },
        3: { desc: "Overcast", icon: "☁️" },
        45: { desc: "Foggy", icon: "🌫️" },
        48: { desc: "Rime fog", icon: "🌫️" },
        51: { desc: "Light drizzle", icon: "🌦️" },
        53: { desc: "Moderate drizzle", icon: "🌦️" },
        55: { desc: "Dense drizzle", icon: "🌧️" },
        61: { desc: "Slight rain", icon: "🌧️" },
        63: { desc: "Moderate rain", icon: "🌧️" },
        65: { desc: "Heavy rain", icon: "🌧️" },
        71: { desc: "Slight snow", icon: "🌨️" },
        73: { desc: "Moderate snow", icon: "🌨️" },
        75: { desc: "Heavy snow", icon: "❄️" },
        80: { desc: "Slight showers", icon: "🌦️" },
        81: { desc: "Moderate showers", icon: "🌧️" },
        82: { desc: "Violent showers", icon: "⛈️" },
        95: { desc: "Thunderstorm", icon: "⛈️" },
      };

      const weather = weatherCodeMap[current.weather_code] || { desc: "Unknown", icon: "🌡️" };

      return {
        temperature: Math.round(current.temperature_2m),
        description: weather.desc,
        icon: weather.icon,
        humidity: current.relative_humidity_2m,
        wind_speed: Math.round(current.wind_speed_10m),
        feels_like: Math.round(current.apparent_temperature),
        city: "",
      };
    },
    enabled: lat != null && lon != null,
    staleTime: 30 * 60 * 1000, // 30 min
  });
};

// Destination coordinates lookup
export const destinationCoords: Record<string, { lat: number; lon: number }> = {
  goa: { lat: 15.2993, lon: 74.124 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  manali: { lat: 32.2432, lon: 77.1892 },
  varanasi: { lat: 25.3176, lon: 82.9739 },
  kerala: { lat: 10.8505, lon: 76.2711 },
  darjeeling: { lat: 27.0360, lon: 88.2627 },
  amritsar: { lat: 31.6340, lon: 74.8723 },
  andaman: { lat: 11.7401, lon: 92.6586 },
  agra: { lat: 27.1767, lon: 78.0081 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  rishikesh: { lat: 30.0869, lon: 78.2676 },
  leh: { lat: 34.1526, lon: 77.5771 },
  shimla: { lat: 31.1048, lon: 77.1734 },
  ooty: { lat: 11.4102, lon: 76.6950 },
  munnar: { lat: 10.0889, lon: 77.0595 },
};
