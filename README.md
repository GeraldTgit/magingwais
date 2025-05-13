# MagingWais - Shopping List Application

A modern shopping list application built with React, FastAPI, and Supabase.

## 🚀 Features

- Google Authentication
- Create and manage shopping lists
- Add items to lists
- Share lists with others
- Real-time updates
- Responsive design

## 🛠️ Tech Stack

- **Frontend**: React, Vite, React Router
- **Backend**: FastAPI, Python
- **Database**: Supabase
- **Authentication**: Google OAuth
- **Deployment**: Vercel (Frontend), Railway (Backend)

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.10 or higher)
- Git
- Supabase account
- Google Cloud Console account
- Railway account
- Vercel account

## 🚀 Getting Started

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/GeradTgit/magingwais.git
   cd magingwais
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=your_backend_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

## 🚀 Deployment

### Backend Deployment (Railway)

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set the following environment variables:
   - `GOOGLE_CLIENT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy the backend directory

### Frontend Deployment (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the following environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`
4. Deploy the project

## 🔧 Environment Variables

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_url
```

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/GeradTgit/magingwais.git
cd magingwais
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## 🔧 Development

The project uses Vite for blazing fast development with features like:
- Hot Module Replacement (HMR)
- Fast Refresh
- Optimized builds
- TypeScript support

## 🏗️ Project Structure

```
magingwais-vite/
├── src/
│   ├── pages/         # Page components
│   ├── components/    # Reusable components
│   ├── images/        # Image assets
│   ├── lib/          # Utility functions and configurations
│   └── styles/       # CSS styles
├── public/           # Public assets
└── ...
```

## 🎨 Key Features

- **Smart List Management**
  - Create and organize multiple shopping lists
  - Add items with detailed information
  - Track quantities and prices
  - Mark items as bought

- **Price Tracking**
  - Record SRP (Suggested Retail Price)
  - Track actual purchase prices
  - Compare prices across different stores

- **Privacy Controls**
  - Make lists public or private
  - Share public lists with others
  - Control item visibility

- **User Experience**
  - Clean, modern interface
  - Smooth animations
  - Responsive design
  - Easy navigation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Gerald Dave Trajano - Initial work

## 🙏 Acknowledgments

- Vite team for the amazing build tool
- React team for the incredible framework
- Supabase for the backend infrastructure
- All contributors who have helped shape this project