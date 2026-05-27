const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[`'"]|[`'"]$/g, '').trim();
    }
}

console.log('SUPABASE_URL:', JSON.stringify(process.env.SUPABASE_URL));
console.log('SUPABASE_SERVICE_ROLE_KEY:', JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY));
console.log('JWT_SECRET:', JSON.stringify(process.env.JWT_SECRET));
console.log('SMTP_HOST:', JSON.stringify(process.env.SMTP_HOST));
