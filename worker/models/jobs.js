'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobs = sequelize.define('jobs', {
    status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -2 },
    queue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cmdgroup: { type: DataTypes.STRING, allowNull: false },
    command: { type: DataTypes.TEXT, allowNull: false },
    options: DataTypes.TEXT,
    stdout: DataTypes.TEXT,
    stderr: DataTypes.TEXT
  }, {
    underscored: true,
  });
  jobs.associate = function(models) {
    // associations can be defined here
  };
  return jobs;
};
