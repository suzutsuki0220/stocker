'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        allowNull: false,
        defaultValue: -2,
        type: Sequelize.INTEGER
      },
      queue: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER,
      },
      cmdgroup: {
        allowNull: false,
        type: Sequelize.STRING
      },
      command: {
        type: Sequelize.TEXT
      },
      options: {
        type: Sequelize.TEXT
      },
      stdout: {
        type: Sequelize.TEXT
      },
      stderr: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('jobs');
  }
};
