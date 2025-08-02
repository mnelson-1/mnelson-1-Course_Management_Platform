const { Sequelize, DataTypes } = require('sequelize');
const getModel = require('../src/models/Facilitator');

describe('Facilitator Model', () => {
  let sequelize;
  let Facilitator;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    Facilitator = getModel(sequelize, DataTypes);
  });

  it('should create a facilitator with default active status', async () => {
    const facilitator = await Facilitator.create({
      id: 'f1',
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    expect(facilitator.id).toBe('f1');
    expect(facilitator.isActive).toBe(true);
  });
});