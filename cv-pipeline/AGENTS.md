# CV Pipeline - AGENTS.md

## Overview

Automated CV pipeline that watches for new PDF files in a local folder, uploads them to S3, parses the CV data via Lambda, and generates a modern README on GitHub.

## Architecture

```
Local Folder (~/Documents/CVs/)
       ↓ (fswatch detects new PDF)
watch-cv-folder.sh (launchd daemon)
       ↓ (uploads via AWS SDK)
S3 Bucket: lfelguetac-cv-uploads (prefix: cvs/)
       ↓ (S3 ObjectCreated trigger)
Lambda: lfelguetac-cv-parser (Node.js 20.x)
       ↓ (parse PDF → generate README → GitHub API)
GitHub: github.com/lfelguetac/lfelguetac (README.md)
```

## Project Structure

```
/Users/lfelgueta/cv-pipeline/
├── terraform/                          # Infrastructure as Code
│   ├── main.tf                         # AWS provider config
│   ├── s3.tf                           # S3 bucket + versioning + encryption
│   ├── lambda.tf                       # Lambda function + S3 trigger
│   ├── iam.tf                          # IAM role + policies
│   ├── variables.tf                    # Input variables
│   └── outputs.tf                      # Output values
├── lambda/                             # Lambda function (TypeScript)
│   ├── src/
│   │   ├── index.ts                    # Main handler: S3 → PDF parse → GitHub
│   │   ├── pdf-parser.ts               # Extract CV data from PDF text
│   │   └── readme-generator.ts         # Generate styled README with badges
│   ├── package.json
│   └── tsconfig.json
├── scripts/                            # Local scripts
│   ├── upload-cv.js                    # Manual upload script
│   ├── watch-cv-folder.sh              # fswatch watcher script
│   └── package.json                    # Dependencies for scripts
├── watcher.log                         # Daemon stdout log
├── watcher.err.log                     # Daemon stderr log
└── AGENTS.md                           # This file
```

## AWS Resources

| Resource | Name | Region |
|----------|------|--------|
| S3 Bucket | `lfelguetac-cv-uploads` | us-east-1 |
| Lambda | `lfelguetac-cv-parser` | us-east-1 |
| IAM Role | `cv-parser-lambda-role` | us-east-1 |
| CloudWatch Logs | `/aws/lambda/lfelguetac-cv-parser` | us-east-1 |

## Background Watcher Service

Managed by macOS `launchd` using `fswatch` to monitor `~/Documents/CVs/` for new `.pdf` files.

### Service Details

- **Label**: `com.lfelgueta.cv-watcher`
- **Plist**: `~/Library/LaunchAgents/com.lfelgueta.cv-watcher.plist`
- **Script**: `/Users/lfelgueta/cv-pipeline/scripts/watch-cv-folder.sh`
- **Logs**: `/Users/lfelgueta/cv-pipeline/watcher.log`

### Start / Stop / Restart

```bash
# Start the watcher
launchctl load ~/Library/LaunchAgents/com.lfelgueta.cv-watcher.plist

# Stop the watcher
launchctl unload ~/Library/LaunchAgents/com.lfelgueta.cv-watcher.plist

# Restart
launchctl stop com.lfelgueta.cv-watcher && launchctl start com.lfelgueta.cv-watcher

# Check status
launchctl list | grep cv-watcher

# View logs in real-time
tail -f ~/cv-pipeline/watcher.log

# View error logs
tail -f ~/cv-pipeline/watcher.err.log
```

### Completely Remove the Service

```bash
# 1. Stop and unload the service
launchctl unload ~/Library/LaunchAgents/com.lfelgueta.cv-watcher.plist

# 2. Delete the plist file
rm ~/Library/LaunchAgents/com.lfelgueta.cv-watcher.plist

# 3. Kill any remaining processes
pkill -f watch-cv-folder.sh

# 4. (Optional) Delete the entire project
rm -rf ~/cv-pipeline/

# 5. (Optional) Remove fswatch if no longer needed
brew uninstall fswatch
```

### Destroy All AWS Resources

```bash
cd /Users/lfelgueta/cv-pipeline/terraform
terraform destroy -auto-approve
```

## Manual Upload (without watcher)

```bash
node /Users/lfelgueta/cv-pipeline/scripts/upload-cv.js
```

This finds the highest version PDF in `~/Documents/CVs/` and uploads it to S3.

## Deploy Infrastructure Changes

```bash
cd /Users/lfelgueta/cv-pipeline/terraform

# Plan
TF_VAR_github_token="<TOKEN>" terraform plan

# Apply
TF_VAR_github_token="<TOKEN>" terraform apply -auto-approve
```

## Rebuild and Deploy Lambda

```bash
cd /Users/lfelgueta/cv-pipeline/lambda

# Clean build with dependencies
rm -rf dist node_modules lambda.zip
npm install
npm run build
rm -rf node_modules
npm install --omit=dev
cp -r node_modules dist/
cd dist && zip -r ../lambda.zip .

# Deploy to AWS
aws lambda update-function-code \
  --function-name lfelguetac-cv-parser \
  --region us-east-1 \
  --zip-file fileb://lambda.zip
```

## GitHub Token

- **Type**: Fine-grained Personal Access Token
- **Required permissions**: `Contents: Read and write` on `lfelguetac/lfelguetac`
- **Stored as**: Lambda environment variable `GITHUB_TOKEN`
- **To update**: Edit Lambda env var in AWS Console or re-run `terraform apply` with new `TF_VAR_github_token`

## How It Works

1. **Watch**: `fswatch` monitors `~/Documents/CVs/` for `.pdf` file changes
2. **Upload**: `upload-cv.js` finds the highest version PDF and uploads to S3 via AWS SDK
3. **Trigger**: S3 `ObjectCreated` event fires the Lambda
4. **Parse**: Lambda extracts text from PDF using `pdf-parse`, then extracts CV fields via regex
5. **Generate**: `readme-generator.ts` creates a styled README with:
   - Centered header with name and title
   - Contact bar with icons
   - Tech stack badges (shields.io with skill-specific colors)
   - Experience, Education, Certifications, Languages sections
6. **Publish**: Uses GitHub REST API to update `README.md` in `lfelguetac/lfelguetac`

## Known Limitations

- PDF text extraction depends on the PDF having selectable text (not scanned images)
- CV field extraction uses regex patterns; may need tuning for different CV formats
- The watcher triggers on ANY `.pdf` change (including edits), not just new files
- Lambda timeout is 60s; large PDFs may need more time
