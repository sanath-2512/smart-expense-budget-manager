import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reportsTable, expensesTable, categoriesTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte, sum, count, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { GenerateReportBody, GetReportParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function buildReportData(userId: number, type: string, period: string) {
  let startDate: Date;
  let endDate: Date;

  if (type === "monthly") {
    const [year, month] = period.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else if (type === "yearly") {
    const year = parseInt(period);
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  } else {
    const [start, end] = period.split(":");
    startDate = new Date(start);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59);
  }

  const conditions = [
    eq(expensesTable.userId, userId),
    gte(expensesTable.date, startDate),
    lte(expensesTable.date, endDate),
  ];

  const totalResult = await db
    .select({ total: sum(expensesTable.amount), cnt: count() })
    .from(expensesTable)
    .where(and(...conditions));

  const totalExpenses = parseFloat(totalResult[0]?.total ?? "0") || 0;
  const totalTransactions = Number(totalResult[0]?.cnt ?? 0);

  const categorySpending = await db
    .select({
      categoryId: expensesTable.categoryId,
      total: sum(expensesTable.amount),
      cnt: count(),
    })
    .from(expensesTable)
    .where(and(...conditions))
    .groupBy(expensesTable.categoryId);

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const byCategory = categorySpending.map((row) => {
    const cat = row.categoryId ? catMap.get(row.categoryId) : null;
    const total = parseFloat(row.total ?? "0") || 0;
    const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
    return {
      categoryId: row.categoryId,
      categoryName: cat?.name ?? "Uncategorized",
      categoryColor: cat?.color ?? "#94a3b8",
      total,
      count: Number(row.cnt),
      percentage,
    };
  });

  const monthlyBreakdown = await db
    .select({
      month: sql<string>`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`,
      total: sum(expensesTable.amount),
      cnt: count(),
    })
    .from(expensesTable)
    .where(and(...conditions))
    .groupBy(sql`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${expensesTable.date}, 'YYYY-MM')`);

  const monthlyBreakdownFormatted = monthlyBreakdown.map((row) => ({
    month: row.month,
    total: parseFloat(row.total ?? "0") || 0,
    count: Number(row.cnt),
  }));

  return { totalExpenses, totalTransactions, byCategory, monthlyBreakdown: monthlyBreakdownFormatted };
}

router.get("/reports", authMiddleware, async (req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, req.user!.userId))
    .orderBy(sql`${reportsTable.generatedAt} DESC`);
  res.json(reports);
});

router.post("/reports", authMiddleware, async (req, res): Promise<void> => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, period } = parsed.data;

  const [report] = await db
    .insert(reportsTable)
    .values({ userId: req.user!.userId, type, period })
    .returning();

  const reportData = await buildReportData(req.user!.userId, type, period);

  res.status(201).json({ ...report, ...reportData });
});

router.get("/reports/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, params.data.id), eq(reportsTable.userId, req.user!.userId)));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const reportData = await buildReportData(req.user!.userId, report.type, report.period);
  res.json({ ...report, ...reportData });
});

export default router;
