# Bittle X Explorer — Development Guide

This document is for developers who want to run, build, or modify Bittle X Explorer.

## Overview

- **Stack:** React 19, Vite 6, TypeScript, [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini SDK), Lucide React for icons.
- **Purpose:** Web UI to control the Petoi Bittle X via OpenCat over BLE, Web Serial, and WiFi, with optional Gemini-powered natural language and voice.

## Repository structure

| Path | Description |
|------|-------------|
| `App.tsx` | Main app: connection state, sendCommand, gamepad loop, theme, and layout. Renders ControlPad, SkillGrid, Terminal, AIController, SensorsPanel, ModulesPanel, Documentation, HelpModal. |
| `index.tsx` / `index.html` | Entry point and HTML shell. |
| `types.ts` | Shared types and `OPEN_CAT_COMMANDS` constant. |
| `components/` | UI: ControlPad, SkillGrid, Terminal, AIController, SensorsPanel, ModulesPanel, Documentation (in-app docs), HelpModal, ToastContainer. |
| `services/bluetoothService.ts` | Web Bluetooth: Nordic UART service, connect, send, receive, disconnect. |
| `services/serialService.ts` | Web Serial: port picker, 115200 baud, read/write, disconnect. |
| `services/wifiService.ts` | WiFi: connect by IP/hostname, send commands via `http://[IP]/action?cmd=...`. |
| `services/geminiService.ts` | Gemini API: system prompt with OpenCat skills, natural language → JSON command array (with optional `wait:ms`). |
| `vite.config.ts` | Vite config (e.g. React plugin). |
| `vercel.json` | SPA rewrite: all routes → `index.html` (for Vercel deploy). |

## Scripts

From [package.json](../package.json):

- `npm run dev` — Start Vite dev server (default port, e.g. 5173).
- `npm run build` — Production build (output in `dist/`).
- `npm run preview` — Serve the production build locally.

## Environment

- **`GEMINI_API_KEY`** in `.env.local`: Required for AI voice and natural-language features. The app reads it at runtime. Without it, BLE/Serial/WiFi and gamepad control still work.

Create `.env.local` in the project root (and add it to `.gitignore` if not already).

## Services

- **bluetoothService:** Connects to a BLE device using the Nordic UART service/characteristics, queues outgoing commands, and notifies the app of incoming data (e.g. battery voltage). Used when the user chooses “Connect (BLE)”.
- **serialService:** Uses the Web Serial API to let the user pick a USB serial port, opens it at 115200 baud, and provides send/receive and disconnect. Used for “Connect (USB)”.
- **wifiService:** Stores the robot IP/hostname and sends OpenCat commands via GET requests to `http://[IP]/action?cmd=[COMMAND]`. Used when the user enters an IP and connects via WiFi.
- **geminiService:** Calls the Gemini API with a system prompt that maps natural language to OpenCat command names. Returns a JSON object with a `commands` array (and optional `wait:ms` tokens). The app then sends those commands in sequence to the robot.

## Build and deploy

1. Run `npm run build`. The output is in `dist/`.
2. Serve `dist/` with any static host. [vercel.json](../vercel.json) is set up for **Vercel**: all routes rewrite to `index.html` for client-side routing.

For Web Bluetooth and Web Serial, the deployed site must be served over **HTTPS** (or localhost in development).

## Contributing

- Keep the in-app **Documentation** panel and the **docs/** Markdown (e.g. [user-guide.md](user-guide.md)) in sync when you change user-facing behavior or copy.
- Use the existing patterns for connection state, toasts, and command sending in `App.tsx` when adding features.
