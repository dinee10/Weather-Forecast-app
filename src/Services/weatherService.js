import { DateTime } from 'luxon';

const API_KEY = 'ad5ec5f0f506a226043e21d95e932cca'
const BASE_URL = 'https://api.openweathermap.org/data/2.5/'


const getWeatherData =  async (infoType, searchParams) => {
    const url = new URL (BASE_URL + infoType)
    url.search = new URLSearchParams({...searchParams, appid: API_KEY});
   
    const res = await fetch(url);
    return await res.json();
};

const iconUrlFromCode = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

const formatToLocalTime = (secs, offset, format = "cccc, dd LLL yyyy' | Local time: ' hh:mm a") => DateTime.fromSeconds(secs + offset, {zone: 'utc'}).toFormat(format);

const formatCurrent = (data) => {
    const { coord: {lon, lat}, main: {temp, feels_like, temp_min, temp_max, humidity},
    name,
    dt,
    sys: {country, sunsrise, sunset},
    weather,
    wind: {speed},
    timezone,
   } = data;

   const {main: details, icon} = weather[0];
   const formattedLocalTime = formatToLocalTime(dt, timezone);
   return{
    temp, 
    feels_like, 
    temp_min, 
    temp_max, 
    humidity, 
    name, 
    country, 
    sunsrise: formatToLocalTime(sunsrise, timezone, 'hh:mm a'),
    sunset: formatToLocalTime(sunset, timezone, 'hh:mm a'),
    speed,
    details,
    icon: iconUrlFromCode(icon),
    formattedLocalTime,
    dt,
    timezone,
    lon,
    lat,
   };
};

const formatForcastWeather = (secs, offset, data) => {
    console.log(secs);
    //hourly
    const hourly = data
        .filter(f => f.dt > secs)
        .map((f) => ({
            temp: f.main.temp,
            title: formatToLocalTime(f.dt, offset, 'hh:mm a'),
            icon: iconUrlFromCode(f.weather[0].icon),
            date: f.dt_txt,
    }))
    .slice(0, 5);

    //daily
    const daily = data.filter((f) => f.dt_txt.slice(-8) === "00:00:00").map(f => ({
        temp: f.main.temp,
        title: formatToLocalTime(f.dt, offset, 'ccc'),
        icon: iconUrlFromCode(f.weather[0].icon),
        date: f.dt_txt,
    }))

    return {hourly, daily};
}

const getFormattedWeatherData = async (searchParams) => {
    const formattedCurrentWeather = await getWeatherData('weather', searchParams)
    .then(formatCurrent);

    const {dt, lon, lat, timezone} = formattedCurrentWeather

    const formattedForcastWeather = await getWeatherData('forecast', {lon, lat, 
        units: searchParams.units}).then((d) => formatForcastWeather(dt, timezone, d.list))
    return {...formattedCurrentWeather, ...formattedForcastWeather};
}

export default getFormattedWeatherData;