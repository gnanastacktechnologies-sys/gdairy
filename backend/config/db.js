import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows Node.js SRV record lookup for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if custom DNS servers fail
}

export const connectDB = async () => {
  let mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gdairy';

  if (mongoURI.includes('<db_username>')) {
    console.warn(`\n[GDairy DB Warning] MONGO_URI contains '<db_username>' placeholder.`);
    console.warn(`[GDairy DB Warning] Please update '<db_username>' in backend/.env with your actual Atlas database username.`);
    console.warn(`[GDairy DB Warning] Falling back to local MongoDB at mongodb://localhost:27017/gdairy for now...\n`);
    mongoURI = 'mongodb://localhost:27017/gdairy';
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[GDairy DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[GDairy DB Error] ${error.message}`);
    if (mongoURI !== 'mongodb://localhost:27017/gdairy') {
      console.warn(`[GDairy DB Warning] Attempting fallback to local MongoDB...`);
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/gdairy');
        console.log(`[GDairy DB] Fallback Connected to Local MongoDB: ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error(`[GDairy DB Local Fallback Error] ${localErr.message}`);
      }
    }
    process.exit(1);
  }
};
