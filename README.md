# SiteCraft - Website Accessibility Analysis Tool

A comprehensive web accessibility analysis tool that provides instant insights into website compliance and generates detailed reports with actionable recommendations.

## Features

- **Comprehensive Analysis**: Uses axe-core and custom checks for thorough accessibility evaluation
- **Real-time Reporting**: Instant analysis results with detailed scoring
- **WCAG Compliance**: Checks against Web Content Accessibility Guidelines
- **Actionable Recommendations**: Specific guidance for fixing accessibility issues
- **Modern UI**: Clean, responsive React frontend
- **Export Reports**: Download detailed analysis reports

## Tech Stack

### Backend
- Node.js with Express
- Puppeteer for web scraping
- axe-core for accessibility analysis
- Winston for logging
- Express rate limiting and security

### Frontend
- React 18 with hooks
- Styled Components for styling
- React Router for navigation
- Axios for API calls
- React Icons for UI elements

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Windows Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Site
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   ```bash
   cd ../backend
   copy .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   LOG_LEVEL=info
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:3001

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

3. **Open Browser**
   Navigate to http://localhost:3000 to use the application

## Usage

1. **Enter Website URL**: Input the URL of the website you want to analyze
2. **Start Analysis**: Click "Analyze Website" to begin the accessibility audit
3. **View Results**: Review the comprehensive report with scores and recommendations
4. **Download Report**: Export the analysis results as a text file

## API Endpoints

- `POST /api/accessibility/analyze` - Analyze a website for accessibility issues
- `GET /api/accessibility/health` - Check API health status
- `GET /api/accessibility/demo` - Get API information

## Analysis Features

### Accessibility Checks
- Image alt text validation
- Form label associations
- Color contrast analysis
- Heading structure validation
- Link accessibility
- ARIA attributes
- Keyboard navigation

### Scoring System
- **Overall Score**: Combined accessibility and usability score (0-100)
- **Accessibility Score**: WCAG compliance rating
- **Custom Score**: Additional best practices validation

### Report Contents
- Executive summary with key metrics
- Detailed violation descriptions
- Prioritized recommendations
- Element-specific guidance
- Impact assessment

## Development

### Backend Structure
```
backend/
├── routes/          # API route handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── utils/          # Utility functions
└── logs/           # Application logs
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/      # Page components
│   ├── services/   # API services
│   ├── styles/     # Global styles
│   └── utils/      # Utility functions
└── public/         # Static assets
```

## Windows-Specific Notes

- Uses Windows-compatible file paths
- Puppeteer configured for Windows Chrome
- CORS settings for local development
- Windows command examples in documentation

## Troubleshooting

### Common Issues

1. **Puppeteer Installation Issues**
   ```bash
   npm install puppeteer --force
   ```

2. **Port Already in Use**
   ```bash
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

3. **CORS Issues**
   - Ensure backend is running on port 3001
   - Check FRONTEND_URL in .env file

4. **Memory Issues**
   - Restart both servers
   - Check Windows Task Manager for resource usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the console logs
- Ensure all dependencies are installed correctly