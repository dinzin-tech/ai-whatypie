module.exports = {
  apps: [
    {
      name: "whatypie-api",
      cwd: "./Wapto-api",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },
    {
      name: "whatypie-frontend",
      cwd: "./Wapto-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "whatypie-admin",
      cwd: "./Wapto-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
