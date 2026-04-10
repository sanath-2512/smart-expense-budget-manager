import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { ListTransactionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", authMiddleware, async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { skip = 0, limit = 20 } = query.data;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.user!.userId))
    .orderBy(sql`${transactionsTable.date} DESC`)
    .limit(limit)
    .offset(skip);

  res.json(transactions);
});

export default router;
