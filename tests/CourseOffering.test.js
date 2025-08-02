const { Sequelize, DataTypes } = require('sequelize');
const getModel = require('../src/models/CourseOffering');

describe('CourseOffering Model', () => {
  let sequelize;
  let CourseOffering;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    CourseOffering = getModel(sequelize, DataTypes);
  });

  it('should default status to active', async () => {
    const offering = await CourseOffering.create({
      id: 'co1',
      courseId: 'c1',
      cohortId: 'cohort1',
      facilitatorId: 'f1',
      startDate: new Date(),
      endDate: new Date()
    });

    expect(offering.status).toBe('active');
  });
});
