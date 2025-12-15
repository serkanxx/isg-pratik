const fs = require('fs');
const { execSync } = require('child_process');

try {
    const parseEnv = (path) => {
        if (!fs.existsSync(path)) return {};
        let content = fs.readFileSync(path, 'utf8');
        // Remove BOM and null bytes (UTF-16 artifacts if read as UTF-8)
        content = content.replace(/^\uFEFF/, '').replace(/\0/g, '');

        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
                if (key && !key.startsWith('#')) {
                    env[key] = value;
                }
            }
        });
        return env;
    };

    const env = { ...process.env, ...parseEnv('.env'), ...parseEnv('.env.local') };

    console.log('Pushing schema to DB with manually loaded env (ACCEPTING DATA LOSS for user_risks table)...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env });
    console.log('Schema pushed successfully.');
} catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
}
