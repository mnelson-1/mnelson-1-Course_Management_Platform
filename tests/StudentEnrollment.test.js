const { Sequelize, DataTypes } = require('sequelize');
const getModel = require('../src/models/StudentEnrollment');

describe('StudentEnrollment Model', () => {
  let sequelize;
  let StudentEnrollment;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    StudentEnrollment = getModel(sequelize, DataTypes);
  });

  it('should default to "enrolled" status', async () => {
    const enrollment = await StudentEnrollment.create({
      id: 's1-ce1',
      studentId: 's1',
      courseOfferingId: 'ce1'
    });

    expect(enrollment.status).toBe('enrolled');
    expect(enrollment.attendance).toBe(0);
  });
});
