const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const CV_DIR = '/Users/lfelgueta/Documents/CVs';
const S3_BUCKET = 'lfelguetac-cv-uploads';
const S3_PREFIX = 'cvs';

const s3Client = new S3Client({ region: 'us-east-1' });

function findLatestCV() {
  const files = fs.readdirSync(CV_DIR);

  const pdfFiles = files
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => {
      const match = f.match(/v?(\d+(?:\.\d+)*)/i);
      const version = match ? match[1] : '0';
      return { file: f, version };
    })
    .sort((a, b) => {
      const partsA = a.version.split('.').map(Number);
      const partsB = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA !== numB) return numB - numA;
      }
      return 0;
    });

  if (pdfFiles.length === 0) {
    console.error('❌ No PDF files found in', CV_DIR);
    process.exit(1);
  }

  return pdfFiles[0];
}

async function uploadToS3(filePath, fileName) {
  const s3Key = `${S3_PREFIX}/${fileName}`;

  console.log(`📤 Uploading ${fileName} to s3://${S3_BUCKET}/${s3Key}...`);

  const fileBuffer = fs.readFileSync(filePath);

  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: 'application/pdf',
  }));

  console.log(`✅ Successfully uploaded to S3`);
  console.log(`🚀 Lambda will process the file and update your GitHub README`);
}

async function main() {
  console.log('🔍 Searching for the latest CV in', CV_DIR);

  const latest = findLatestCV();

  console.log(`📄 Found: ${latest.file} (version ${latest.version})`);

  const filePath = path.join(CV_DIR, latest.file);

  await uploadToS3(filePath, latest.file);
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
