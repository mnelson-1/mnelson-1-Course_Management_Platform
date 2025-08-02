const { Sequelize, DataTypes } = require('sequelize');
const getModel = require('../src/models/ManagerCohort');

describe('ManagerCohort Model', () => {
  let sequelize;
  let ManagerCohort;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    ManagerCohort = getModel(sequelize, DataTypes);
  });

  it('should create a ManagerCohort with default values', async () => {
    const cohort = await ManagerCohort.create({
      id: 'm1-c1',
      managerId: 'm1',
      cohortId: 'c1'
    });

    expect(cohort.id).toBe('m1-c1');
    expect(cohort.role).toBe('primary');
    expect(cohort.isActive).toBe(true);
  });
});
