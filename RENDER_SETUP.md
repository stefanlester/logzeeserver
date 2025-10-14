# Backend-Only Server Configuration for Render

## Required Changes for API-Only Deployment

### 1. Update server.js for API-Only Mode

Remove the static file serving and HTML routes since Hostinger will handle frontend:

```javascript
// REMOVE these lines from server.js:
app.use(express.static(path.join(__dirname, '../mannatstudio.com/html/logzee/v3')));

// REMOVE these route handlers:
app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, '../mannatstudio.com/html/logzee/v3/track.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../mannatstudio.com/html/logzee/v3/login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../mannatstudio.com/html/logzee/v3/dashboard.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../mannatstudio.com/html/logzee/v3/index.html'));
});
```

### 2. Add API-Only Root Route

Replace the removed routes with:

```javascript
// API-only root route
app.get('/', (req, res) => {
  res.json({
    message: 'FirstFortune Securities API Server',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      track: '/api/track/:trackingNumber',
      auth: '/api/auth/*',
      user: '/api/user/*'
    }
  });
});
```

### 3. Enhanced CORS Configuration

Ensure CORS allows your Hostinger domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://yourdomain.com',  // Replace with your Hostinger domain
    'https://www.yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```