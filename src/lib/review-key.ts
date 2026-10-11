/**
 * CREW REVIEWS — the task identity key.
 *
 * A "task" is a mission's content (title + location), not a specific trip's
 * copy of it. Normalizing both strings into one lowercase key lets reviews
 * aggregate across every traveler and every trip that generated the same
 * task — "Sulaimani tea ceremony @ Departures canteen counter" always maps
 * to the same bucket, so its star average reflects everyone's experience.
 *
 * Shared by the client (chips/dialog) and the API (server-side resolution),
 * so both sides always agree on the grouping.
 */
export function missionKeyOf(title: string, location: string): string {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  return `${norm(title)}|${norm(location)}`;
}
