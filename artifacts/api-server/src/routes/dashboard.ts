import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { expensesTable, budgetsTable, categoriesTable, notificationsTable } from "@workspace/db";
import { eq, and, gte, lte, sum, count, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { GetSpendingByCategoryQueryParams, GetRecentExpensesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", authMiddleware, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [thisMonth] = await db
    .select({ total: sum(expensesTable.amount) })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), gte(expensesTable.date, firstOfMonth), lte(expensesTable.date, lastOfMonth)));

  const [lastMonth] = await db
    .select({ total: sum(expensesTable.amount) })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), gte(expensesTable.date, firstOfLastMonth), lte(expensesTable.date, lastOfLastMonth)));

  const budgets = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, userId));
  const totalBudget = budgets.reduce((acc, b) => acc + b.limit, 0);

  const [expCount] = await db.select({ cnt: count() }).from(expensesTable).where(and(
    eq(expensesTable.userId, userId),
    gte(expensesTable.date, firstOfMonth),
    lte(expensesTable.date, lastOfMonth),
  ));

  const [catCount] = await db.select({ cnt: count() }).from(categoriesTable).where(eq(categoriesTable.userId, userId));
  const [notifCount] = await db.select({ cnt: count() }).from(notificationsTable).where(and(
    eq(notificationsTable.userId, userId),
    eq(notificationsTable.isRead, false),
  ));

  const totalExpensesThisMonth = parseFloat(thisMonth?.total ?? "0") || 0;
  const totalExpensesLastMonth = parseFloat(lastMonth?.total ?? "0") || 0;
  const budgetUsedPercent = totalBudget > 0 ? Math.min(100, (totalExpensesThisMonth / totalBudget) * 100) : 0;

  res.json({
    totalExpensesThisMonth,
    totalExpensesLastMonth,
    totalBudget,
    budgetUsedPercent,
    expenseCount: Number(expCount?.cnt ?? 0),
    budgetCount: budgets.length,
    categoryCount: Number(catCount?.cnt ?? 0),
    unreadNotifications: Number(notifCount?.cnt ?? 0),
  });
});

router.get("/dashboard/spending-by-category", authMiddleware, async (req, res): Promise<void> => {
  const query = GetSpendingByCategoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const userId = req.user!.userId;
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (query.data.month) {
    const [year, month] = query.data.month.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const spending = await db
    .select({
      categoryId: expensesTable.categoryId,
      total: sum(expensesTable.amount),
      cnt: count(),
    })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), gte(expensesTable.date, startDate), lte(expensesTable.date, endDate)))
    .groupBy(expensesTable.categoryId);

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const totalAll = spending.reduce((acc, row) => acc + (parseFloat(row.total ?? "0") || 0), 0);

  const result = spending.map((row) => {
    const cat = row.categoryId ? catMap.get(row.categoryId) : null;
    const total = parseFloat(row.total ?? "0") || 0;
    return {
      categoryId: row.categoryId,
      categoryName: cat?.name ?? "Uncategorized",
      categoryColor: cat?.color ?? "#94a3b8",
      total,
      count: Number(row.cnt),
      percentage: totalAll > 0 ? (total / totalAll) * 100 : 0,
    };
  });

  res.json(result);
});

router.get("/dashboard/monthly-trend", authMiddleware, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trend = await db
    .select({
      month: sql<string>`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`,
      total: sum(expensesTable.amount),
      cnt: count(),
    })
    .from(expensesTable)
    .where(and(eq(expensesTable.userId, userId), gte(expensesTable.date, sixMonthsAgo)))
    .groupBy(sql`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`);

  res.json(
    trend.map((row) => ({
      month: row.month,
      total: parseFloat(row.total ?? "0") || 0,
      count: Number(row.cnt),
    })),
  );
});

router.get("/dashboard/recent-expenses", authMiddleware, async (req, res): Promise<void> => {
  const query = GetRecentExpensesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 5;
  const userId = req.user!.userId;

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(sql`${expensesTable.date} DESC`)
    .limit(limit);

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
  const budgets = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, userId));
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const budMap = new Map(budgets.map((b) => [b.id, b]));

  const result = expenses.map((e) => {
    const cat = e.categoryId ? catMap.get(e.categoryId) : null;
    const bud = e.budgetId ? budMap.get(e.budgetId) : null;
    return {
      ...e,
      categoryName: cat?.name ?? null,
      categoryColor: cat?.color ?? null,
      budgetName: bud?.name ?? null,
    };
  });

  res.json(result);
});

export default router;
