# Crop Recommendation & Weather Insights Platform

## Overview
A responsive Flask + HTML/CSS/JS app that combines OpenWeather and FAO/SoilGrids soil data to recommend crops and visualize rainfall, soil pH, and crop recommendations for sustainable agriculture.

## Features
- **Crop Management System**: Expanded crop selection with detailed metadata (growth cycles, water requirements, categories)
- **Enhanced Calendar**: Responsive calendar with planting schedules and visual indicators for optimal planting windows
- **Data Export**: CSV export with customization options for recommendation lists
- **Weather Integration**: Real-time weather data from OpenWeatherMap API
- **Soil Analysis**: Soil data from FAO/SoilGrids API including pH, organic carbon, and texture
- **Responsive Design**: Mobile-first design with Chart.js visualizations

## Quick Start

### Prerequisites
- Python 3.8+
- OpenWeatherMap API key (free tier: 1,000 calls/day)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install flask requests
   ```

3. Set environment variables:
   ```powershell
   setx OPENWEATHER_API_KEY "your_api_key_here"
   ```

4. Run the application:
   ```bash
   python app.py
   ```

5. Open http://127.0.0.1:8000 in your browser

## Architecture

### Backend Structure
```
app.py              # Flask entry point
config.py           # Environment configuration
routes/             # API endpoints
  ├── pages.py      # Page routes
  ├── weather.py    # Weather API endpoints
  ├── soil.py       # Soil API endpoints
  ├── recommend.py  # Recommendation endpoints
  └── calendar.py   # Calendar endpoints
services/           # Business logic
  ├── weather.py    # Weather service with caching
  ├── soil.py       # Soil service with fallback
  └── recommender.py # Crop recommendation engine
```

### Frontend Structure
```
templates/          # HTML templates
  ├── base.html     # Base layout
  ├── dashboard.html # Main dashboard
  ├── recommendations.html # Crop recommendations
  └── calendar.html # Planting calendar
static/             # Static assets
  ├── css/styles.css # Styling
  └── js/           # JavaScript modules
```

## API Endpoints

### Weather & Location
- `GET /api/geocode?query=location` - Geocode location search
- `GET /api/weather?lat=lat&lon=lon` - Weather data for coordinates

### Soil Data
- `GET /api/soil?lat=lat&lon=lon` - Soil properties (pH, SOC, texture)

### Recommendations
- `POST /api/recommend` - Get crop recommendations for location
- `GET /api/crops` - List all available crops with metadata
- `POST /api/export/csv` - Export recommendations as CSV

### Calendar
- `GET /api/calendar?lat=lat&lon=lon` - Monthly planting calendar

## Crop Recommendation Engine

### Scoring Algorithm
The system uses a weighted scoring approach:
- **Rainfall**: 35% weight
- **Temperature**: 25% weight
- **Soil pH**: 15% weight
- **Soil Organic Carbon**: 15% weight
- **Soil Texture**: 10% weight

### Status Classification
- **Green** (≥75): Excellent match
- **Yellow** (50-74): Acceptable match
- **Red** (<50): Poor match

### Crop Categories
- **Cereals**: Rice, Wheat, Maize, Barley, Oats, Sorghum, Pearl Millet
- **Legumes**: Soybean, Chickpea, Lentil, Groundnut
- **Vegetables**: Tomato, Potato, Carrot, Onion, Cabbage, Lettuce, Spinach
- **Oilseeds**: Sunflower, Mustard, Rapeseed
- **Fiber**: Cotton
- **Cash Crops**: Sugarcane, Tea
- **Root/Tuber**: Potato, Carrot
- **Leafy**: Cabbage, Lettuce, Spinach
- **Bulb**: Onion

## UI Components

### Dashboard
- Location search with geocoding
- Weather metrics (temperature, humidity, wind)
- Soil metrics (pH, SOC, texture)
- Interactive charts (rainfall, temperature, pH gauge, SOC bar)

### Recommendations Page
- Searchable crop list
- Category and status filters
- Detailed crop cards with metadata
- CSV export functionality

### Calendar Page
- 12-month grid layout
- Color-coded suitability status
- Planting window indicators
- Responsive design for mobile devices

## Data Export Features

### CSV Export Options
- **Fields**: crop, score, status, category, growth_cycle_days, water_mm
- **Filtering**: Export filtered results only
- **Customization**: Field selection support
- **Formatting**: Proper numerical and date formatting

## Color Palette
- **Background**: Light gray (#f5f7fa)
- **Primary**: Blue (#1e90ff)
- **Secondary**: Navy (#0a2a66)
- **Accent**: Soft blue (#7fb3ff)
- **Success**: Green (#23a559)
- **Warning**: Yellow (#f5a623)
- **Error**: Red (#e74c3c)
- **Text**: Dark gray (#2f3640)

## Caching Strategy
- Weather data: 15-minute TTL
- Soil data: 24-hour TTL
- Geocoding: 1-hour TTL

## Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Mobile Responsiveness
- Responsive grid layouts
- Touch-friendly controls
- Optimized chart rendering
- Collapsible navigation on small screens

## Security Considerations
- API keys stored server-side only
- No client-side API key exposure
- Input validation on all endpoints
- CORS properly configured

## Performance Optimization
- Client-side caching for static assets
- Lazy loading of charts
- Debounced search inputs
- Efficient data filtering algorithms

## Error Handling
- Graceful fallbacks for API failures
- User-friendly error messages
- Loading states for all async operations
- Retry mechanisms for failed requests

## Future Enhancements
- User authentication and saved locations
- Historical weather data integration
- Machine learning-based recommendations
- Multi-language support
- Offline functionality
- Push notifications for planting reminders

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is open source and available under the MIT License.