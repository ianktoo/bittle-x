
# Bittle X Explorer

A web controller for the **Petoi Bittle X** robot dog using Web Bluetooth, Web Serial, WiFi, and **Gemini AI** for natural-language and voice control.

## About

I built this while teaching at a summer camp. Beyond coding, the kids didn't have a way to play with the Bittle X, so I tinkered until they could. It's an open project and I'm excited to share it with the community. Please test it out and tinker around—it's not perfect but it works most of the time.

## Features

- **Multi-protocol**: Connect via Bluetooth Low Energy (BLE), USB Serial, or WiFi (BiBoard/ESP32).
- **AI integration**: Use Google Gemini to translate natural language and voice into OpenCat robot commands.
- **Gamepad support**: Xbox/PlayStation controller mapping for movement and skills.
- **Vision interface**: Dedicated UI for the Grove AI (Mu Vision) camera.
- **OpenCat terminal**: Send raw OpenCat protocol commands from the in-app terminal.

## Prerequisites

- **Node.js** (for running the app locally)
- **Browser**: Chrome or Edge for BLE and Serial; **Bluefy** on iOS (Safari does not support Web Bluetooth).
- **HTTPS or localhost** required for Web Bluetooth and Web Serial.
- **Microphone** (optional) for AI voice input.

**Note:** For multiple devices or more reliable connections, **USB (Web Serial) is highly recommended** over Bluetooth LE, which can be flaky with several robots or connections.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) For AI voice and natural-language features, copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY`. Without it, BLE/Serial/WiFi and gamepad control still work.
3. Run the app (choose one):
   - **With AI (recommended):** `npx vercel dev` — runs the app and the serverless API so the key stays on the server (requires [Vercel CLI](https://vercel.com/docs/cli)).
   - **App only:** `npm run dev` — AI won’t work (no API); other features work.

Open the app in your browser. Use the **Docs** (book) button in the app for the full in-app documentation.

**Deploy on Vercel:** The app uses a serverless function at `/api/translate` so the Gemini key is never in the browser. Set `GEMINI_API_KEY` in your [Vercel project Environment Variables](https://vercel.com/docs/projects/environment-variables).

## Documentation

- **[docs/](docs/)** — Written documentation:
  - [User guide](docs/user-guide.md) — Getting started, connection, controls, troubleshooting.
  - [Developer guide](docs/development.md) — Setup, architecture, build, and deploy.
  - [OpenCat protocol reference](docs/opencat-protocol.md) — Command reference for the terminal and skills.

## Links

- [Petoi Doc Center](https://docs.petoi.com/)
- [OpenCat GitHub](https://github.com/PetoiCamp/OpenCat)
- [Bittle product page](https://www.petoi.com/pages/bittle-open-source-bionic-robot-dog)
- [View in AI Studio](https://ai.studio/apps/drive/1rhvI7jTgVlf4EF-BP0usiJKYRCO0GddY)
