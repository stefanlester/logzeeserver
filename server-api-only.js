const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'firstfortune-super-secret-key-2025';

// Enhanced CORS configuration for production
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

// Sample shipment data
const shipments = [
    {
        trackingNumber: 'FF123456789',
        status: 'In Transit',
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        estimatedDelivery: '2025-01-15',
        currentLocation: 'Chicago, IL',
        weight: '2.5 kg',
        dimensions: '30x20x10 cm',
        service: 'Express Delivery',
        updates: [
            { timestamp: '2025-01-10 08:00', location: 'New York, NY', status: 'Package picked up' },
            { timestamp: '2025-01-11 14:30', location: 'Philadelphia, PA', status: 'In transit' },
            { timestamp: '2025-01-12 09:15', location: 'Chicago, IL', status: 'Package at sorting facility' }
        ]
    },
    {
        trackingNumber: 'FF987654321',
        status: 'Delivered',
        origin: 'Miami, FL',
        destination: 'Atlanta, GA',
        estimatedDelivery: '2025-01-08',
        actualDelivery: '2025-01-08',
        currentLocation: 'Atlanta, GA',
        weight: '1.2 kg',
        dimensions: '25x15x8 cm',
        service: 'Standard Delivery',
        updates: [
            { timestamp: '2025-01-05 10:00', location: 'Miami, FL', status: 'Package picked up' },
            { timestamp: '2025-01-06 16:45', location: 'Orlando, FL', status: 'In transit' },
            { timestamp: '2025-01-08 11:30', location: 'Atlanta, GA', status: 'Delivered' }
        ]
    }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
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

// Utility function to find user by email
const findUserByEmail = (email) => {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Utility function to find user by ID
const findUserById = (id) => {
    return users.find(user => user.id === parseInt(id));
};

// API Routes

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : '24h';
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Return user info (without password)
        const { password: userPassword, ...userInfo } = user;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userInfo
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, company, phone } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Check if user already exists
        const existingUser = findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            company: company || '',
            phone: phone || '',
            role: 'customer',
            verified: false,
            createdAt: new Date()
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email, 
                role: newUser.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user info (without password)
        const { password: userPassword, ...userInfo } = newUser;

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: userInfo
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const user = findUserByEmail(email);
    if (!user) {
        // For security, don't reveal if email exists
        return res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }

    // In a real app, you would send an email here
    res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email.'
    });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = findUserById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const { password, ...userInfo } = user;
    res.json({
        success: true,
        user: userInfo
    });
});

app.get('/api/user/shipments', authenticateToken, (req, res) => {
    // In a real app, filter shipments by user
    res.json({
        success: true,
        shipments: shipments.slice(0, 3) // Return first 3 for demo
    });
});

app.get('/api/track/:trackingNumber', optionalAuth, (req, res) => {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
        return res.status(400).json({
            success: false,
            message: 'Tracking number is required'
        });
    }

    const shipment = shipments.find(s => 
        s.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
    );

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Tracking number not found'
        });
    }

    // Add some demo tracking numbers for testing
    if (trackingNumber.toLowerCase().startsWith('demo')) {
        const demoShipment = {
            trackingNumber: trackingNumber,
            status: 'In Transit',
            origin: 'Demo Origin',
            destination: 'Demo Destination',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            currentLocation: 'Demo Hub',
            weight: '1.0 kg',
            dimensions: '20x15x10 cm',
            service: 'Express Delivery',
            updates: [
                { timestamp: new Date().toISOString(), location: 'Demo Origin', status: 'Package picked up' },
                { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), location: 'Demo Hub', status: 'In transit' }
            ]
        };
        
        return res.json({
            success: true,
            data: demoShipment
        });
    }

    res.json({
        success: true,
        data: shipment
    });
});

// Admin Routes
app.get('/api/shipments', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedShipments = shipments.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedShipments,
        pagination: {
            page,
            limit,
            total: shipments.length,
            totalPages: Math.ceil(shipments.length / limit)
        }
    });
});

app.post('/api/shipments', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }

    const {
        origin,
        destination,
        weight,
        dimensions,
        service,
        estimatedDelivery
    } = req.body;

    if (!origin || !destination || !service) {
        return res.status(400).json({
            success: false,
            message: 'Origin, destination, and service are required'
        });
    }

    const newShipment = {
        trackingNumber: 'FF' + Date.now(),
        status: 'Processing',
        origin,
        destination,
        estimatedDelivery,
        currentLocation: origin,
        weight: weight || 'Not specified',
        dimensions: dimensions || 'Not specified',
        service,
        updates: [
            {
                timestamp: new Date().toISOString(),
                location: origin,
                status: 'Shipment created'
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
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }

    const { trackingNumber } = req.params;
    const { status, currentLocation } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'Status is required'
        });
    }

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
    shipment.status = status;
    if (currentLocation) shipment.currentLocation = currentLocation;

    // Add update to history
    shipment.updates.push({
        timestamp: new Date().toISOString(),
        location: currentLocation || shipment.currentLocation,
        status: status
    });

    res.json({
        success: true,
        message: 'Shipment status updated successfully',
        data: shipment
    });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    
    const usersWithoutPasswords = users.map(user => {
        const { password, ...userInfo } = user;
        return userInfo;
    });
    
    res.json({ success: true, data: usersWithoutPasswords });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'FirstFortune Securities API is running',
        timestamp: new Date().toISOString(),
        server: 'FirstFortune Securities Tracking API',
        version: '2.0.0'
    });
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
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Test Accounts:`);
  console.log(`  Customer: demo@firstfortunesecurities.com / demo123`);
  console.log(`  Admin: admin@firstfortunesecurities.com / admin123`);
  console.log(`📦 Demo Tracking: FF123456789, FF987654321, DEMO123456789`);
});

module.exports = app;