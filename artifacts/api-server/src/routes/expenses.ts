import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { expensesTable, categoriesTable, budgetsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import {
  CreateExpenseBody,
  UpdateExpenseBody,
  GetExpenseParams,
  UpdateExpenseParams,
  DeleteExpenseParams,
  ListExpensesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatExpense(expense: typeof expensesTable.$inferSelect) {
  let categoryName: string | null = null;
  let categoryColor: string | null = null;
  let budgetName: string | null = null;

  if (expense.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, expense.categoryId)).limit(1);
    if (cat) {
      categoryName = cat.name;
      categoryColor = cat.color;
    }
  }

  if (expense.budgetId) {
    const [bud] = await db.select().from(budgetsTable).where(eq(budgetsTable.id, expense.budgetId)).limit(1);
    if (bud) budgetName = bud.name;
  }

  return { ...expense, categoryName, categoryColor, budgetName };
}

router.get("/expenses", authMiddleware, async (req, res): Promise<void> => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { skip = 0, limit = 20, categoryId, budgetId, startDate, endDate } = query.data;

  const conditions = [eq(expensesTable.userId, req.user!.userId)];
  if (categoryId != null) conditions.push(eq(expensesTable.categoryId, categoryId));
  if (budgetId != null) conditions.push(eq(expensesTable.budgetId, budgetId));
  if (startDate) conditions.push(gte(expensesTable.date, new Date(startDate)));
  if (endDate) conditions.push(lte(expensesTable.date, new Date(endDate)));

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(expensesTable)
    .where(whereClause);

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(whereClause)
    .orderBy(sql`${expensesTable.date} DESC`)
    .limit(limit)
    .offset(skip);

  const formatted = await Promise.all(expenses.map(formatExpense));

  res.json({ expenses: formatted, total, skip, limit });
});

router.post("/expenses", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({ ...parsed.data, userId: req.user!.userId })
    .returning();

  await db.insert(transactionsTable).values({
    userId: req.user!.userId,
    expenseId: expense.id,
    type: "debit",
    amount: expense.amount,
    description: expense.description,
    date: expense.date,
  });

  if (expense.budgetId) {
    const [budget] = await db.select().from(budgetsTable).where(eq(budgetsTable.id, expense.budgetId)).limit(1);
    if (budget) {
      const spentResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${expensesTable.amount}), 0)` })
        .from(expensesTable)
        .where(and(eq(expensesTable.budgetId, budget.id), eq(expensesTable.userId, req.user!.userId)));

      const spent = parseFloat(spentResult[0]?.total ?? "0");
      const pct = (spent / budget.limit) * 100;

      if (pct >= 90 && pct < 100) {
        await db.insert(notificationsTable).values({
          userId: req.user!.userId,
          message: `You've used ${Math.round(pct)}% of your "${budget.name}" budget.`,
          type: "budget_alert",
        });
      } else if (pct >= 100) {
        await db.insert(notificationsTable).values({
          userId: req.user!.userId,
          message: `You've exceeded your "${budget.name}" budget!`,
          type: "budget_alert",
        });
      }
    }
  }

  const formatted = await formatExpense(expense);
  res.status(201).json(formatted);
});

router.get("/expenses/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .select()
    .from(expensesTable)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, req.user!.userId)));

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(await formatExpense(expense));
});

router.patch("/expenses/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .update(expensesTable)
    .set(parsed.data)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, req.user!.userId)))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(await formatExpense(expense));
});

router.delete("/expenses/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, req.user!.userId)))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
