export interface NycTimeResponse {
  utc_datetime: string;
  timezone: string;
}

export const fetchNycTime = async (): Promise<NycTimeResponse> => {
  const response = await fetch('/api/nyc-time');
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }
  return response.json();
};
