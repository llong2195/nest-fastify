echo "Kill all the running PM2 actions"
pm2 kill

echo "Jump to app folder"
cd /home/ubuntu/nestjs-stater

echo "Update app from Git"
git add .
git stash
git checkout develop
git pull origin develop

echo "Install app dependencies"
sudo rm -rf node_modules package-lock.json
sudo npm install

# echo "Build your app"
# sudo npm run build

echo "Run new PM2 action"
sudo cp /home/ubuntu/ecosystem.json ecosystem.json
pm2 start ecosystem.json