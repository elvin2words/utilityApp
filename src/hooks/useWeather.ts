// hooks/useWeather.ts

import React, { useEffect, useState } from 'react';
import { Coordinates } from './useGeolocationTracking';

import { OPENWEATHER_API_KEY } from '@/src/lib/constants';


export function getWeather(location: Coordinates | null) {
  const [weather, setWeather] = useState<{ temperature: string; condition: string } | null>(null);
 
  useEffect(() => {
    async function fetchWeather() {
      if (!location) return;
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${WEATHER_API_KEY}`
        );
        const json = await res.json();
        setWeather({ temperature: `${Math.round(json.main.temp)}°C`, condition: json.weather[0].main });
        
        // const desc = json.weather?.[0]?.main?.toLowerCase();
        // const temp = json.main?.temp;
        // if (desc.includes('storm') || desc.includes('thunderstorm')) return 'storm';
        // if (desc.includes('rain') || desc.includes('drizzle')) return 'rain';
        // if (temp >= 35) return 'heat';
        // if (desc.includes('clear') || desc.includes('sunny')) return 'clear';

      } catch {
        setWeather({ temperature: 'N/A', condition: 'Unavailable' });
      }
    }
    fetchWeather();
  }, [location]);

  return weather;
}

// prolly implemem=nt server side to get weather impacts of areas with fault jobs
export async function fetchWeatherImpact(coords: Coordinates): Promise<{
  condition: string;
  impact: boolean;
}> {
  // Simulate weather based on lat/lng mod
  const condition =
    coords.latitude % 2 < 1
      ? 'Clear'
      : coords.longitude % 2 < 1
      ? 'Rain'
      : 'Storm';

  const impact = ['Rain', 'Storm'].includes(condition);

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 200));

  return { condition, impact };
}