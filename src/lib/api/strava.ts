const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

async function stravaFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
  return res.json();
}

export async function getAthleteActivities(accessToken: string, page: number = 1) {
  return stravaFetch(`/athlete/activities?page=${page}&per_page=30`, accessToken);
}

export async function getActivityById(accessToken: string, id: number) {
  return stravaFetch(`/activities/${id}`, accessToken);
}
