export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor(durationSeconds / 60) - hours * 60;
  const seconds = durationSeconds - (minutes * 60 + hours * 3600);

  let s = "";
  switch (hours) {
    case 0:
      break;
    case 1:
      s += hours + " hour, ";
      break;
    default:
      s += hours + " hours, ";
      break;
  }
  switch (minutes) {
    case 0:
      break;
    case 1:
      s += minutes + " minute, ";
      break;
    default:
      s += minutes + " minutes, ";
      break;
  }

  if (seconds == 1) {
    s += seconds + " second";
  } else {
    s += seconds + " seconds";
  }
  return s;
}

export function formatShortDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor(durationSeconds / 60) - hours * 60;
  const seconds = durationSeconds - (minutes * 60 + hours * 3600);

  let s = "";
  switch (hours) {
    case 0:
      break;
    default:
      s += hours + "h, ";
      break;
  }
  switch (minutes) {
    case 0:
      break;
    default:
      s += minutes + "m, ";
      break;
  }

  s += seconds + "s";

  return s;
}

export function getDurationSeconds({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}): number {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
}
