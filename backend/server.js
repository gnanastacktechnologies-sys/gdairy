import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, HOST, () => {
    console.log(`[GDairy Server] Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
    console.log(`[GDairy Server] Accessible on local network at http://<your-local-ip>:${PORT}/api`);
  });
};

startServer();
