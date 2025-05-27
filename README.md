## Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)
- Python 3.7 or higher
- Manim (for animation generation)
- MathTeX (for mathematical notation rendering)(not necessary but may require sometimes)

#### Installing Python
1. Download Python from the [official website](https://www.python.org/downloads/)
2. During installation, make sure to check "Add Python to PATH"
3. Verify installation by opening a terminal and running:
```bash
python --version
```

#### Installing Manim
1. Install Manim using pip:
```bash
pip install manim
```

2. Install additional dependencies:
   - For Windows:
     ```bash
     # Install MiKTeX (LaTeX distribution)
     # Download from: https://miktex.org/download
     
     # Install FFmpeg
     # Download from: https://ffmpeg.org/download.html
     # Add FFmpeg to your system PATH
     ```
   - For macOS:
     ```bash
     brew install py3cairo ffmpeg
     ```
   - For Linux:
     ```bash
     sudo apt update
     sudo apt install libcairo2-dev libpango1.0-dev ffmpeg
     ```

3. Verify Manim installation:
```bash
manim --version
```


### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install

```

### Running the Application

#### Frontend Development
To start the frontend development server:
```bash
npm run dev
```
This will start the Vite development server with hot module replacement (HMR) enabled.

#### Backend Development
To start the backend server in development mode:
```bash
cd backend
npm run dev
```
This will start the backend server with nodemon for automatic reloading.

To start the backend server in production mode:
```bash
cd backend
npm start
```

#### Building for Production
To create a production build of the frontend:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

#### Linting
To run ESLint and check for code issues:
```bash
npm run lint
```

