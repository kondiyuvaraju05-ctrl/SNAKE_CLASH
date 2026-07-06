# 🐍 Snake Clash

A premium, highly interactive, and visually stunning retro-themed **Snake Game** built with **React**, **Vite**, **Tailwind CSS v4**, and **Motion**. Features multiple challenge modes, dynamic gameplay elements, retro arcade sounds, and automated GitHub Pages deployment.

---

## 🎮 Live Demo & GitHub Pages Deployment

This repository is pre-configured with a **GitHub Actions CI/CD pipeline** located in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). 

Every push to the `main` branch automatically builds the production bundle and deploys it to **GitHub Pages** at:
`https://kondiyuvaraju05-ctrl.github.io/SNAKE_CLASH/`

---

## ✨ Features

*   **⚡ Modern Stack**: Built on React 19, Vite, TypeScript, and Tailwind CSS v4.
*   **🎭 Smooth Animations**: Dynamic animations powered by `motion` for menus, gameplay transitions, and high-score celebrations.
*   **🎨 Rich Retro Aesthetics**: High-contrast neon ambient lighting, custom SVG cartoon snake mascots, and arcade scanlines.
*   **🔊 Audio Engine**: Nostalgic audio effects for game starts, eating eggs, special food, moving, and game-over states (with mute toggle).
*   **🏆 Persistence**: Automatic high score saving and syncing via LocalStorage, with an easily accessible reset button on the top left.
*   **📱 Responsive & Fluid**: Optimized canvas sizing for both desktop keyboard inputs and mobile layout viewports.

---

## 🕹️ Game Modes

Test your reflexes across six distinct arena modes:

1.  **Classic Mode**: The traditional snake experience. Grow as long as possible by eating eggs.
2.  **Maze Escape**: Navigate complex obstacles and locate the portal gate to clear the stage.
3.  **Shrinking Arena**: Watch your step! The grid size slowly shrinks over time, restricting your movement.
4.  **Snake Survival**: Dodge hazards, avoid walls, and maintain your snake's health to survive.
5.  **Laser Walls**: Laser beams warn you before firing across columns or rows. Step out of the path to avoid getting sliced!
6.  **Obstacle Rush**: Dodge random barriers and objects that populate the board dynamically.

---

## ⚡ Difficulty Levels

Adjust your speed and score multipliers using three levels of difficulty:
*   **Easy**: Slower pacing, perfect for mastering tight turns.
*   **Medium**: Standard speed for regular players.
*   **Hard**: Blazing fast ticks, demanding split-second reaction times!

---

## 🛠️ Local Development Setup

To run this project locally, ensure you have **Node.js** installed on your system.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/kondiyuvaraju05-ctrl/SNAKE_CLASH.git
    cd SNAKE_CLASH
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Local Server**:
    ```bash
    npm run dev
    ```

4.  **Open in Browser**:
    Navigate to `http://localhost:3000/` to start playing!

---

## ⚙️ Configuration details

*   **Vite Base Path**: Configured dynamically in [vite.config.ts](vite.config.ts) to support both absolute roots for local testing (`/`) and sub-directories for GitHub Pages deployment (`/SNAKE_CLASH/`).
*   **HMR (Hot Module Replacement)**: Configured to support toggles in developmental contexts to minimize rendering noise.
