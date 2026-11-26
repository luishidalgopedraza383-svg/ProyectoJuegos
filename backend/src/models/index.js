'use strict';

const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

const models = {};

fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.js') && file !== 'index.js')
  .forEach((file) => {
    const defineModel = require(path.join(__dirname, file));
    const model = defineModel(sequelize);
    models[model.name] = model;
  });

Object.keys(models).forEach((name) => {
  if (typeof models[name].associate === 'function') {
    models[name].associate(models);
  }
});

const {
  Role, Permission, RolePermission, User,
  Category, Genre, Platform, VideoGame,
  InventoryItem, InventoryMovement,
  Customer, LoyaltyMovement,
  PaymentMethod, CashShift, Sale, SaleDetail, Payment, PaymentCard, BankAccount,
  Promotion, PromotionGame, SaleReturn, AuditLog,
} = models;

Role.belongsToMany(Permission, {
  through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles',
});

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

User.hasMany(PaymentCard, { foreignKey: 'userId', as: 'cards' });
PaymentCard.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(BankAccount, { foreignKey: 'userId', as: 'bankAccounts' });
BankAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Cuenta y tarjeta de la misma billetera ficticia.
BankAccount.hasMany(PaymentCard, { foreignKey: 'bankAccountId', as: 'cards' });
PaymentCard.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

User.hasOne(Customer, { foreignKey: 'userId', as: 'customer' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

VideoGame.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
VideoGame.belongsTo(Genre, { foreignKey: 'genreId', as: 'genre' });
VideoGame.belongsTo(Platform, { foreignKey: 'platformId', as: 'platform' });
Category.hasMany(VideoGame, { foreignKey: 'categoryId', as: 'games' });
Genre.hasMany(VideoGame, { foreignKey: 'genreId', as: 'games' });
Platform.hasMany(VideoGame, { foreignKey: 'platformId', as: 'games' });

InventoryItem.belongsTo(VideoGame, { foreignKey: 'videoGameId', as: 'game' });
VideoGame.hasOne(InventoryItem, { foreignKey: 'videoGameId', as: 'inventory' });
InventoryMovement.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'item' });
InventoryItem.hasMany(InventoryMovement, { foreignKey: 'inventoryItemId', as: 'movements' });

Customer.hasMany(LoyaltyMovement, { foreignKey: 'customerId', as: 'loyaltyMovements' });
LoyaltyMovement.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(CashShift, { foreignKey: 'cashierId', as: 'shifts' });
CashShift.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });

Sale.belongsTo(CashShift, { foreignKey: 'cashShiftId', as: 'shift' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Sale.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
CashShift.hasMany(Sale, { foreignKey: 'cashShiftId', as: 'sales' });
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });

Sale.hasMany(SaleDetail, { foreignKey: 'saleId', as: 'details' });
SaleDetail.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
SaleDetail.belongsTo(VideoGame, { foreignKey: 'videoGameId', as: 'game' });

Sale.hasMany(Payment, { foreignKey: 'saleId', as: 'payments' });
Payment.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
Payment.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'method' });

Promotion.belongsToMany(VideoGame, { through: PromotionGame, foreignKey: 'promotionId', otherKey: 'videoGameId' });
VideoGame.belongsToMany(Promotion, { through: PromotionGame, foreignKey: 'videoGameId', otherKey: 'promotionId' });

Sale.hasMany(SaleReturn, { foreignKey: 'saleId', as: 'returns' });
SaleReturn.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

module.exports = { sequelize, ...models };
