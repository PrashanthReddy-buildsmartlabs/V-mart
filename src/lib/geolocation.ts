/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

export function calculateDeliveryFee(distanceKm: number): { fee: number; valid: boolean } {
  if (distanceKm > 5.0) {
    return { fee: 0, valid: false }; // Out of Delivery Zone
  }
  if (distanceKm <= 2.0) {
    return { fee: 30, valid: true };
  }
  // Linearly scale between 2km and 5km, from 30 Rs to 70 Rs
  // Formula: 30 + ((distance - 2) / 3) * 40
  const fee = 30 + ((distanceKm - 2) / 3) * 40;
  return { fee: Math.round(fee), valid: true };
}
