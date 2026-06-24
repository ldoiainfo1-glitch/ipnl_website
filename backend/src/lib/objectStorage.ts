import { randomUUID } from 'crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface StorageConfig {
  provider: 'placeholder' | 's3';
  bucket: string;
  region: string;
  baseUrl: string;
  accessKey?: string;
  secretKey?: string;
}

let s3Client: S3Client | null = null;
let s3LogosClient: S3Client | null = null;

function getConfig(): StorageConfig {
  const bucket = (process.env.AWS_S3_BUCKET || 'ipnl-bucket').trim();
  const region = (process.env.AWS_REGION || 'us-east-1').trim();
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const provider: 'placeholder' | 's3' = accessKey && secretKey ? 's3' : 'placeholder';
  const baseUrl =
    provider === 's3'
      ? `https://${bucket}.s3.${region}.amazonaws.com`
      : `https://placeholder.local/${bucket}`;
  return { provider, bucket, region, baseUrl, accessKey, secretKey };
}

function getLogosConfig(): StorageConfig {
  const bucket = (process.env.AWS_S3_LOGOS_BUCKET || 'ipnl-logos').trim();
  const region = (process.env.AWS_S3_REGION || 'ap-south-1').trim();
  const accessKey = process.env.AWS_S3_LOGOS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_S3_LOGOS_SECRET_ACCESS_KEY?.trim();
  const provider: 'placeholder' | 's3' = accessKey && secretKey ? 's3' : 'placeholder';
  const baseUrl =
    provider === 's3'
      ? `https://${bucket}.s3.${region}.amazonaws.com`
      : `https://placeholder.local/${bucket}`;
  console.log('[S3 LOGOS CONFIG]', { provider, bucket, region, hasAccessKey: !!accessKey, hasSecretKey: !!secretKey });
  return { provider, bucket, region, baseUrl, accessKey, secretKey };
}

function getS3Client(config: StorageConfig): S3Client | null {
  if (config.provider !== 's3' || !config.accessKey || !config.secretKey) return null;
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
  return s3Client;
}

function getS3LogosClient(config: StorageConfig): S3Client | null {
  if (config.provider !== 's3' || !config.accessKey || !config.secretKey) return null;
  if (s3LogosClient) return s3LogosClient;
  s3LogosClient = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
  return s3LogosClient;
}

export function createObjectUrl(path: string): string {
  const config = getConfig();
  const cleanPath = path.replace(/^\/+/, '');
  return `${config.baseUrl}/${cleanPath}`;
}

export function createLogoUrl(path: string): string {
  const config = getLogosConfig();
  const cleanPath = path.replace(/^\/+/, '');
  return `${config.baseUrl}/${cleanPath}`;
}

function getObjectKeyFromUrl(urlOrPath: string): string {
  if (!/^https?:\/\//i.test(urlOrPath)) return urlOrPath.replace(/^\/+/, '');
  try {
    const url = new URL(urlOrPath);
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    return urlOrPath.replace(/^\/+/, '');
  }
}

export function createUploadPath(namespace: string, userId: string, extension = 'bin'): string {
  const safeNamespace = namespace.replace(/[^a-zA-Z0-9/_-]/g, '');
  const safeExt = extension.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  return `${safeNamespace}/${userId}/${Date.now()}-${randomUUID()}.${safeExt}`;
}

export function getStorageInfo() {
  const config = getConfig();
  return {
    provider: config.provider,
    bucket: config.bucket,
    region: config.region,
    baseUrl: config.baseUrl,
  };
}

interface UploadObjectInput {
  path: string;
  body: Buffer;
  contentType: string;
}

export async function uploadObject(
  input: UploadObjectInput,
): Promise<{ url: string; provider: 'placeholder' | 's3' }> {
  const config = getConfig();
  const cleanPath = input.path.replace(/^\/+/, '');
  const url = createObjectUrl(cleanPath);
  if (config.provider === 'placeholder') return { url, provider: 'placeholder' };
  const client = getS3Client(config);
  if (!client) return { url, provider: 'placeholder' };
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: cleanPath,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return { url, provider: 's3' };
}

export async function uploadLogoObject(
  input: UploadObjectInput,
): Promise<{ url: string; provider: 'placeholder' | 's3' }> {
  const config = getLogosConfig();
  const cleanPath = input.path.replace(/^\/+/, '');
  const url = createLogoUrl(cleanPath);
  console.log('[UPLOAD LOGO] Starting upload:', { cleanPath, contentType: input.contentType, provider: config.provider });
  if (config.provider === 'placeholder') {
    console.log('[UPLOAD LOGO] Using placeholder mode (missing credentials)');
    return { url, provider: 'placeholder' };
  }
  const client = getS3LogosClient(config);
  if (!client) {
    console.log('[UPLOAD LOGO] Failed to create S3 client');
    return { url, provider: 'placeholder' };
  }
  try {
    console.log('[UPLOAD LOGO] Sending to S3:', { bucket: config.bucket, key: cleanPath, region: config.region });
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: cleanPath,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    console.log('[UPLOAD LOGO] ✓ Successfully uploaded to S3');
    return { url, provider: 's3' };
  } catch (error: any) {
    console.error('[UPLOAD LOGO] ✗ S3 upload failed:', error.message);
    console.error('[UPLOAD LOGO] Error details:', { code: error.Code, statusCode: error.$metadata?.httpStatusCode });
    throw error;
  }
}

export async function createPrivateObjectViewUrl(
  urlOrPath: string,
  expiresInSeconds = 900,
): Promise<string> {
  const config = getConfig();
  if (config.provider !== 's3') return urlOrPath;
  const client = getS3Client(config);
  if (!client) return urlOrPath;
  const key = getObjectKeyFromUrl(urlOrPath);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function createPrivateLogoObjectViewUrl(
  urlOrPath: string,
  expiresInSeconds = 60 * 60 * 24,
): Promise<string> {
  const urlConfig = parseS3UrlConfig(urlOrPath);
  const config = urlConfig ?? getLogosConfig();
  if (config.provider !== 's3') return urlOrPath;
  const client = getS3LogosClient(config);
  if (!client) return urlOrPath;
  const key = getObjectKeyFromUrl(urlOrPath);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

function parseS3UrlConfig(urlOrPath: string): StorageConfig | null {
  if (!/^https?:\/\//i.test(urlOrPath)) return null;

  try {
    const url = new URL(urlOrPath);
    const match = url.hostname.match(/^(.+?)\.s3[.-]([^.]+)\.amazonaws\.com$/i);
    if (!match) return null;

    return {
      provider: 's3',
      bucket: match[1],
      region: match[2],
      baseUrl: `https://${match[1]}.s3.${match[2]}.amazonaws.com`,
      accessKey: process.env.AWS_S3_LOGOS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_S3_LOGOS_SECRET_ACCESS_KEY,
    };
  } catch {
    return null;
  }
}