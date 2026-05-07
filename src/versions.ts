import { HttpClient } from '@actions/http-client';

interface ReleaseResponse {
  tag_name: string;
}

export async function resolveVersion(input: string, token: string): Promise<string> {
  if (input === 'latest') {
    const release = await fetchLatestRelease(token);
    return stripPrefix(release.tag_name);
  }
  return stripPrefix(input);
}

async function fetchLatestRelease(token: string): Promise<ReleaseResponse> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const client = new HttpClient('setup-pluggy');
  const url = 'https://api.github.com/repos/pluggy-sh/pluggy/releases/latest';
  const res = await client.getJson<ReleaseResponse>(url, headers);

  if (!res.result) {
    throw new Error(`Failed to fetch latest release: HTTP ${res.statusCode}`);
  }
  return res.result;
}

function stripPrefix(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version;
}
