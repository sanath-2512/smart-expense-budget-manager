export interface IEntity {
  readonly id: number;
}

export interface IUser extends IEntity {
  name: string;
  email: string;
  passwordHash: string;
}

export class User implements IUser {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public passwordHash: string,
  ) {}
}

export interface IBudget extends IEntity {
  userId: number;
  limit: number;
}

export class Budget implements IBudget {
  constructor(
    public readonly id: number,
    public userId: number,
    public limit: number,
  ) {}
}

export interface ICategory extends IEntity {
  userId: number;
  name: string;
}

export class Category implements ICategory {
  constructor(
    public readonly id: number,
    public userId: number,
    public name: string,
  ) {}
}

export interface ITransaction extends IEntity {
  userId: number;
  type: "debit" | "credit";
  amount: number;
  date: string;
}

export class Transaction implements ITransaction {
  constructor(
    public readonly id: number,
    public userId: number,
    public type: "debit" | "credit",
    public amount: number,
    public date: string,
  ) {}
}

export interface IExpense extends IEntity {
  userId: number;
  categoryId: number;
  budgetId: number;
  transactionId: number;
  amount: number;
  date: string;
}

export class Expense implements IExpense {
  constructor(
    public readonly id: number,
    public userId: number,
    public categoryId: number,
    public budgetId: number,
    public transactionId: number,
    public amount: number,
    public date: string,
  ) {}
}

export interface IReport extends IEntity {
  userId: number;
  type: "monthly" | "yearly" | "custom";
  generatedAt: string;
}

export class Report implements IReport {
  constructor(
    public readonly id: number,
    public userId: number,
    public type: "monthly" | "yearly" | "custom",
    public generatedAt: string,
  ) {}
}

export interface INotification extends IEntity {
  userId: number;
  message: string;
  date: string;
}

export class Notification implements INotification {
  constructor(
    public readonly id: number,
    public userId: number,
    public message: string,
    public date: string,
  ) {}
}

export interface IPaymentMethod extends IEntity {
  userId: number;
  type: string;
}

export class PaymentMethod implements IPaymentMethod {
  constructor(
    public readonly id: number,
    public userId: number,
    public type: string,
  ) {}
}
