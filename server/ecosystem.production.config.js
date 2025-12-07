module.exports = {
  apps: [
    {
      name: 'meetme-server',
      script: './index.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3016,
        POCKETBASE_URL: 'http://127.0.0.1:8096',
      },
      error_file: './logs/meetme-server-error.log',
      out_file: './logs/meetme-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'meetme-pb',
      script: './pocketbase',
      args: 'serve --http=127.0.0.1:8096',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/meetme-pb-error.log',
      out_file: './logs/meetme-pb-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

