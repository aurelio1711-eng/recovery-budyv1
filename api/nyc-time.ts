const BASE_URL = 'https://api.api-ninjas.com/v1/timezone';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on the server' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}?city=New%20York&country=US`, {
        headers: { 'X-Api-Key': apiKey },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json() as { message?: string };
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Failed to fetch NYC time' });
    }

    return res.status(200).json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API route /api/nyc-time error:', error);
    if ((error as any)?.name === 'AbortError') {
      return res.status(504).json({ error: 'Outbound request to API Ninjas timed out' });
    }
    return res.status(500).json({ error: 'Server error while fetching NYC time' });
  }
}
