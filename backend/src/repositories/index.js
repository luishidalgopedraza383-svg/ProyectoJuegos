'use strict';

const db = require('../models');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  findAll(options = {}) {
    return this.model.findAll(options);
  }

  findOne(options = {}) {
    return this.model.findOne(options);
  }

  findByPk(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  create(payload, options = {}) {
    return this.model.create(payload, options);
  }

  bulkCreate(payload, options = {}) {
    return this.model.bulkCreate(payload, options);
  }

  update(id, payload, options = {}) {
    return this.model.update(payload, { where: { id }, ...options });
  }

  count(options = {}) {
    return this.model.count(options);
  }
}

const repositories = Object.keys(db)
  .filter((key) => db[key] && typeof db[key].findAll === 'function')
  .reduce((acc, key) => {
    acc[key] = new BaseRepository(db[key]);
    return acc;
  }, {});

module.exports = { BaseRepository, ...repositories };
