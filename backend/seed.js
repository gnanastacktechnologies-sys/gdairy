import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from './models/User.js';
import MilkEntry from './models/MilkEntry.js';
import Settings from './models/Settings.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminUsername = (process.env.ADMIN_USERNAME || 'Gnanasekaran').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Gnana123@';
    const adminName = process.env.ADMIN_NAME || 'Gnanasekaran';

    let admin = await User.findOne({ role: 'admin' }) || await User.findOne({ username: adminUsername });

    if (admin) {
      console.log(`[GDairy Seed] Admin account found. Updating username to '${adminUsername}' and password...`);
      admin.name = adminName;
      admin.username = adminUsername;
      admin.role = 'admin';
      admin.status = 'active';
      admin.userCode = admin.userCode || 'ADM-001';
      admin.password = adminPassword; // Pre-save hook will hash if modified
      await admin.save();
      console.log(`[GDairy Seed] Admin account updated successfully.`);
    } else {
      admin = await User.create({
        name: adminName,
        username: adminUsername,
        password: adminPassword,
        userCode: 'ADM-001',
        role: 'admin',
        status: 'active',
        phone: '9876543210'
      });
      console.log(`[GDairy Seed] Initial Admin account created: username '${adminUsername}'`);
    }

    // Seed default settings if none
    let settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        retentionPeriod: 3,
        retentionUnit: 'months',
        updatedBy: admin._id
      });
      console.log('[GDairy Seed] Default retention settings created (3 Months)');
    }

    console.log('[GDairy Seed] Seeding check completed. Admin account and system settings verified.');
    process.exit(0);
  } catch (error) {
    console.error(`[GDairy Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
