module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Modules", {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      half: { type: Sequelize.ENUM("H1", "H2"), allowNull: false },
    });

    await queryInterface.createTable("Cohorts", {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.createTable("Classes", {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      startDate: { type: Sequelize.DATE, allowNull: false },
      graduationDate: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("Students", {
      id: { type: Sequelize.STRING, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      classId: {
        type: Sequelize.STRING,
        references: { model: "Classes", key: "id" },
      },
      cohortId: {
        type: Sequelize.STRING,
        references: { model: "Cohorts", key: "id" },
      },
    });

    await queryInterface.createTable("Facilitators", {
      id: { type: Sequelize.STRING, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      qualification: { type: Sequelize.STRING, allowNull: false },
      location: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.createTable("Modes", {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: {
        type: Sequelize.ENUM("online", "in-person", "hybrid"),
        allowNull: false,
      },
    });

    await queryInterface.createTable("Allocations", {
      id: { type: Sequelize.STRING, primaryKey: true },
      trimester: { type: Sequelize.INTEGER, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      moduleId: {
        type: Sequelize.STRING,
        references: { model: "Modules", key: "id" },
      },
      classId: {
        type: Sequelize.STRING,
        references: { model: "Classes", key: "id" },
      },
      facilitatorId: {
        type: Sequelize.STRING,
        references: { model: "Facilitators", key: "id" },
      },
      modeId: {
        type: Sequelize.STRING,
        references: { model: "Modes", key: "id" },
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropAllTables();
  },
};
