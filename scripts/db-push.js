const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('Pushing schema to DB...');
try {
    execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
    console.log('Schema pushed successfully.');
} catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
}
