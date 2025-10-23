import 'dotenv/config';

export type AuthMode = 'ticket' | 'bearer';

export const cfg = {
  alfrescoBaseUrl: required('ALFRESCO_BASE_URL'),
  authMode: (process.env.AUTH_MODE ?? 'ticket') as AuthMode,
  username: process.env.ALFRESCO_USERNAME,
  password: process.env.ALFRESCO_PASSWORD,
  bearer: process.env.ALFRESCO_BEARER_TOKEN,
  targetFolderId: required('TARGET_FOLDER_ID'),
  e2bApiKey: required('E2B_API_KEY')
};

function required(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`Missing ${k}`);
  return v;
}
