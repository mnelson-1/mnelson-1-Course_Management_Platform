require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_DEV_USERNAME, // Now reads from .env
    password: process.env.DB_DEV_PASSWORD, // Now reads from .env
    database: process.env.DB_DEV_NAME, // Now reads from .env
    host: process.env.DB_DEV_HOST, // Now reads from .env
    dialect: process.env.DB_DIALECT || "mysql",
    dialectOptions: {
      // ADD THIS BLOCK
      authPlugins: ["mysql_native_password"],
    },
    port: process.env.DB_DEV_PORT || 3306,
  },

  test: {
    username: process.env.DB_TEST_USERNAME || "root", // Example: default to root if not in .env
    password: process.env.DB_TEST_PASSWORD || null,
    database: process.env.DB_TEST_NAME || "course_management_test",
    host: process.env.DB_TEST_HOST || "127.0.0.1",
    dialect: "mysql",
    port: process.env.DB_TEST_PORT || 3306,
  },

  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  },
};
