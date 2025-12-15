# Army SMP Store ⚔️

![Army SMP Banner](public/vite.svg) (*Replace with actual banner if available*)

Welcome to the official **Army SMP Store** frontend source code. This is a modern, responsive, and high-performance React application built for the Army SMP Minecraft server community. It allows players to purchase Ranks, Keys, Crates, and Coins seamlessly.

## 🚀 Features

- **Store System**: Browse and purchase items with a smooth, category-based UI.
- **Dark Mode Aesthetic**: A premium, "gaming" inspired dark theme with energetic accent colors.
- **Ranks & Features**: Detailed breakdown of server ranks and benefits.
- **Product Modal**: fast and responsive product details view.
- **Mobile Optimized**: Fully responsive design that looks great on Phones, Tablets, and Desktops.
- **Copy IP**: Easy "Click to Copy" Server IP functionality on the home page.

## 🛠️ Tech Stack

- **Frontend**: [React.js](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Optimized with CSS Variables)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: React Router DOM

## 📂 Project Structure

```bash
src/
├── components/      # Reusable UI components (Navbar, Footer, ProductCard, etc.)
├── data/           # Static data for Products (Ranks, Keys, etc.)
├── pages/          # Main route pages (Home, Store)
├── App.jsx         # Main application layout
├── index.css       # Global styles and variables
└── main.jsx        # Entry point
```

## ⚡ Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 16 or higher)
- npm (Node Package Manager)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Start-Army-SMP/website.git
    cd website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Go to `http://localhost:5173/` to prevent conflicts, check your terminal for the exact port.

## 📝 Customization

- **Change Colors**: Edit `src/index.css` and modify the `:root` variables (`--primary`, `--accent`, etc.).
- **Update Products**: Edit `src/data/products.js` to add or remove store items.
- **Update Server IP**: Edit `src/pages/Home.jsx` to change the IP address.

## 📄 License

This project is proprietary software for Army SMP. Unauthorized distribution involves copy-right infringement.

---
*Built with ❤️ for the Army SMP Community.*
