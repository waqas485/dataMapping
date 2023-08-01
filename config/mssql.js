
require('dotenv').config();
const timeout = 120_000_000;
const sqlConfig = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE_NAME,
  server: process.env.HOST,
  pool: {
    max: 10, min: 2,
    idleTimeoutMillis: timeout,
    acquireTimeoutMillis: timeout,
    createTimeoutMillis: timeout,
    destroyTimeoutMillis: timeout,
    reapIntervalMillis: timeout,
    createRetryIntervalMillis: timeout,
  },
  requestTimeout: timeout,
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
}
module.exports = sqlConfig