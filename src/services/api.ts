export interface NycTimeResponse {
  utc_datetime: string;
  timezone: string;
}

export const fetchNycTime = async (): Promise<NycTimeResponse> => {
  const sharedSecret = import.meta.env.VITE_NYC_TIME_SECRET || (import.meta.env.DEV ? 'development-nyc-time-secret' : '');
  const response = await fetch('/api/nyc-time', {
    headers: {
      'x-nyc-time-secret': sharedSecret,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }
  return response.json();
};
