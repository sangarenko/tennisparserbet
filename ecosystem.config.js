// PM2 Ecosystem Config — TT Predict
// Запуск: pm2 start ecosystem.config.js
// Полезно: pm2 startup && pm2 save (автозапуск при ребуте сервера)

module.exports = {
  apps: [
    {
      name: 'tt-predict',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/tt-predict',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',      // Перезапуск если больше 1GB RAM
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Стратегия рестарта
      min_uptime: '30s',               // Если упал за 30с — считается крашем
      max_restarts: 10,                // Максимум 10 рестартов подряд
      restart_delay: 5000,              // 5 сек между рестартами
      // Логирование
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/tt-predict/logs/pm2-error.log',
      out_file: '/var/www/tt-predict/logs/pm2-out.log',
      merge_logs: true,
      // Авто-перезапуск при OOM
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: 'ufc-predict',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/ufc-predict',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/ufc-predict/logs/pm2-error.log',
      out_file: '/var/www/ufc-predict/logs/pm2-out.log',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    }
  ]
};
