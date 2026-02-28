# OpenCat Protocol Reference

Bittle X Explorer sends **ASCII strings** over BLE, Serial, or WiFi. These are OpenCat protocol commands. You can type them in the app’s **Terminal** or they are used internally by the control pad, skills, and AI.

For the full OpenCat specification and firmware details, see the [Petoi Doc Center](https://docs.petoi.com/) and [OpenCat GitHub](https://github.com/PetoiCamp/OpenCat).

---

## Postures

| Command   | Description        |
|----------|--------------------|
| `kbalance` | Stand / stop / balanced posture |
| `ksit`     | Sit down           |
| `kstr`     | Stretch            |
| `d`        | Shutdown / rest    |
| `krest`    | Rest / sleep       |
| `kbuttUp`  | Butt up            |
| `kcalib`   | Calibrate          |
| `kup`      | Get up             |
| `kzero`    | Zero pose          |

## Gaits and movement

| Command   | Description        |
|----------|--------------------|
| `kwkF`    | Walk forward       |
| `kwkL`    | Walk left          |
| `kwkR`    | Walk right         |
| `kbk`     | Walk backward      |
| `kbkL`    | Back left          |
| `kbkR`    | Back right         |
| `kcrF`    | Crawl forward      |
| `kcrL`    | Crawl left         |
| `ktrF`    | Trot forward       |
| `ktrL`    | Trot left          |
| `kbdF`    | Bound forward      |
| `kjpF`    | Jump forward       |
| `kvtF`    | Step origin        |
| `kvtL`    | Spin left          |

## Behaviors

| Command   | Description        |
|----------|--------------------|
| `khi`     | Say hi / hello     |
| `kpee`    | Pee (trick)        |
| `kpu`     | Push ups           |
| `kpu1`    | Single push up     |
| `krl`     | Roll over          |
| `kck`     | Check surroundings |
| `kbf`     | Backflip           |
| `kff`     | Front flip         |
| `kchr`    | Cheers / victory   |
| `kbx`     | Boxing             |
| `khds`    | Handstand          |
| `kmw`     | Moonwalk           |
| `kscrh`   | Scratch            |
| `ksnf`    | Sniff              |
| `ktbl`    | Table              |
| `kwh`     | Wave head          |
| `kang`    | Angry              |
| `kdg`     | Dig                |
| `khg`     | Hug                |
| `kfiv`    | High five          |
| `kgdb`    | Good boy           |
| `kkc`     | Kick               |
| `kpd`     | Play dead          |
| `krc`     | Recover from fall  |

## Servos

Direct joint control: `m<index> <angle>`.

| Example   | Description              |
|----------|--------------------------|
| `m0 30`  | Head pan to 30°          |
| `m1 -20` | Head tilt to -20°        |
| `m8 60`  | Move joint 8 to 60°      |

Use `m` (no args) for joint status/diagnostics if supported by your firmware.

## Vision (Grove AI / Mu Vision)

| Command | Description   |
|---------|---------------|
| `C0`    | Vision stop   |
| `C1`    | Color         |
| `C2`    | Body          |
| `C3`    | Face          |
| `C5`    | Gesture       |

## Sound

| Command       | Description   |
|---------------|---------------|
| `b10,8`       | Beep          |
| `b14,8,14,8`  | Bark          |
| `b10,4,12,4,14,4,16,8` | Sing  |

## System and diagnostics

| Command   | Description              |
|----------|--------------------------|
| `v`      | Battery voltage (returns value) |
| `g`      | Toggle gyro on/off       |
| `z`      | Toggle random behavior   |
| `c`      | Calibrate (e.g. on flat surface) |

---

**Note:** Exact behavior depends on your board (BiBoard vs NyBoard) and firmware. When in doubt, refer to Petoi’s OpenCat documentation.
