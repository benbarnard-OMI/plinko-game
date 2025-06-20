<div align="center">
  <img src="./static/android-chrome-192x192.png" width="100" height="100" alt="Logo">
  <h1>plinko-game</h1>
  <p>A web Plinko game inspired by Stake.com's Plinko game.</p>
  <p>Play now 👉 <a href="https://plinko-web-game.netlify.app/" target="_blank" rel="noreferrer">https://plinko-web-game.netlify.app/</a></p>
  <img src="./screenshots/desktop-1.jpg" width="800">
</div>

## About

Plinko is a classic game where the player drops a token through a field of pegs, where it bounces randomly until it reaches one of the prize bins at the bottom.

This project creates a physical arcade-style Plinko game using [Svelte](https://svelte.dev/), [Tailwind CSS](https://tailwindcss.com/), and [matter-js](https://github.com/liabru/matter-js) for the visual simulation, combined with real hardware sensors for token detection. Players drop a physical token and receive a real prize based on which bin it lands in - no scoring, betting, or gambling involved.

### This project is NON-PROFIT

Please do NOT send me emails or invitations asking me to implement a Plinko game for your company or personal portfolio. This project is for personal hobby only. It is NOT a promotion, and I will IGNORE any freelance invitations 🙏.

Please fork this project on your own if you want to build on top of it.

## Features

- 🎯 Physical token drop with real prize rewards
- 🎮 Arcade-style interactive experience  
- 📺 Visual simulation synchronized with physical gameplay
- 🔧 Hardware integration with IR sensors and microcontroller
- 🎨 Attractive lighting and sound effects
- 📱 Responsive design for various display sizes

## Game Design

This is a **physical prize game**, not a gambling or scoring system:

- **Single Play**: Players drop one token per game
- **Physical Prizes**: Each bin corresponds to a real prize (toys, candy, tickets, etc.)
- **No Scoring**: No points, money, or betting involved
- **Arcade Experience**: Focus on fun, spectacle, and immediate reward
- **Family Friendly**: Suitable for all ages

The visual simulation shows the token's path for entertainment while the physical token determines the actual prize.

## Development

### Getting Started

> [!NOTE]
> Requires Node.js 20 or later.

1. Install [pnpm](https://pnpm.io/installation) version 9 or later
2. Clone this repository
3. Install dependencies

   ```bash
   pnpm install
   ```

4. Start the development server

   ```bash
   pnpm dev
   ```

### Building for Production

The entire site is statically generated using [@sveltejs/adapter-static](https://github.com/sveltejs/kit/tree/main/packages/adapter-static).

1. Generate a static build

   ```bash
   pnpm build
   ```

2. Preview the build site

   ```bash
   pnpm preview
   ```

### Testing

For unit tests, run:

```bash
pnpm test:unit
```

For end-to-end tests powered by [Playwright](https://playwright.dev/):

1. Build for production

   ```bash
   pnpm build
   ```

2. Run the tests

   ```bash
   # Run in UI mode (recommended when writing tests)
   pnpm test:e2e:ui

   # Alternatively, run in headless mode
   pnpm test:e2e
   ```

### Benchmark

A hidden page is only available in local dev environment to benchmark the payout probabilities and expected values. I used this page to tune the parameters of the matter-js physics engine and control the expected payout.

To visit this page, visit the below URL after starting the development server with `pnpm dev`:

```
http://localhost:5173/benchmark
```

## Hardware & Arcade Integration

This project is designed for local use on a thin client or SBC (e.g., Raspberry Pi) with a regular Raspberry Pi Pico (not Pico W) as the microcontroller. The Pico connects via USB serial and manages:
- **IR sensors** (break-beam or reflective) to detect token drops behind the LCD
- **Lights and sound** for arcade effects (future updates will expand protocol)
- **Token collection** for quiet, continuous play

### Physical Integration Details
- **Sensors:** Digital IR sensors (break-beam or reflective) are used to detect token drops behind the LCD screen. Tokens are collected quietly for reuse, allowing continuous play for multiple users while the visual simulation proceeds.
- **Microcontroller Logic:** The Raspberry Pi Pico may also control additional hardware such as lights and sound effects to enhance the user experience. Future updates will include protocol details for sending commands from the backend to the Pico to trigger these effects.

### Physical Pinout Example (Pico)
| Function         | Pico Pin Example | Notes                  |
|------------------|-----------------|------------------------|
| IR Sensor 1      | GP0             | Digital input          |
| IR Sensor 2      | GP1             | Digital input          |
| LED Strip Data   | GP2             | WS2812/NeoPixel        |
| Speaker (PWM)    | GP3             | Passive buzzer/speaker |
| GND              | GND             | Common ground          |
| VBUS/3V3         | VBUS/3V3        | Power for sensors      |

> See `backend/config/pinout.md` for more details (to be created).

### Example Firmware Repo
- Firmware for the Pico should be kept in a separate repo or `firmware/` directory. Example: [pico-plinko-firmware](https://github.com/your-org/pico-plinko-firmware) (to be created).

## More Screenshots

Mobile:

| Manual Mode                             | Auto Mode                               |
| --------------------------------------- | --------------------------------------- |
| ![Mobile 1](./screenshots/mobile-1.jpg) | ![Mobile 2](./screenshots/mobile-2.jpg) |

## Hardware Integration: Real-World Sensor Support

### Overview
This project can be adapted to use real-life physical sensors connected to a Raspberry Pi Pico microcontroller, which communicates with the host system via serial. The game logic will use real sensor data instead of simulated or random data.

### Hardware Requirements
- Raspberry Pi Pico microcontroller
- Physical sensors (e.g., buttons, switches, or other input devices relevant to Plinko gameplay)
- USB cable for Pico-to-host connection
- Host system running Node.js 20+

### Serial Communication Protocol
- The Pico should send sensor data as newline-terminated JSON or CSV strings (e.g., `{ "event": "drop", "bin": 3 }\n`)
- Each message should represent a single event (e.g., ball drop, bin hit, etc.)
- The baud rate and serial port name must be configurable in the backend

### Backend Service (Node.js)
- Uses the `serialport` library to read data from the Pico
- Parses incoming serial data and emits events to the frontend via WebSocket (preferred) or HTTP API
- Handles errors, malformed data, and connection loss gracefully
- Provides a simulation mode for development without hardware (see conventions below)

### Frontend Integration
- The Svelte frontend connects to the backend via WebSocket or HTTP
- Game logic is refactored to use real-time sensor data events
- UI updates in sync with physical events

### Development Conventions
- **Code Structure:**
  - All hardware/serial logic resides in a dedicated backend directory (e.g., `backend/`)
  - Frontend code remains in `src/`, with a clear interface for receiving real/simulated events
- **Simulation Mode:**
  - The backend must support a simulation mode (e.g., via an environment variable or CLI flag)
  - In simulation mode, the backend generates mock sensor events at a configurable rate
  - The frontend should be able to connect to either real or simulated data sources
- **Configuration:**
  - Serial port name, baud rate, and simulation mode are set via environment variables or a config file
  - Document all configuration options in this README
- **Testing:**
  - Provide scripts or instructions for testing the backend with and without hardware
  - Include example Pico firmware code for sending test data
- **Error Handling:**
  - The backend must log and handle serial errors, malformed data, and disconnects
  - The frontend should display connection status and error messages
- **Documentation:**
  - All hardware and protocol details must be kept up to date in this README
  - Document how to add new sensor types or events

### Example Workflow
1. Connect the Pico and sensors to the host system
2. Flash the Pico with firmware that sends sensor events over serial
3. Start the backend service (real or simulation mode)
4. Start the frontend and connect to the backend
5. Play the game using real sensor input

## Arcade Experience & Enhanced Presentation

This project aims to go beyond a simple web simulation by creating an immersive, arcade-style Plinko experience. The goal is to combine physical interaction (real token drops detected by IR sensors) with:
- Dynamic lighting effects (e.g., addressable LEDs, light chases, bin highlights)
- Synchronized sound effects and music
- Animated, visually rich UI on the LCD
- Real-time feedback between physical actions and digital presentation

The Raspberry Pi Pico will be used not only for sensor input, but also to control lights and sound, making the game feel like a true arcade attraction. Contributors are encouraged to propose and implement creative effects, transitions, and interactive features that enhance the fun and spectacle of the game.

## Project Structure & Conventions

### Directory Layout
```
plinko-game/
├── backend/           # All backend code (serial, WebSocket, simulation, config)
│   ├── server.js      # Main backend entry point
│   ├── lib/           # Backend libraries/utilities
│   ├── config/        # Configuration files (e.g., default.json, .env)
│   └── ...
├── src/               # Svelte frontend code
│   └── ...
├── tests/             # Test scripts and test data
└── ...
```

### Configuration
- Use a `.env` file or `backend/config/default.json` for backend configuration.
- Required environment variables:
  | Variable         | Description                        | Example           |
  |------------------|------------------------------------|-------------------|
  | SERIAL_PORT      | Serial port for Pico               | /dev/ttyACM0      |
  | SERIAL_BAUD      | Baud rate for serial communication | 115200            |
  | SIMULATION_MODE  | Enable simulation (true/false)     | true              |
  | WS_PORT          | WebSocket server port              | 4000              |

### Serial Protocol: Message Schemas
- All messages are newline-terminated JSON objects.
- Example events:
  | Event Type | Example Payload                          | Description                  |
  |------------|------------------------------------------|------------------------------|
  | drop       | `{ "event": "drop", "bin": 3 }`         | Token detected in bin 3      |
  | light      | `{ "event": "light", "pattern": "win"}` | Trigger light pattern        |
  | sound      | `{ "event": "sound", "effect": "win"}`  | Trigger sound effect         |
  | error      | `{ "event": "error", "msg": "sensor"}`  | Error from microcontroller   |

### Frontend-Backend API
- WebSocket messages are JSON objects mirroring the serial protocol.
- Example frontend event flow:
  1. Backend receives `{ "event": "drop", "bin": 2 }` from Pico
  2. Backend emits same event to all connected frontends
  3. Frontend updates UI and triggers effects
- Extendable: Add new event types as needed, document in this section.

### Simulation Mode
- Activate by setting `SIMULATION_MODE=true` in `.env` or config.
- Backend generates mock events at a configurable rate (e.g., 1 drop/sec).
- Simulated events use the same schema as real events.
- Useful for frontend development and testing without hardware.

### Code Style & Contribution
- Use Prettier and ESLint for code formatting and linting (see `.prettierrc`, `.eslintrc` if present).
- Use clear, descriptive commit messages (e.g., `feat: add light event support`).
- Open pull requests for all changes; include tests and documentation updates.
- Follow the directory structure and keep code modular.

### Extending the System
- To add a new sensor or event:
  1. Update Pico firmware to emit new event type
  2. Update backend to handle and forward the event
  3. Update frontend to react to the event
  4. Document the new event in the Serial Protocol section

### Dependencies
- Backend: Node.js 20+, `serialport`, `ws` (WebSocket), `dotenv` (for config)
- Frontend: Svelte, Vite, Tailwind CSS
- Install backend dependencies in `backend/` with `npm install` or `pnpm install`

---
# Example Config Files

### `.env` Example
```
SERIAL_PORT=/dev/ttyACM0
SERIAL_BAUD=115200
SIMULATION_MODE=false
WS_PORT=4000
```

### `backend/config/default.json` Example
```
{
  "serialPort": "/dev/ttyACM0",
  "baudRate": 115200,
  "simulationMode": false,
  "wsPort": 4000
}
```

### Sample Backend Entry Point (`backend/server.js`)
```js
require('dotenv').config();
const { SerialPort } = require('serialport');
const WebSocket = require('ws');
// ...rest of backend logic...
```

---
# Serial Protocol: Full Schema

All messages are newline-terminated JSON objects. Example schema:

```json
{
  "event": "drop",        // required, string: event type (drop, light, sound, error, ...)
  "bin": 3,                // optional, number: bin index (for drop)
  "pattern": "win",       // optional, string: light pattern (for light)
  "effect": "win",        // optional, string: sound effect (for sound)
  "msg": "sensor error"   // optional, string: error message (for error)
}
```
- Required: `event` (string)
- Optional: other fields depend on event type
- Unknown or malformed messages should be ignored and logged by the backend
- Protocol versioning: add a `version` field if breaking changes are made

---
# Automated Testing & CI

- All new code should include unit and integration tests (see `tests/` directory)
- Use Playwright for end-to-end tests
- Code coverage should be measured (e.g., with `nyc` or `c8` for Node.js)
- CI: Add a `.github/workflows/ci.yml` for GitHub Actions or similar (to be created)
- PRs must pass all tests and lint checks before merge

---
# Contribution Process

- File issues and feature requests via GitHub Issues
- Fork and open Pull Requests for all changes
- Use `main` for stable, `dev` for active development (feature branches encouraged)
- All PRs require review and must include tests and documentation updates
- Follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/)

---
# License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## TV Show Plinko Adaptation

### Game Board Layout
The game uses a **uniform width** layout based on the classic TV show:
- **Rectangular grid** of pegs (same width top to bottom)
- Multiple drop slots across the entire top width
- Uniform grid of pegs in rows and columns
- Same number of prize bins at bottom as drop slots at top
- Typically 9 drop slots and 9 prize bins

### Prize System
Instead of monetary payouts, each bin represents a physical prize:
- **Prize Bins**: Each bin corresponds to a different prize tier or specific item
- **Prize Display**: Visual indicators show what prize each bin contains
- **Prize Dispensing**: Hardware integration can trigger prize dispensers or alert operators
- **Configurable Prizes**: Easy to change what prizes are associated with each bin

### Planned Implementation
1. Remove all gambling/scoring mechanics from the existing code
2. Replace payout tables with prize configuration system
3. Implement uniform rectangular pin grid layout
4. Add prize display and management interface
5. Integrate with prize dispensing or notification hardware
6. Focus on visual spectacle and entertainment value

This creates a true arcade experience focused on fun and immediate physical rewards.
