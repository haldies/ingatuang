name: iOS Prebuild Inspection

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  prebuild:
    runs-on: macos-latest
    steps:
      - name: 🏗 Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm install

      - name: 🛠 Expo Prebuild
        run: npx expo prebuild --platform ios --no-install

      - name: 📤 Push ios folder to repo
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          
          # Force add ios folder because it is in .gitignore
          git add --force ios/
          
          # Check if there are changes to commit
          if git diff --staged --quiet; then
            echo "No changes in ios folder."
          else
            git commit -m "chore: update ios prebuild inspection folder"
            git push origin HEAD
          fi
