import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

interface StorageConfig {
  provider: 'placeholder' | 's3';
  bucket: string;
  region: string;
  baseUrl: string;
  accessKey?: string;
  secretKey?: string;
}

let s3Client: S3Client | null = null;

function getConfig(): StorageConfig {
  const bucket = process.env.AWS_S3_BUCKET || 'ipnl-bucket';
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  const provider: 'placeholder' | 's3' = accessKey && secretKey ? 's3' : 'placeholder';

  const baseUrl =
    provider === 's3'
      ? `https://${bucket}.s3.${region}.amazonaws.com`
      : `https://placeholder.local/${bucket}`;

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

export function createObjectUrl(path: string): string {
  const config = getConfig();
  const cleanPath = path.replace(/^\/+/, '');
  return `${config.baseUrl}/${cleanPath}`;
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

export async function uploadObject(input: UploadObjectInput): Promise<{ url: string; provider: 'placeholder' | 's3' }> {
  const config = getConfig();
  const cleanPath = input.path.replace(/^\/+/, '');
  const url = createObjectUrl(cleanPath);

  if (config.provider === 'placeholder') {
    return { url, provider: 'placeholder' };
  }

  const client = getS3Client(config);
  if (!client) {
    return { url, provider: 'placeholder' };
  }

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
