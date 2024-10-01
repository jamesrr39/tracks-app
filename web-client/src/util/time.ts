export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor(durationSeconds / 60) - hours * 60;
  const seconds = durationSeconds - (minutes * 60 + hours * 3600);

  let s = "";
  if (hours !== 0) {
    s += hours + " hours, ";
  }
  if (minutes !== 0) {
    s += minutes + " minutes, ";
  }

  if (seconds == 1) {
    s += seconds + " second";
  } else {
    s += seconds + " seconds";
  }
  return s;
}
