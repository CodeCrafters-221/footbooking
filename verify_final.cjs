const fs = require('fs');
const path = require('path');

// Mock import.meta.env
global.import = {
  meta: {
    env: {}
  }
};

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
    global.import.meta.env[key.trim()] = val.trim();
  }
});

const { supabase } = require('./src/services/supabaseClient.js');
const adminService = require('./src/services/adminService.js');

async function test() {
  console.log('Starting verification...');

  try {
    // 1. Get platform settings
    console.log('Testing getPlatformSettings...');
    const settings = await adminService.getPlatformSettings();
    console.log('Platform Settings retrieved:', settings);

    // 2. Get reports
    console.log('Testing getAdminReports...');
    const reports = await adminService.getAdminReports();
    console.log(`Retrieved ${reports.length} reports.`);

    // 3. Test global search
    console.log('Testing globalAdminSearch...');
    const searchRes = await adminService.globalAdminSearch('police');
    console.log('Search results for "police":', {
      usersCount: searchRes.users.length,
      fieldsCount: searchRes.fields.length,
      bookingsCount: searchRes.bookings.length,
      ownersCount: searchRes.owners.length
    });

    // 4. Test notification feed
    console.log('Testing getAdminNotificationFeed...');
    const notifications = await adminService.getAdminNotificationFeed();
    console.log(`Notification feed has ${notifications.length} items.`);

    console.log('Verification script completed successfully.');
  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    process.exit(0);
  }
}

test();
