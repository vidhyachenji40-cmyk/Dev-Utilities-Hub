import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import applicationsRouter from "./applications";
import interviewRouter from "./interview";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(applicationsRouter);
router.use(interviewRouter);
router.use(documentsRouter);

export default router;
