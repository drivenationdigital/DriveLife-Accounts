#!/bin/bash

APP_NAME="ce-nextadmin-app"     # PM2 process name

echo "Stopping app..."
pm2 stop "$APP_NAME"

echo "Cleaning old build..."
rm -rf .next

echo "Installing dependencies..."
npm install --force

echo "Building Next.js project..."
npm run build

echo "Restarting app with PM2..."
pm2 start npm --name "$APP_NAME" -- start

echo "Deployment completed."