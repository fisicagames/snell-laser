# Snell Laser 🚀

[![License: CC BY-ND 4.0](https://img.shields.io/badge/License-CC%20BY--ND%204.0-green.svg)](https://creativecommons.org/licenses/by-nd/4.0/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-8.52.0-purple.svg)](https://www.babylonjs.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-yellow.svg)](https://vitejs.dev/)

A hyper-casual puzzle game focused on Geometric Optics concepts, built on a custom MVC framework using Babylon.js.

### [🎮 Play Now!](https://fisicagames.com.br/index.php/2026/03/22/snell-laser/)

---

## 📄 Table of Contents

* [About the Game](#-about-the-game)
* [Key Features](#-key-features)
* [How to Play](#-how-to-play)
* [Tech Stack](#-tech-stack)
* [Installation and Setup](#-installation-and-setup)
* [Architecture and Technical Highlights](#-architecture-and-technical-highlights)
* [License](#-license)
* [Author](#-author)

---

## 📖 About the Game

**Snell Laser** is an interactive simulation that transforms the principles of Geometric Optics into a logical challenge. Players must manipulate mirrors, beam splitters, and glass blocks with varying refractive indices to guide a laser beam to its target.

The project serves as an educational tool, visually demonstrating the **Snell-Descartes Law** and the phenomenon of **Total Internal Reflection (TIR)**. The scoring system rewards players for creating optically complex paths, encouraging exploration and scientific curiosity.

---

## ✨ Key Features

* **12 Progressive Levels:** Dynamically loaded from a `JSON` configuration, featuring a learning curve that introduces new optical elements at each stage.
* **Custom Optical Engine:** Light trajectory and collisions are calculated by a custom-built 2D Raycasting engine, independent of external physics libraries.
* **Physics-Based Scoring:** Points are awarded for Reflection (x10), Refraction (x20), and a high-value bonus for Total Internal Reflection (x50).
* **Skill Rank System:** Total accumulated points grant skill titles, ranging from "Beginner" to "Willebrord Snellius".
* **Persistence:** Player progress (unlocked levels and high scores) is automatically saved via `localStorage`.
* **Responsive and Multilingual:** Fully optimized for mobile browsers with native support for English and Portuguese.

---

## 🕹 How to Play

**Objective:** Hit all green targets simultaneously with the laser beam to clear the level.

#### Controls

💻 **On PC:**

* **[ ⬆ ]** / **[ ⬇ ]** or **[ W ]** / **[ S ]** : Cycle through selectable elements on the board.
* **[ ⬅ ]** / **[ ➡ ]** or **[ A ]** / **[ D ]** : Rotate the active element to adjust the laser angle.

📱 **On Mobile / Touch:**

* **[ ▲ ]** / **[ ▼ ]** : Tap the vertical virtual buttons on the left to switch the active piece.
* **[ ⟲ ]** / **[ ⟳ ]** : Hold the rotation buttons on the right to calibrate the light beam with precision.

---

## 🛠 Tech Stack

| Tool                                       | Version | Description                                                              |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------ |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3   | Core language, providing type safety and robust architecture.            |
| [Babylon.js](https://www.babylonjs.com/)      | 8.52.0  | Graphics engine for 3D rendering, animations, particles, and GUI system. |
| [Vite.js](https://vitejs.dev/)                | 7.3.1   | Build tool for ES6 module compilation, tree-shaking, and optimization.   |
| [Node.js](https://nodejs.org/en)              | 25.8.1  | Development environment and runtime.                                     |

Developed in a **Linux EndeavourOS (Kernel 6.19.8)** environment with **KDE Plasma 6.6.3**.

---

## 🚀 Installation and Setup

**Prerequisites:**

* Node.js (v20 or higher)
* NPM (v10 or higher)

**Steps:**

1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
4. Build for production (generates the `dist` folder):
   ```sh
   npm run build
   ```

---

## 🏗 Architecture and Technical Highlights

The technological cornerstone of this project is its **custom MVC Framework written in TypeScript**, refined by the author over years of research into interactive simulations. This architecture allows the simulation to run natively in mobile browsers without requiring full-screen APIs or third-party app installations.

Data flow is strictly organized using the **Model-View-Controller (MVC)** pattern via callbacks:

* **Model:** A render-agnostic layer housing the `OpticsEngine`, a custom-built Raycasting engine. It evaluates intersections against **Oriented Bounding Boxes (OBB)** in real-time using pure linear algebra, reproducing optical laws at a solid 60 FPS.
* **View:** Constructs the interface via Babylon GUI and manages a reactive translation chain (`LanguageSwitcher`), updating the UI based on state changes.
* **Controller:** Processes hardware listeners and coordinates request throttling for physical calculations to optimize battery consumption on mobile devices.

For GPU optimization, the project implements the **Factory Pattern (`MaterialFactory`)**. The engine "freezes" (`freeze()`) unique 3D material instances in VRAM and merely reassigns pointers during level transitions, completely eliminating Garbage Collection overhead and shader compilation stutters.

---

## 📜 License

This project is licensed under a **Creative Commons Attribution-NoDerivatives 4.0 International License (CC BY-ND 4.0)**. You are free to share, copy, and redistribute the game in any medium or format for any purpose, even commercially, as long as appropriate credit is given to the author and the link to [www.fisicagames.com.br](https://www.fisicagames.com.br) is maintained. You may not distribute modified versions of the source code.

**Copyright © 2026 Rafael João Ribeiro.**

---

## 👨‍🔬 Author

Developed by:
**Prof. Dr. Rafael João Ribeiro**
Federal Institute of Paraná (IFPR)
[www.fisicagames.com.br](https://www.fisicagames.com.br)