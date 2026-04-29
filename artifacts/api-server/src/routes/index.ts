import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import applicationsRouter from "./applications";
import interviewRouter from "./interview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(applicationsRouter);
router.use(interviewRouter);

export default router;
