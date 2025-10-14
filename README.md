

# FirstFortune Securities Server

Backend server for the FirstFortune Securities logistics platform.

## Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup
1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Environment variables:**
   - Copy `.env.example` to `.env` and update the values as needed.

3. **Start the server:**
   ```sh
   npm start
   ```
   The server will start on the port specified in your `.env` file (default: 3000).

4. **Development mode (with auto-reload):**
   ```sh
   npm run dev
   ```
   This uses [nodemon](https://nodemon.io/) for automatic restarts on file changes.

## Project Structure
- `server/` - Main server code (Express, routes, controllers, etc.)
- `models/` - Database models
- `routes/` - API route definitions
- `middleware/` - Express middleware
- `config/` - Configuration files

## API
The API is RESTful. See the `routes/` directory for available endpoints.

## License
This project is for internal use. All rights reserved.
   ```bash
