const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '..', '..', '..', '..', 'Desktop', 'CRAFTERS', 'FootBooking', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
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
    env[key.trim()] = val.trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const logFile = path.join(__dirname, '..', '..', '..', '..', '..', 'Desktop', 'CRAFTERS', 'FootBooking', 'schema_output.txt');
const logStream = fs.createWriteStream(logFile);
function log(...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ') + '\n';
  logStream.write(msg);
  console.log(...args);
}

log('Connecting to:', url);
const supabase = createClient(url, anonKey);

async function run() {
  try {
    // 1. Test profiles
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
    log('--- profiles ---');
    if (pError) log('Error profiles:', pError);
    else log('Sample profile keys:', pData.length > 0 ? Object.keys(pData[0]) : 'no rows', pData);

    // 2. Test fields
    const { data: fData, error: fError } = await supabase.from('fields').select('*').limit(1);
    log('--- fields ---');
    if (fError) log('Error fields:', fError);
    else log('Sample fields keys:', fData.length > 0 ? Object.keys(fData[0]) : 'no rows', fData);

    // 3. Test reservations
    const { data: rData, error: rError } = await supabase.from('reservations').select('*').limit(1);
    log('--- reservations ---');
    if (rError) log('Error reservations:', rError);
    else log('Sample reservations keys:', rData.length > 0 ? Object.keys(rData[0]) : 'no rows', rData);

    // 4. Check if platform_settings exists
    const { data: psData, error: psError } = await supabase.from('platform_settings').select('*').limit(1);
    log('--- platform_settings ---');
    if (psError) log('Error platform_settings:', psError);
    else log('platform_settings exists! keys:', psData.length > 0 ? Object.keys(psData[0]) : 'no rows', psData);

    // 5. Check if reports exists
    const { data: repData, error: repError } = await supabase.from('reports').select('*').limit(1);
    log('--- reports ---');
    if (repError) log('Error reports:', repError);
    else log('reports exists! keys:', repData.length > 0 ? Object.keys(repData[0]) : 'no rows', repData);

    // 6. Check if report_comments exists
    const { data: rcData, error: rcError } = await supabase.from('report_comments').select('*').limit(1);
    log('--- report_comments ---');
    if (rcError) log('Error report_comments:', rcError);
    else log('report_comments exists! keys:', rcData.length > 0 ? Object.keys(rcData[0]) : 'no rows', rcData);

    // 7. Check if notifications exists
    const { data: notData, error: notError } = await supabase.from('notifications').select('*').limit(1);
    log('--- notifications ---');
    if (notError) log('Error notifications:', notError);
    else log('notifications exists! keys:', notData.length > 0 ? Object.keys(notData[0]) : 'no rows', notData);

  } catch (err) {
    log('Fatal execution error:', err);
  } finally {
    logStream.end();
    process.exit(0);
  }
}

run();
