# Git Commands for Tic-Tac-Toe

Save this file to remember how to update your game on GitHub.

## 1. First Time Setup
Run these commands one by one in your terminal to upload the project for the first time.

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SubhankarNag/tic-tac-toe-agy.git
git push -u origin main
```

## 2. Updating the Game (After making changes)
Whenever you edit the code and want to update the live version, run these three commands:

```bash
# 1. Add all new changes
git add .

# 2. Save the changes (you can change the message in quotes)
git commit -m "Updated game features"

# 3. Push the updates to GitHub
git push
```
