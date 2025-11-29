// Load environment variables before any other imports
import './init-dotenv';

import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 5188;

// Middleware to parse JSON bodies
app.use(express.json());

// GET / endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
      message: 'Hello from GET / endpoint with src directory watch!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
});

// POST / endpoint
app.post('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from POST / endpoint!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    receivedData: req.body
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  / - Returns a simple JSON response');
  console.log('  POST / - Returns the received data in JSON format');
});