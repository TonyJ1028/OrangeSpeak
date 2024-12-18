export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '60m',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 20000,
  },
  voice: {
    maxUsersPerChannel: parseInt(process.env.VOICE_MAX_USERS_PER_CHANNEL, 10) || 10,
    rtcMinPort: parseInt(process.env.RTC_MIN_PORT, 10) || 10000,
    rtcMaxPort: parseInt(process.env.RTC_MAX_PORT, 10) || 59999,
  },
});
