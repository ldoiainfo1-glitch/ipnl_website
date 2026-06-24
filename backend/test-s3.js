require('dotenv').config({ path: '.env' });
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucket = process.env.AWS_S3_LOGOS_BUCKET;
const region = process.env.AWS_S3_REGION;
const accessKeyId = process.env.AWS_S3_LOGOS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_LOGOS_SECRET_ACCESS_KEY;

console.log('Config:', { bucket, region, hasKey: !!accessKeyId, hasSecret: !!secretAccessKey });

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
const key = 'logos/test/diagnostic-' + Date.now() + '.txt';

client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: Buffer.from('test'),
  ContentType: 'text/plain'
}))
  .then(() => {
    console.log('✓ PutObject succeeded');
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
  })
  .then(url => console.log('✓ Signed URL generated:', url.substring(0, 100) + '...'))
  .catch(err => {
    console.error('✗ Error:', err.message);
    console.error('  Code:', err.Code || err.name);
    console.error('  HTTP Status:', err.$metadata && err.$metadata.httpStatusCode);
  });
