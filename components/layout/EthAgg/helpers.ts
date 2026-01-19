export const getGradientColor = (percentage: number, theme?: "dark" | "light") => {
  const colors = [
    { percent: 0, color: theme === "dark" ? "#1df7ef" : "#00cfc5" },   // accent-turquoise
    { percent: 20, color: theme === "dark" ? "#76EDA0" : "#18a957" },  // green/positive
    { percent: 50, color: theme === "dark" ? "#ffdf27" : "#e5b300" },  // accent-yellow
    { percent: 70, color: theme === "dark" ? "#FF9B47" : "#e07020" },  // orange
    { percent: 100, color: theme === "dark" ? "#fe5468" : "#e83c52" }, // accent-red
  ];

  let lowerBound = colors[0];
  let upperBound = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (
      percentage >= colors[i].percent &&
      percentage <= colors[i + 1].percent
    ) {
      lowerBound = colors[i];
      upperBound = colors[i + 1];
      break;
    }
  }

  const percentDiff =
    (percentage - lowerBound.percent) /
    (upperBound.percent - lowerBound.percent);

  const r = Math.floor(
    parseInt(lowerBound.color.substring(1, 3), 16) +
    percentDiff *
    (parseInt(upperBound.color.substring(1, 3), 16) -
      parseInt(lowerBound.color.substring(1, 3), 16)),
  );

  const g = Math.floor(
    parseInt(lowerBound.color.substring(3, 5), 16) +
    percentDiff *
    (parseInt(upperBound.color.substring(3, 5), 16) -
      parseInt(lowerBound.color.substring(3, 5), 16)),
  );

  const b = Math.floor(
    parseInt(lowerBound.color.substring(5, 7), 16) +
    percentDiff *
    (parseInt(upperBound.color.substring(5, 7), 16) -
      parseInt(lowerBound.color.substring(5, 7), 16)),
  );

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};


export const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor((totalSeconds / 3600) % 24);
  return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatUptime = (durationMs: number) => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Calculate years (accounting for leap years)
  const years = Math.floor(totalDays / 365.25);
  const remainingDaysAfterYears = totalDays - Math.floor(years * 365.25);

  // Calculate months (approximate - using 30.44 days per month average)
  const months = Math.floor(remainingDaysAfterYears / 30.44);
  const days = Math.floor(remainingDaysAfterYears - (months * 30.44))-1 > 0 ? Math.floor(remainingDaysAfterYears - (months * 30.44))-1 : 0;


  // Calculate remaining time units
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  const yearStr = years === 1 ? "year" : "years";
  const monthStr = months === 1 ? "month" : "months";
  const dayStr = days === 1 ? "day" : "days";
  const hourStr = hours === 1 ? "hour" : "hours";
  const minuteStr = minutes === 1 ? "minute" : "minutes";
  const secondStr = seconds === 1 ? "second" : "seconds";

  return {
    heading: `${years} ${yearStr}, ${months} ${monthStr}, ${days} ${dayStr}`,
    subheading: `${hours} ${hourStr}, ${minutes} ${minuteStr}, ${seconds} ${secondStr}`
  };
};