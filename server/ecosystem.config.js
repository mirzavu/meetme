export default {
  apps: [
    {
      name: 'meetme-local',
      script: './index.js',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3016,
        POCKETBASE_URL: 'http://127.0.0.1:8096',
        POCKETBASE_ADMIN_EMAIL: 'meetme@demotesting.co.uk',
        POCKETBASE_ADMIN_PASSWORD: '1212123412',
        JWT_SECRET: 'your-secret-key-change-in-production',
        GOOGLE_CLIENT_ID: '57943976530-1lq02c1t0mfblcfpqqfotgreo9nd3pk5.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: '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'
      }
    }
  ]
};

