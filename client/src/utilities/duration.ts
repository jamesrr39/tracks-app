
// TODO does this belong in domain package?

export function getDurationString(startTime: Date, endTime: Date): string {
  if (!endTime) {
    return '???';
  }
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

  return formatDuration(durationSeconds);
}

export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / (3600));
  const minutes = (Math.floor(durationSeconds / 60)) - (hours * 60);
  const seconds = durationSeconds - (minutes * 60 + hours * 3600);

  let s = '';
  if (hours !== 0) {
    s += hours + 'h ';
  }
  if (minutes !== 0) {
    s += minutes + 'm ';
  }
  s += seconds + 's';

  return s;
}
