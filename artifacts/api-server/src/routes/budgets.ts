import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { budgetsTable, expensesTable } from "@workspace/db";
import { eq, and, sum } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { CreateBudgetBody, UpdateBudgetBody, GetBudgetParams, UpdateBudgetParams, DeleteBudgetParams } from "@workspace/api-zod";

const router: IRouter = Router();

function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

async function getBudgetWithSpent(budget: typeof budgetsTable.$inferSelect) {
  const spentResult = await db
    .select({ total: sum(expensesTable.amount) })
    .from(expensesTable)
    .where(and(eq(expensesTable.budgetId, budget.id), eq(expensesTable.userId, budget.userId)));

  const spent = parseFloat(spentResult[0]?.total ?? "0") || 0;
  const remaining = Math.max(0, budget.limit - spent);
  const percentUsed = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0;

  return { ...budget, spent, remaining, percentUsed };
}

router.get("/budgets", authMiddleware, async (req, res): Promise<void> => {
  const budgets = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, req.user!.userId));
  const withSpent = await Promise.all(budgets.map(getBudgetWithSpent));
  res.json(withSpent);
});

router.post("/budgets", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [budget] = await db
    .insert(budgetsTable)
    .values({
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: toDateOrNull(parsed.data.endDate),
      userId: req.user!.userId,
    })
    .returning();

  res.status(201).json(budget);
});

router.get("/budgets/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [budget] = await db
    .select()
    .from(budgetsTable)
    .where(and(eq(budgetsTable.id, params.data.id), eq(budgetsTable.userId, req.user!.userId)));

  if (!budget) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }

  res.json(await getBudgetWithSpent(budget));
});

router.patch("/budgets/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [budget] = await db
    .update(budgetsTable)
    .set({
      ...parsed.data,
      endDate: toDateOrNull(parsed.data.endDate),
    })
    .where(and(eq(budgetsTable.id, params.data.id), eq(budgetsTable.userId, req.user!.userId)))
    .returning();

  if (!budget) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }

  res.json(budget);
});

router.delete("/budgets/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = DeleteBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [budget] = await db
    .delete(budgetsTable)
    .where(and(eq(budgetsTable.id, params.data.id), eq(budgetsTable.userId, req.user!.userId)))
    .returning();

  if (!budget) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
