# Langua

Language courses for English speakers, starting with Dutch (A0 to C1 / NT2).
The same course runs as a web site and as an Android app.

## Install the Android app

1. On your Android phone, open the **Releases** page of this repository
   (or go straight to `https://github.com/mbuwul/Langua/releases/latest`).
2. Tap **Langua-Dutch.apk** to download it.
3. Open the downloaded file. The first time, Android asks whether your browser may
   "install unknown apps": tap **Settings**, switch it on, go back and tap **Install**.
4. Open **Langua Dutch**. The first time you tap **Say it**, allow the microphone.

New versions install over the old one, and your progress is kept.
If listen buttons are silent, install the free Dutch voice: Android **Settings → System →
Languages → Text-to-speech → Speech Services by Google → Install voice data → Nederlands**.
The pronunciation check uses Google's free speech service on the phone and needs internet.

## How the pieces fit

| Folder | What it is |
| --- | --- |
| `course/src/` | The lessons, written in Markdown (A0, A1, ... one file per unit). |
| `course/build.py` | Turns the lessons into web pages (`course/site/`). Needs Python 3 and pandoc. |
| `course/assets/` | The course's look and behaviour (style.css, app.js) shared by site and app. |
| `app-shell/` | Extras used only in the app: `native-speech.js` connects the course's microphone check and listen buttons to the phone's own speech services. |
| `scripts/make-www.mjs` | Builds the course and copies it into `www/` for the app. |
| `android/` | The Android project (Capacitor). |
| `resources/` | App icon and splash screen sources. |

## Adding new units

Add or change Markdown files in `course/src/` and push to `main`.
The **Build Android app** GitHub Action rebuilds the course and publishes a new APK on the
Releases page within about 10 minutes. Nothing else needs to change: the app picks up every unit.

## Building by hand (optional)

Needs Node 22, Java 21, Python 3, pandoc and the Android SDK (`ANDROID_HOME`).

```
npm ci
npm run apk          # -> android/app/build/outputs/apk/debug/app-debug.apk
```

## Google Play later

Sideloaded builds are signed with `android/keystore/langua-sideload.jks` so updates install
over each other. For the Play Store, create a Google Play developer account (one-time 25 USD),
build an app bundle (`./gradlew bundleRelease`) and enrol in Play App Signing.
