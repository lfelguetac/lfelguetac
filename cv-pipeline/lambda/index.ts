import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pdfParse from 'pdf-parse';
import { extractCVData, CVData } from './pdf-parser';
import { generateReadme } from './readme-generator';

const s3Client = new S3Client();

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'lfelguetac';
const GITHUB_REPO = process.env.GITHUB_REPO || 'lfelguetac';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${bucket}/${key}`);

    try {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray());
      const pdfData = await pdfParse(buffer);

      console.log('PDF text extracted, parsing CV data...');
      const cvData: CVData = extractCVData(pdfData.text);

      console.log('Generating README...');
      const readmeContent = generateReadme(cvData);

      console.log('Updating GitHub README...');
      await updateGitHubReadme(readmeContent, key);

      console.log(`Successfully updated README for ${key}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      throw error;
    }
  }
};

async function updateGitHubReadme(content: string, sourceFile: string) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/README.md`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    const getResponse = await fetch(apiUrl, { headers });

    let sha: string | undefined;
    if (getResponse.ok) {
      const data = (await getResponse.json()) as { sha: string };
      sha = data.sha;
    }

    const body = {
      message: `🔄 Update CV from ${sourceFile}`,
      content: Buffer.from(content).toString('base64'),
      ...(sha && { sha }),
    };

    const putResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!putResponse.ok) {
      const error = await putResponse.json();
      throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
    }

    console.log('README updated successfully');
  } catch (error) {
    console.error('Failed to update GitHub README:', error);
    throw error;
  }
}
