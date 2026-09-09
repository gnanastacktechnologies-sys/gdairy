import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows Node.js SRV record lookup for MongoDB Atlas (only in Windows dev environment)
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // fallback if custom DNS servers fail
  }
}

export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    if (isProduction) {
      console.error('\n[GDairy DB Fatal Error] MONGO_URI is missing in production environment variables!');
      console.error('[GDairy DB Fatal Error] Please set MONGO_URI in your Render Web Service Environment Variables.\n');
      process.exit(1);
    } else {
      mongoURI = 'mongodb://localhost:27017/gdairy';
    }
  }

  if (mongoURI.includes('<db_username>')) {
    console.warn(`\n[GDairy DB Warning] MONGO_URI contains '<db_username>' placeholder.`);
    console.warn(`[GDairy DB Warning] Please update '<db_username>' with your actual Atlas database username.`);
    if (!isProduction) {
      console.warn(`[GDairy DB Warning] Falling back to local MongoDB...\n`);
      mongoURI = 'mongodb://localhost:27017/gdairy';
    }
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[GDairy DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[GDairy DB Error] ${error.message}`);

    // Only fallback to local MongoDB in non-production environment if explicit fallback requested
    if (!isProduction && mongoURI !== 'mongodb://localhost:27017/gdairy') {
      console.warn(`[GDairy DB Warning] Attempting fallback to local MongoDB...`);
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/gdairy');
        console.log(`[GDairy DB] Fallback Connected to Local MongoDB: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`[GDairy DB Local Fallback Error] ${localErr.message}`);
      }
    } else if (isProduction) {
      console.error('\n[GDairy DB Troubleshooting]');
      console.error('1. Check if MONGO_URI is correctly set in Render Environment Variables.');
      console.error('2. Ensure Network Access in MongoDB Atlas allows 0.0.0.0/0 (IP Whitelist).\n');
    }

    process.exit(1);
  }
};
