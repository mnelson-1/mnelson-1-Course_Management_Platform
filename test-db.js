const { sequelize } = require("./src/models");

sequelize
  .authenticate()
  .then(() => console.log("Connection OK"))
  .catch((err) => console.error("Connection failed:", err));
