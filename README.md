# Nyanbar Anime Streaming Website

A modern anime streaming website that integrates with AniList for anime metadata and nyaa.si for download links. Built with React, TypeScript, Node.js, and Tailwind CSS.

## Features

- 🎬 **AniList Integration**: Fetch detailed anime information using AniList IDs
- 🔍 **Search Functionality**: Search anime by title with real-time results
- 📥 **Nyaa.si Integration**: Get download links and magnet links from nyaa.si
- 🏠 **Home Page**: Display trending and popular anime
- 📱 **Responsive Design**: Modern UI that works on all devices
- ⚡ **Fast Performance**: Optimized for speed and user experience

## Tech Stack

### Frontend

- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

### Backend

- Node.js with Express
- Axios for external API calls
- Cheerio for web scraping
- CORS enabled for cross-origin requests

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nyanbar
   ```

2. **Install all dependencies**

   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and the frontend development server (port 3000).

## Manual Installation

If you prefer to install dependencies manually:

### Backend Setup

```bash
cd server
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm start
```

## Usage

### Adding Custom Anime

1. Navigate to the "Add Anime" page
2. Enter an AniList ID (you can find this in the URL of any anime on AniList)
3. Click the add button to fetch anime information and nyaa.si links

### Finding AniList IDs

- Go to [AniList](https://anilist.co)
- Search for any anime
- The ID is in the URL: `https://anilist.co/anime/ID/title`

### Example AniList IDs

- Attack on Titan: `16498`
- Demon Slayer: `38000`
- Jujutsu Kaisen: `11757`
- One Piece: `21`

## API Endpoints

### Backend API (Port 5000)

- `GET /api/anime/:id` - Get anime by AniList ID
- `GET /api/search?query=:query` - Search anime by title
- `GET /api/torrents/:animeTitle` - Get nyaa.si torrents for anime
- `GET /api/popular` - Get popular anime
- `GET /api/trending` - Get trending anime

## Project Structure

```
nyanbar/
├── server/                 # Backend Node.js/Express server
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # Frontend React application
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
├── package.json           # Root package.json
└── README.md             # This file
```

## Features in Detail

### Home Page

- Displays trending and popular anime from AniList
- Responsive grid layout
- Hover effects and animations

### Search Page

- Real-time search functionality
- Search by anime title
- Results with cover images and basic info

### Custom Anime Page

- Add anime by AniList ID
- Display comprehensive anime information
- Show nyaa.si download links
- Magnet link support

### Anime Detail Page

- Full anime information display
- Character information
- Studio details
- Download links from nyaa.si

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for educational purposes only. Please respect copyright laws and only download content that you have the right to access. The developers are not responsible for any misuse of this application.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
