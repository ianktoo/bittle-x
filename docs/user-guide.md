# Bittle X Explorer — User Guide

This guide covers how to use Bittle X Explorer to control your Petoi Bittle X robot dog.

## Introduction

**Bittle X Explorer** is a web interface that talks to the **OpenCat** protocol running on Petoi robots. It uses Web Bluetooth, Web Serial, and WiFi so you can connect from the browser without installing drivers.

**Key features:**

- **Multi-protocol:** BLE, USB Serial, and WiFi (BiBoard/ESP32).
- **AI integration:** Google Gemini turns natural language and voice into robot commands.
- **Vision control:** Interface for the Grove AI (Mu Vision) camera.
- **Gamepad support:** Xbox/PlayStation controller mapping.

## Hardware setup

### Supported boards

- **BiBoard (ESP32):** Recommended for WiFi and fast BLE.
- **NyBoard V1_1 / V1_2:** Use a standard Bluetooth dongle or USB.

### Modules

- **Grove AI (Mu Vision):** Connects to I2C ports.
- **Petoi BLE dongle:** Needed for NyBoard wireless control.

## Connection methods

### 1. Bluetooth Low Energy (BLE)

Best for wireless control.

- **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e` (Nordic UART).
- **Desktop:** Chrome, Edge, or Opera.
- **Android:** Chrome.
- **iOS / iPadOS:** Safari does not support Web Bluetooth. Use the [Bluefy Browser](https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055) app.

**Steps:** Click **Connect (BLE)** in the app, then choose your Petoi BLE device in the browser dialog.

### 2. USB Serial

Lowest latency; good for debugging.

- Connect Bittle via USB-C (BiBoard) or Micro-USB (NyBoard).
- **Baud rate:** 115200 (default).
- **macOS/Linux:** No extra drivers. **Windows:** You may need CP210x drivers for the USB-serial chip.

**Steps:** Click **Connect (USB)**, then select the correct COM/Serial port when prompted.

### 3. WiFi

Long range; requires BiBoard (ESP32) configured with the Petoi WiFi firmware.

- Use any browser (including Safari).
- Enter the robot’s IP address (e.g. `192.168.1.15`) in the WiFi field. You can use a hostname (e.g. `bittle.local`) if your network supports it.
- Device and computer must be on the same WiFi network.

Commands are sent as: `http://[IP_ADDRESS]/action?cmd=[COMMAND]`. The app uses “no-cors” requests, so the robot runs commands but the browser may not show confirmation because of security rules.

## Controls

### Gamepad (Xbox / PlayStation)

Connect a Bluetooth or USB gamepad. The app detects it automatically; press any button to activate.

| Input           | Action           | Command   |
|----------------|------------------|-----------|
| Left Stick Y-  | Walk forward     | `kwk`     |
| Left Stick Y+  | Walk backward    | `kbk`     |
| Left Stick X-  | Turn left        | `kturnL`  |
| Left Stick X+  | Turn right       | `kturnR`  |
| Button A (0)   | Stop / Balance   | `kbalance`|
| Button B (1)   | Sit              | `ksit`    |
| Button X (2)   | Say Hi           | `khi`     |
| Select / Back  | **Emergency stop** | `kbalance` |

Additional mappings (e.g. Y for Pee, LB/RB for Pushup/Stretch) are available; see the in-app Docs panel for the full table.

### AI voice and text

- **Microphone:** Click the mic and speak (e.g. “Do a pushup then bark twice”). The AI converts your words into OpenCat commands.
- **Text:** Type natural language in the AI controller; the app sends the resulting command sequence to the robot.

**Requirement:** Set `GEMINI_API_KEY` in `.env.local` when running locally so the AI features work.

## Terminal

Use the in-app **Terminal** to send raw OpenCat protocol commands. Type a command and press Enter. For a full list of commands, see the [OpenCat protocol reference](opencat-protocol.md).

## Troubleshooting

### Robot stutters while walking

Commands are being sent too fast and reset the gait. The app uses an “edge trigger” to limit this. Keep the Bluetooth signal strong and avoid spamming movement buttons.

### Bluetooth “Device not supported”

You’re likely in Safari on iOS. Use **Bluefy** on iOS or **Chrome** on Android. On desktop, use Chrome or Edge.

### Gyro / balance seems wrong

Put the robot on a flat surface. Send `c` to calibrate or `kbalance` to reset posture.

### WiFi not responding

Check that the Bittle and your computer are on the same network, that the IP is correct, and that the BiBoard is running the WiFi firmware.

## External resources

- [Petoi Doc Center](https://docs.petoi.com/)
- [OpenCat GitHub](https://github.com/PetoiCamp/OpenCat)
- [Bittle product page](https://www.petoi.com/pages/bittle-open-source-bionic-robot-dog)
