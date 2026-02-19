# Super Muslim Assistant 🌙

A comprehensive Islamic application designed to assist Muslims in their daily worship, featuring real-time prayer times, Quran with multiple Qaris, a dual-calendar (Gregorian & Hijri), and an integrated fasting log.

**Developed by: ArtDur**

## ✨ Features

- **Real-time Prayer Times**: Accurate timings based on geolocation using the Aladhan API.
- **Al-Quran Digital**: Complete Quran with audio playback from world-class Qaris.
- **Dual Calendar**: Islamic Hijri and Gregorian calendar integrated into one view.
- **Fasting Tracker**: Easily log your fasting and see your progress in a visual calendar.
- **Ibadah Tracker**: Gamified experience to monitor your daily sunnah and obligatory prayers.
- **Masjid Locator**: Find the nearest mosques using integrated maps.
- **Daily Adhkar & Duas**: Collection of daily prayers for various occasions.

## 🚀 Deployment Guide (Easiest Method)

To make your app accessible live via a link and easy to update, follow these steps:

### 1. Push to GitHub
If you haven't yet, push this folder to a new repository on GitHub:
1. Open terminal inside `App-Islami`.
2. `git init`
3. `git add .`
4. `git commit -m "Launch version by ArtDur"`
5. `git remote add origin [Your-Repo-URL]`
6. `git push -u origin main`

### 2. Connect to Vercel (The Live Link)
Vercel is the most secure and fastest way to host Vite applications:
1. Go to [Vercel](https://vercel.com) and login with your GitHub account.
2. Click **"Add New"** > **"Project"**.
3. Import your **`App-Islami`** repository.
4. Keep the default settings and click **"Deploy"**.
5. You will get a permanent link (e.g., `app-islami.vercel.app`).

## 🔄 How to Update Safely
Updating your app is now extremely easy and secure:
1. **Modify your code** locally on your computer.
2. **Save your changes**.
3. **Push to GitHub** again:
   ```powershell
   git add .
   git commit -m "Description of your update"
   git push origin main
   ```
4. **Automatic Update**: Vercel will detect your push, rebuild the app, and update your live link automatically within seconds. No manual uploading required!

## 🛠️ Technology Stack
- **Framework**: Vue 3 (Vite)
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **APIs**: equran.id v2, Aladhan, OpenStreetMap

---
© 2026 ArtDur - Super Muslim Assistant
