export function formatDistance(distanceMetres: number): string {
  if (distanceMetres > 1000) {
    return (distanceMetres / 1000).toFixed(2) + "km";
  }

  return distanceMetres.toFixed(0) + "m";
}
