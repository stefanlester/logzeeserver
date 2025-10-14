const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'firstfortune-super-secret-key-2025';

// Enhanced CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://logzeeserver.onrender.com',  
    '*'  // Temporarily allow all origins for testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory databases (replace with real database in production)
const users = [
    {
        id: 1,
        email: 'demo@firstfortunesecurities.com',
        password: '$2a$10$IDUjoGHbIz0yReUtfLUfJuVFw883xU9l0h5u0Df8pzT78/.z0DuKO', // demo123
        firstName: 'Demo',
        lastName: 'User',
        company: 'FirstFortune Securities',
        phone: '+1 (800) 555-DEMO',
        role: 'customer',
        verified: true,
        createdAt: new Date('2025-01-01')
    },
    {
        id: 2,
        email: 'admin@firstfortunesecurities.com',
        password: '$2a$10$D7fne4VLoIPDvfPGhyG2qOLPh29/e9uR4nauGvZof0mITTL7y2ziy', // admin123
        firstName: 'Admin',
        lastName: 'User',
        company: 'FirstFortune Securities',
        phone: '+1 (800) 555-ADMIN',
        role: 'admin',
        verified: true,
        createdAt: new Date('2025-01-01')
    }
];

let shipments = [
  {
    id: "LZ2025001",
    trackingNumber: "LZ2025001",
    origin: "New York, NY",
    destination: "Los Angeles, CA",
    status: "In Transit",
    currentLocation: "Chicago, IL",
    estimatedDelivery: "2025-07-25",
    weight: "45.2 kg",
    service: "Express Delivery",
    userId: 1, // Associated with demo user
    history: [
      {
        timestamp: "2025-07-18 09:00",
        location: "New York, NY",
        status: "Package picked up",
        description: "Package collected from origin"
      },
      {
        timestamp: "2025-07-19 14:30",
        location: "Philadelphia, PA",
        status: "In transit",
        description: "Package in transit to sorting facility"
      },
      {
        timestamp: "2025-07-20 08:15",
        location: "Chicago, IL",
        status: "At sorting facility",
        description: "Package arrived at Chicago sorting facility"
      }
    ]
  },
  {
    id: "LZ2025002",
    trackingNumber: "LZ2025002",
    origin: "Miami, FL",
    destination: "Seattle, WA",
    status: "Delivered",
    currentLocation: "Seattle, WA",
    estimatedDelivery: "2025-07-19",
    actualDelivery: "2025-07-19",
    weight: "12.8 kg",
    service: "Standard Shipping",
    userId: 1, // Associated with demo user
    history: [
      {
        timestamp: "2025-07-16 10:00",
        location: "Miami, FL",
        status: "Package picked up",
        description: "Package collected from origin"
      },
      {
        timestamp: "2025-07-17 16:45",
        location: "Atlanta, GA",
        status: "In transit",
        description: "Package in transit"
      },
      {
        timestamp: "2025-07-18 12:20",
        location: "Denver, CO",
        status: "In transit",
        description: "Package in transit"
      },
      {
        timestamp: "2025-07-19 09:30",
        location: "Seattle, WA",
        status: "Delivered",
        description: "Package delivered to recipient"
      }
    ]
  },
  {
    id: "LZ2025003", 
    trackingNumber: "LZ2025003",
    origin: "Houston, TX",
    destination: "Boston, MA",
    status: "Processing",
    currentLocation: "Houston, TX",
    estimatedDelivery: "2025-07-28",
    weight: "78.5 kg",
    service: "Freight Service",
    userId: 2, // Associated with admin user
    history: [
      {
        timestamp: "2025-07-20 07:30",
        location: "Houston, TX",
        status: "Order received",
        description: "Shipment order created and processing"
      }
    ]
  }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : '1d';
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            }, 
            JWT_SECRET, 
            { expiresIn: tokenExpiry }
        );
        
        // Return user info (without password) and token
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userInfo
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, company, phone, password } = req.body;
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            company: company || null,
            phone,
            role: 'customer',
            verified: false,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Return success (without password)
        const { password: _, ...userInfo } = newUser;
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userInfo
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/auth/forgot-password', (req, res) => {
    try {
        const { email } = req.body;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
        }
        
        // In production, generate reset token and send email
        console.log(`Password reset requested for: ${email}`);
        
        res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    // If middleware passes, token is valid
    res.json({ success: true, message: 'Token is valid', user: req.user });
});

// Protected User Routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const { password: _, ...userInfo } = user;
    res.json({ success: true, data: userInfo });
});

app.get('/api/user/shipments', authenticateToken, (req, res) => {
    const userShipments = shipments.filter(s => s.userId === req.user.id);
    res.json({ success: true, data: userShipments, count: userShipments.length });
});

// Public Tracking Routes
app.get('/api/track/:trackingNumber', optionalAuth, (req, res) => {
  const { trackingNumber } = req.params;
  
  const shipment = shipments.find(s => 
    s.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
  );
  
  if (!shipment) {
    return res.status(404).json({
      success: false,
      message: 'Tracking number not found. Please check your tracking number and try again.',
      trackingNumber: trackingNumber
    });
  }

  // If user is authenticated and owns this shipment, return full details
  // Otherwise, return limited public information
  let responseData = shipment;
  if (!req.user || shipment.userId !== req.user.id) {
    // Public tracking - hide sensitive information
    responseData = {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      currentLocation: shipment.currentLocation,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      service: shipment.service,
      history: shipment.history.map(h => ({
        timestamp: h.timestamp,
        location: h.location,
        status: h.status,
        description: h.description
      }))
    };
  }
  
  res.json({
    success: true,
    data: responseData
  });
});

// Protected Shipment Management Routes
app.get('/api/shipments', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    // Admin can see all shipments
    res.json({
      success: true,
      data: shipments,
      count: shipments.length
    });
  } else {
    // Regular users can only see their own shipments
    const userShipments = shipments.filter(s => s.userId === req.user.id);
    res.json({
      success: true,
      data: userShipments,
      count: userShipments.length
    });
  }
});

app.post('/api/shipments', authenticateToken, (req, res) => {
  const {
    origin,
    destination,
    weight,
    service = 'Standard Shipping'
  } = req.body;
  
  if (!origin || !destination || !weight) {
    return res.status(400).json({
      success: false,
      message: 'Origin, destination, and weight are required fields'
    });
  }
  
  const trackingNumber = `LZ${new Date().getFullYear()}${(shipments.length + 1).toString().padStart(3, '0')}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 days from now
  
  const newShipment = {
    id: trackingNumber,
    trackingNumber,
    origin,
    destination,
    status: 'Processing',
    currentLocation: origin,
    estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
    weight,
    service,
    userId: req.user.id, // Associate with current user
    history: [
      {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        location: origin,
        status: 'Order received',
        description: 'Shipment order created and processing'
      }
    ]
  };
  
  shipments.push(newShipment);
  
  res.status(201).json({
    success: true,
    message: 'Shipment created successfully',
    data: newShipment
  });
});

app.put('/api/shipments/:trackingNumber/status', authenticateToken, (req, res) => {
  const { trackingNumber } = req.params;
  const { status, location, description } = req.body;
  
  const shipmentIndex = shipments.findIndex(s => 
    s.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
  );
  
  if (shipmentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Shipment not found'
    });
  }

  const shipment = shipments[shipmentIndex];
  
  // Check if user owns this shipment or is admin
  if (req.user.role !== 'admin' && shipment.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - you can only update your own shipments'
    });
  }
  
  shipment.status = status;
  shipment.currentLocation = location || shipment.currentLocation;
  
  // Add to history
  shipment.history.push({
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    location: location || shipment.currentLocation,
    status: status,
    description: description || `Status updated to ${status}`
  });
  
  shipments[shipmentIndex] = shipment;
  
  res.json({
    success: true,
    message: 'Shipment status updated',
    data: shipment
  });
});

// Admin-only routes
app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json({ success: true, data: sanitizedUsers });
});

app.get('/api/admin/shipments', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    res.json({ success: true, data: shipments });
});

// API-only root route
app.get('/', (req, res) => {
  res.json({
    message: 'FirstFortune Securities API Server',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      track: '/api/track/:trackingNumber',
      auth: '/api/auth/*',
      user: '/api/user/*',
      admin: '/api/admin/*'
    },
    documentation: 'Contact admin for API documentation'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'FirstFortune Securities Tracking API',
        version: '2.0.0',
        features: ['authentication', 'tracking', 'user_management']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: ['/api/health', '/api/track/:id', '/api/auth/login']
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚚 FirstFortune Securities Tracking Server running on port ${PORT}`);
  console.log(`� API Base: http://localhost:${PORT}/api`);
  console.log(`� Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('🔑 Demo Accounts:');
  console.log('  Customer: demo@firstfortunesecurities.com / demo123');
  console.log('  Admin: admin@firstfortunesecurities.com / admin123');
  console.log('');
  console.log('📦 Sample tracking numbers:');
  console.log('  - LZ2025001 (In Transit)');
  console.log('  - LZ2025002 (Delivered)');
  console.log('  - LZ2025003 (Processing)');
  console.log('');
  console.log('🔗 API Endpoints:');
  console.log('  • POST /api/auth/login - User login');
  console.log('  • POST /api/auth/signup - User registration');
  console.log('  • GET  /api/track/:number - Track shipment');
  console.log('  • GET  /api/user/profile - User profile (protected)');
  console.log('  • GET  /api/user/shipments - User shipments (protected)');
});

module.exports = app;
