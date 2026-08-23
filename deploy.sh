#!/bin/bash

# ============================================================
# Getway - Safe Auto Deployment
# Mac -> GitHub -> VPS
#
# IMPORTANT:
# - Server .env files are NEVER overwritten.
# - Server uploads are NEVER deleted.
# - Local uploads can ADD/UPDATE files on server.
# - Server-only upload files are NEVER deleted.
# ============================================================

set -e

# ============================================================
# 1. SERVER CONFIG
# ============================================================

SERVER_IP="217.216.79.58"
SERVER_USER="root"
SSH_SOCKET="/tmp/ssh-getway-master"

# VPS paths (Update these according to your VPS setup)
BACKEND_PATH="/www/wwwroot/GetwayBackend"
FRONTEND_PATH="/www/wwwroot/GetwayFrontend"

# Ports
BACKEND_PORT="5872"

# Start Command
BACKEND_START_COMMAND="node index.mjs"

echo ""
echo "============================================================"
echo "🚀 Getway Safe Auto Deployment Started"
echo "============================================================"
echo ""


# ============================================================
# 2. GITHUB PUSH
# ============================================================

echo "🚀 STEP 1: Checking Git status..."
git status

echo ""
echo "📦 Adding files..."
git add .

echo ""
echo "📝 Creating deployment commit..."
git commit -m "Auto-deploy commit $(date '+%Y-%m-%d %H:%M:%S')" || {
    echo "ℹ️ No new changes to commit."
}

echo ""
echo "☁️ Pushing to GitHub..."
if ! git push; then
    echo ""
    echo "❌ GitHub push FAILED."
    echo "🛑 Deployment stopped."
    exit 1
fi
echo ""
echo "✅ GitHub push successful."


# ============================================================
# 3. LOCAL FRONTEND BUILD (Vite)
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 2: Building Frontend locally"
echo "============================================================"

cd ./client
echo "📦 Installing Frontend dependencies..."
npm install

echo ""
echo "🏗️ Building Frontend (Vite)..."
if ! npm run build; then
    echo ""
    echo "❌ Frontend build FAILED."
    echo "🛑 Deployment stopped."
    exit 1
fi
cd ..
echo ""
echo "✅ Frontend build successful."


# ============================================================
# 4. CHECK LOCAL DIRECTORIES
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 3: Checking local project structure"
echo "============================================================"

if [ ! -d "./server" ]; then
    echo "❌ ./server folder not found."
    exit 1
fi

if [ ! -d "./client/dist" ]; then
    echo "❌ ./client/dist folder not found (Build failed?)."
    exit 1
fi
echo "✅ Local project structure OK."


# ============================================================
# 5. OPEN ONE SSH CONNECTION
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 4: Opening SSH connection to VPS"
echo "============================================================"

rm -f "$SSH_SOCKET"
ssh -M -S "$SSH_SOCKET" -f -N "$SERVER_USER@$SERVER_IP"
echo "✅ SSH master connection established."


# ============================================================
# 6. PRE-DEPLOYMENT SERVER SAFETY CHECK
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 5: VPS Safety Check"
echo "============================================================"

ssh -S "$SSH_SOCKET" "$SERVER_USER@$SERVER_IP" << 'EOF'
set -e

echo "🔍 Checking backend directory..."
if [ ! -d "/www/wwwroot/GetwayBackend" ]; then
    echo "⚠️ Backend directory does not exist. Creating it..."
    mkdir -p "/www/wwwroot/GetwayBackend"
fi

echo "🔍 Checking frontend directory..."
if [ ! -d "/www/wwwroot/GetwayFrontend" ]; then
    echo "⚠️ Frontend directory does not exist. Creating it..."
    mkdir -p "/www/wwwroot/GetwayFrontend"
fi

echo "🔍 Checking backend uploads directory..."
if [ ! -d "/www/wwwroot/GetwayBackend/uploads" ]; then
    echo "⚠️ uploads folder does not exist. Creating it..."
    mkdir -p "/www/wwwroot/GetwayBackend/uploads"
fi
echo "✅ uploads folder exists."

echo "🔍 Checking environment files..."
if [ -f "/www/wwwroot/GetwayBackend/.env" ]; then
    echo "✅ Backend .env exists."
else
    echo "⚠️ Backend .env not found."
fi

echo ""
echo "🧹 Cleaning up old Frontend files..."
# Delete all files in frontend directory to place new dist files
find /www/wwwroot/GetwayFrontend -mindepth 1 -delete
echo "✅ Frontend old files cleaned."

echo "🧹 Cleaning up old Backend files (keeping .env and uploads)..."
find /www/wwwroot/GetwayBackend -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'uploads' -exec rm -rf {} +
echo "✅ Backend old files cleaned."
EOF
echo "✅ VPS safety check and cleanup complete."


# ============================================================
# 7. BACKEND CODE SYNC
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 6: Syncing Backend Code"
echo "============================================================"
echo "⚠️ IMPORTANT:"
echo "   Backend .env will NOT be touched."
echo "   Backend uploads/ will NOT be deleted or synced here."

rsync -avz \
    --delete \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='uploads/' \
    -e "ssh -S $SSH_SOCKET" \
    ./server/ \
    "$SERVER_USER@$SERVER_IP:$BACKEND_PATH/"

echo ""
echo "✅ Backend code sync complete."


# ============================================================
# 8. UPLOADS SYNC
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 7: Syncing Uploads Safely"
echo "============================================================"
if [ -d "./server/uploads" ]; then
    rsync -avz \
        --ignore-existing \
        -e "ssh -S $SSH_SOCKET" \
        ./server/uploads/ \
        "$SERVER_USER@$SERVER_IP:$BACKEND_PATH/uploads/"
    echo "✅ New upload files synced."
else
    echo "ℹ️ Local uploads folder does not exist. Skipping."
fi


# ============================================================
# 9. FRONTEND SYNC (Static Vite files)
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 8: Syncing Frontend (Vite Dist)"
echo "============================================================"

rsync -avz \
    -e "ssh -S $SSH_SOCKET" \
    ./client/dist/ \
    "$SERVER_USER@$SERVER_IP:$FRONTEND_PATH/"

echo ""
echo "✅ Frontend sync complete."


# ============================================================
# 10. SERVER DEPLOYMENT
# ============================================================

echo ""
echo "============================================================"
echo "🚀 STEP 9: Server Setup"
echo "============================================================"

ssh -S "$SSH_SOCKET" "$SERVER_USER@$SERVER_IP" \
    "BACKEND_PATH='$BACKEND_PATH' FRONTEND_PATH='$FRONTEND_PATH' BACKEND_PORT='$BACKEND_PORT' BACKEND_START_COMMAND='$BACKEND_START_COMMAND' bash -s" << 'EOF'
set -e

echo "📦 Installing Backend production dependencies..."
cd "$BACKEND_PATH"
npm install --production
echo "✅ Backend dependencies installed."

echo ""
echo "🛑 Stopping old Backend process on port $BACKEND_PORT..."
fuser -k "$BACKEND_PORT/tcp" || true
sleep 2
echo "✅ Backend old process stopped."

echo ""
echo "🚀 Starting Backend..."
cd "$BACKEND_PATH"
nohup bash -c "$BACKEND_START_COMMAND" > "$BACKEND_PATH/backend.log" 2>&1 &
echo $! > "$BACKEND_PATH/backend.pid"
sleep 3
echo "✅ Backend started."

echo ""
echo "🔐 Fixing permissions..."
chown -R www:www "$BACKEND_PATH" || true
chown -R www:www "$FRONTEND_PATH" || true
echo "✅ Permissions fixed."

echo ""
echo "🔍 Checking Backend port..."
if ! fuser "$BACKEND_PORT/tcp" >/dev/null 2>&1; then
    echo "❌ Backend is NOT running on port $BACKEND_PORT"
    exit 1
fi
echo "✅ Backend is running on port $BACKEND_PORT."

echo ""
echo "============================================================"
echo "✅ SERVER DEPLOYMENT SUCCESSFUL"
echo "============================================================"
EOF


# ============================================================
# 11. CLOSE SSH CONNECTION & CLEANUP
# ============================================================

echo ""
echo "============================================================"
echo "🔒 Closing SSH connection"
echo "============================================================"
ssh -S "$SSH_SOCKET" -O exit "$SERVER_USER@$SERVER_IP" || true
rm -f "$SSH_SOCKET"

echo ""
echo "============================================================"
echo "🧹 Cleaning up local client/dist folder..."
echo "============================================================"
if [ -d "./client/dist" ]; then
    rm -rf "./client/dist"
    echo "✅ Local client/dist folder deleted."
fi

echo ""
echo "============================================================"
echo "🎉 Getway Deployment Completed Successfully!"
echo "============================================================"
echo ""
