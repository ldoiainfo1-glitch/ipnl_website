#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const repoBackendDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(repoBackendDir, '.env') });

function getContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

function slugifyFileName(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'upload';
}

function toS3Url(bucket, region, key) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function createClient(region, accessKeyId, secretAccessKey, sessionToken) {
  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    },
  });
}

function extractBucketRegion(error) {
  return (
    error?.BucketRegion ||
    error?.region ||
    error?.$metadata?.httpHeaders?.['x-amz-bucket-region'] ||
    error?.$response?.headers?.['x-amz-bucket-region'] ||
    error?.$response?.headers?.['X-Amz-Bucket-Region'] ||
    null
  );
}

async function uploadOnce({ bucket, region, accessKeyId, secretAccessKey, sessionToken, objectKey, fileBuffer, contentType }) {
  const client = createClient(region, accessKeyId, secretAccessKey, sessionToken);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );
}

async function main() {
  const inputFile = process.argv[2] || path.resolve('D:\\shalinii\\ipnl_website\\Screenshot 2026-05-30 170650.png');
  const keyArg = process.argv[3];

  const bucket = (process.env.AWS_S3_LOGOS_BUCKET || 'ipnl-logos').trim();
  const region = (process.env.AWS_S3_REGION || 'ap-south-1').trim();
  const accessKeyId = process.env.AWS_S3_LOGOS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_S3_LOGOS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.AWS_S3_LOGOS_SESSION_TOKEN?.trim() || process.env.AWS_SESSION_TOKEN?.trim();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS_S3_LOGOS_ACCESS_KEY_ID or AWS_S3_LOGOS_SECRET_ACCESS_KEY in backend/.env');
  }

  const absoluteInput = path.resolve(inputFile);
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`File not found: ${absoluteInput}`);
  }

  const fileBuffer = fs.readFileSync(absoluteInput);
  const fileName = path.basename(absoluteInput);
  const objectKey = keyArg
    ? keyArg.replace(/^\/+/, '')
    : `manual-uploads/${Date.now()}-${slugifyFileName(fileName)}${path.extname(fileName).toLowerCase()}`;
  const contentType = getContentType(absoluteInput);

  try {
    await uploadOnce({ bucket, region, accessKeyId, secretAccessKey, sessionToken, objectKey, fileBuffer, contentType });
  } catch (error) {
    const detectedRegion = extractBucketRegion(error);
    if (!detectedRegion || detectedRegion === region) {
      throw error;
    }

    await uploadOnce({
      bucket,
      region: detectedRegion,
      accessKeyId,
      secretAccessKey,
      sessionToken,
      objectKey,
      fileBuffer,
      contentType,
    });

    console.log(JSON.stringify({
      bucket,
      region: detectedRegion,
      key: objectKey,
      contentType,
      url: toS3Url(bucket, detectedRegion, objectKey),
      note: `Retried after region redirect from ${region}`,
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    bucket,
    region,
    key: objectKey,
    contentType,
    url: toS3Url(bucket, region, objectKey),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
