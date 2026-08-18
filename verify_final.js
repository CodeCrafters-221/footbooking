import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key.trim()] = val.trim();
  }
});

// Mock Vite environment variables for Node.js execution
import.meta.env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.VITE_SUPABASE_ANON_KEY
};

import { 
  getPlatformSettings, 
  getAdminReports, 
  globalAdminSearch, 
  getAdminNotificationFeed 
} from './src/services/adminService.js';

async function test() {
  console.log('Starting ESM verification...');
  try {
    console.log('Testing getPlatformSettings...');
    const settings = await getPlatformSettings();
    console.log('Platform Settings:', settings);

    console.log('Testing getAdminReports...');
    const reports = await getAdminReports();
    console.log(`Retrieved ${reports.length} reports.`);

    console.log('Testing globalAdminSearch...');
    const searchRes = await globalAdminSearch('police');
    console.log('Search results:', {
      users: searchRes.users,
      fields: searchRes.fields,
      bookings: searchRes.bookings,
      owners: searchRes.owners
    });

    console.log('Testing getAdminNotificationFeed...');
    const notifications = await getAdminNotificationFeed();
    console.log(`Notification feed: ${notifications.length} items.`);

    console.log('ESM Verification completed successfully.');
  } catch (err) {
    console.error('ESM Verification failed:', err);
  } finally {
    process.exit(0);
  }
}

test();
