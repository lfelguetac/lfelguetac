#!/bin/bash

CV_DIR="/Users/lfelgueta/Documents/CVs"
UPLOAD_SCRIPT="/Users/lfelgueta/cv-pipeline/scripts/upload-cv.js"
LOG_FILE="/Users/lfelgueta/cv-pipeline/watcher.log"
FSWATCH="/opt/homebrew/bin/fswatch"
NODE="/opt/homebrew/bin/node"

echo "[$(date)] Watching $CV_DIR for new PDF files..." >> "$LOG_FILE"

"$FSWATCH" -0 -e ".*" -i "\\.pdf$" "$CV_DIR" | while IFS= read -r -d '' event; do
  FILE=$(echo "$event" | rev | cut -d'/' -f1 | rev)
  echo "[$(date)] Detected change: $FILE" >> "$LOG_FILE"
  
  sleep 1
  
  "$NODE" "$UPLOAD_SCRIPT" >> "$LOG_FILE" 2>&1
  echo "[$(date)] Upload completed" >> "$LOG_FILE"
  echo "---" >> "$LOG_FILE"
done
