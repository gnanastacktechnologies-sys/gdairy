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

    // Seed sample standard user if none exists
    let sampleUser = await User.findOne({ username: 'farmer1' });
    if (!sampleUser) {
      sampleUser = await User.create({
        name: 'Ramesh Kumar',
        username: 'farmer1',
        password: 'userpassword123',
        userCode: 'FARM-001',
        phone: '9876500001',
        role: 'user',
        status: 'active'
      });
      console.log('[GDairy Seed] Sample user created: username "farmer1", password "userpassword123"');

      // Seed sample milk entries for the past 14 days so charts and dashboards show live data immediately
      const today = new Date();
      const sampleEntries = [];

      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const morningLitres = Math.round((5 + Math.random() * 3) * 100) / 100;
        const eveningLitres = Math.round((4 + Math.random() * 2.5) * 100) / 100;
        const price = 50; // ₹50/L

        sampleEntries.push({
          user: sampleUser._id,
          date: dateStr,
          session: 'morning',
          litres: morningLitres,
          milkPricePerLitre: price,
          totalAmount: Math.round(morningLitres * price * 100) / 100
        });

        sampleEntries.push({
          user: sampleUser._id,
          date: dateStr,
          session: 'evening',
          litres: eveningLitres,
          milkPricePerLitre: price,
          totalAmount: Math.round(eveningLitres * price * 100) / 100
        });
      }

      await MilkEntry.insertMany(sampleEntries);
      console.log(`[GDairy Seed] Seeded ${sampleEntries.length} initial milk collection records for demonstration.`);
    }

    console.log('[GDairy Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[GDairy Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
