<img width="1200" height="475" alt="Bittle X Commander" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Bittle X Commander

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

## What it is

A browser-based control panel for the Petoi Bittle X quadruped robot. Supports Bluetooth (BLE), USB Serial, and WiFi connections with Gemini AI natural language command translation that maps plain English phrases directly to OpenCat protocol commands.

## Features

- Bluetooth BLE, USB Serial, and WiFi connectivity from any modern browser
- Gemini AI control — type or speak natural language and the robot acts
- Physical gamepad support (Xbox / standard Bluetooth controllers)
- Dark and light mode
- Real-time command terminal showing all TX/RX traffic

## Requirements

- Chrome or Edge 89+ (required for Web Bluetooth and Web Serial APIs)
- Petoi Bittle X robot with BiBoard (ESP32)
- Gemini API key (for AI voice/text control)

> **Note:** WiFi connection works on Safari and all modern browsers. Bluetooth and USB Serial require Chrome or Edge on desktop or Android. On iOS, use the [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) browser app for Bluetooth.

## Quick Start

```bash
git clone https://github.com/<user>/bittle-x.git
cd bittle-x
npm install
```

Create a `.env.local` file in the project root with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

Then start the development server:

```bash
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

## Connection Guide

### Bluetooth (BLE)

1. Power on your Bittle X and ensure Bluetooth is active on your computer or Android device.
2. Click **Connect (BLE)** in the app header.
3. Select your Bittle from the browser device picker.
4. The robot will stand up when the connection is established.

> On iOS, use the Bluefy browser app instead of Safari or Chrome.

### USB Serial

1. Connect Bittle to your computer with a USB-C cable.
2. Click **Connect (USB)** in the app header.
3. Select the correct COM port (Windows) or `/dev/tty` port (macOS/Linux) from the browser popup — look for **CP210x** in the port name.
4. Default baud rate is **115200**.

### WiFi

1. Ensure Bittle X and your computer are on the same WiFi network.
2. Find Bittle's IP address — it is shown on the BiBoard OLED display or in your router's device list.
3. Click **WiFi** in the header, enter the IP address (e.g., `192.168.1.15`), and click **GO**.

## AI Control

Click the microphone icon or type a command into the AI input field. The Gemini model translates natural language into a sequence of OpenCat commands and executes them in order.

Example phrases:

- `"Do a backflip"`
- `"Walk forward then sit"`
- `"Do a pushup then bark twice"`
- `"Say hello"`
- `"Sing a song"`

## Gamepad Controls

Connect a Bluetooth controller (Xbox or standard HID gamepad) to your device before opening the app.

| Input | Action |
|-------|--------|
| Left Stick | Move (forward / backward / strafe) |
| A Button | Stop / Balance |
| B Button | Sit |
| X Button | Say Hi |
| Y Button | Pee |
| LB | Push-up |
| RB | Stretch |

## Control Pad Buttons

The on-screen directional pad sends the following commands:

| Button | Command | Description |
|--------|---------|-------------|
| Up arrow | `kwkF` | Walk forward |
| Down arrow | `kbk` | Walk backward |
| Left arrow | `kvtL` | Spin left |
| Right arrow | `kvtR` | Spin right |
| Center (stop) | `kbalance` | Stop / balance |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Up | Walk Forward |
| Arrow Down | Walk Backward |
| Arrow Left | Spin Left |
| Arrow Right | Spin Right |
| Space | Stop / Balance |
| Escape | Emergency Stop |

## Troubleshooting

- **Bluetooth not found:** Ensure the robot is powered on. Use Chrome or Edge. Try toggling Bluetooth off and on in your OS settings.
- **Serial permission denied:** Grant port access in the browser popup. Close any other serial monitor apps (Arduino IDE, PuTTY, etc.) that may be holding the port.
- **AI not responding:** Verify that `GEMINI_API_KEY` is set in `.env.local` and that the development server was restarted after adding it. Check your internet connection.
- **WiFi timeout:** Confirm both devices are on the same network. Disable VPN. Try pinging the IP from your terminal (`ping 192.168.1.15`).
- **Commands not working:** Try disconnecting and reconnecting. Check that your BiBoard firmware is up to date via the Petoi firmware tool.

---

## Architecture

```
┌─────────────────────────────────────────┐
│                App.tsx                  │
│  (state, connection, command dispatch)  │
└────────┬────────────┬───────────────────┘
         │            │
    ┌────▼─────┐  ┌───▼──────────────────┐
    │ Services │  │     Components       │
    │ BLE      │  │ ControlPad SkillGrid │
    │ Serial   │  │ AIController Terminal│
    │ WiFi     │  │ ModulesPanel         │
    └────┬─────┘  └──────────────────────┘
         │
    ┌────▼──────────────┐
    │  /api/translate   │
    │ (Vercel Function) │
    │  → Gemini API     │
    └───────────────────┘
```

`App.tsx` is the central orchestrator: it owns all connection state, dispatches commands to whichever transport is active, and passes callbacks down to components. The services layer provides a uniform interface over three transports (BLE, Serial, WiFi). UI components are stateless with respect to connection — they call `onCommand(cmd)` and the app routes it.

## Service Interface

Each transport module implements the same contract:

```ts
connect(): Promise<void>
disconnect(): void
sendCommand(cmd: string): void
setOnDisconnect(cb: () => void): void
setOnDataReceived(cb: (data: string) => void): void
```

## OpenCat Serial Protocol

Commands are ASCII strings terminated with `\n`. Common prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `k` | Skill / gait | `kwkF`, `kbalance` |
| `m` | Motor position | `m0 45` |
| `b` | Buzzer / sound | `b14,8` |
| `g` | Gyro toggle | `g` |
| `v` | Battery voltage query | `v` |
| `d` | Rest (lay flat) | `d` |

Full protocol reference: https://docs.petoi.com/apis/serial-protocol

## Command Reference

All constants are exported from `types.ts` as `OPEN_CAT_COMMANDS`.

### Postures

| Constant | Command | Description |
|----------|---------|-------------|
| `BALANCE` | `kbalance` | Stand / stop |
| `SIT` | `ksit` | Sit |
| `STRETCH` | `kstr` | Stretch |
| `REST` | `d` | Rest (lay flat) |
| `K_REST` | `krest` | Rest (k-prefixed) |
| `BUTT_UP` | `kbuttUp` | Butt up |
| `CALIB` | `kcalib` | Calibration pose |
| `UP` | `kup` | Stand up |
| `ZERO` | `kzero` | Zero position |

### Gaits

| Constant | Command | Description |
|----------|---------|-------------|
| `WALK_F` | `kwkF` | Walk forward |
| `WALK_L` | `kwkL` | Walk left |
| `WALK_R` | `kwkR` | Walk right |
| `BACKWARD` | `kbk` | Walk backward |
| `BACK_L` | `kbkL` | Walk backward-left |
| `BACK_R` | `kbkR` | Walk backward-right |
| `CRAWL_F` | `kcrF` | Crawl forward |
| `CRAWL_L` | `kcrL` | Crawl left |
| `TROT_F` | `ktrF` | Trot forward |
| `TROT_L` | `ktrL` | Trot left |
| `BOUND_F` | `kbdF` | Bound forward |
| `JUMP_F` | `kjpF` | Jump forward |
| `STEP_ORIGIN` | `kvtF` | Step in place |
| `SPIN_L` | `kvtL` | Spin left |

### Behaviors

| Constant | Command | Description |
|----------|---------|-------------|
| `HI` | `khi` | Say hello |
| `PEE` | `kpee` | Pee |
| `PUSH_UPS` | `kpu` | Push-ups |
| `PUSH_UP_1` | `kpu1` | Single push-up |
| `ROLL` | `krl` | Roll |
| `CHECK` | `kck` | Check surroundings |
| `BACKFLIP` | `kbf` | Backflip |
| `FRONTFLIP` | `kff` | Frontflip |
| `CHEERS` | `kchr` | Cheers |
| `BOXING` | `kbx` | Boxing |
| `HANDSTAND` | `khds` | Handstand |
| `MOONWALK` | `kmw` | Moonwalk |
| `SCRATCH` | `kscrh` | Scratch |
| `SNIFF` | `ksnf` | Sniff |
| `TABLE` | `ktbl` | Table pose |
| `WAVE_HEAD` | `kwh` | Wave head |
| `ANGRY` | `kang` | Angry |
| `DIG` | `kdg` | Dig |
| `HUG` | `khg` | Hug |
| `HIGH_FIVE` | `kfiv` | High five |
| `GOOD_BOY` | `kgdb` | Good boy |
| `KICK` | `kkc` | Kick |
| `PLAY_DEAD` | `kpd` | Play dead |
| `RECOVER` | `krc` | Recover / get up |

### Sound

| Constant | Command | Description |
|----------|---------|-------------|
| `BEEP` | `b10,8` | Single beep |
| `BARK` | `b14,8,14,8` | Bark twice |
| `SING` | `b10,4,12,4,14,4,16,8` | Play a short tune |

### System / Diagnostics

| Constant | Command | Description |
|----------|---------|-------------|
| `GYRO_TOGGLE` | `g` | Toggle gyro stabilization |
| `RANDOM_MIND` | `z` | Random behavior |
| `BATTERY` | `v` | Query battery voltage |
| `JOINTS` | `m` | Query joint positions |

### Vision (Mu Vision / Grove AI)

| Constant | Command | Description |
|----------|---------|-------------|
| `VISION.STOP` | `C0` | Stop vision module |
| `VISION.COLOR` | `C1` | Color detection |
| `VISION.FACE` | `C3` | Face detection |
| `VISION.BODY` | `C2` | Body detection |
| `VISION.GESTURE` | `C5` | Gesture detection |

## Python API

For scripting and automation outside the browser app:

- Docs: https://docs.petoi.com/apis/python-api
- Repo: https://github.com/PetoiCamp/OpenCat-Quadruped-Robot

## Extending

### Adding a new skill button

1. Add the command string to `OPEN_CAT_COMMANDS` in `types.ts`.
2. Add a button in `components/SkillGrid.tsx` that calls `onCommand(OPEN_CAT_COMMANDS.YOUR_SKILL)`.

### Adding a new transport

1. Create `services/yourTransportService.ts` implementing `connect`, `disconnect`, `sendCommand`, `setOnDisconnect`, and `setOnDataReceived`.
2. Import and wire up the connection handler in `App.tsx`.
3. Add the connection button to the header in `App.tsx`.

## Running Tests

```bash
npm test           # Run tests in watch mode
npm run test:ui    # Open Vitest UI
```

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests.
4. Open a pull request.

## License

MIT
