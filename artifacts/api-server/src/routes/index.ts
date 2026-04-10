import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import budgetsRouter from "./budgets";
import categoriesRouter from "./categories";
import expensesRouter from "./expenses";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(budgetsRouter);
router.use(categoriesRouter);
router.use(expensesRouter);
router.use(transactionsRouter);
router.use(reportsRouter);
router.use(notificationsRouter);

export default router;
