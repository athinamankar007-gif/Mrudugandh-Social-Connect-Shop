import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import storageRouter from "./storage";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import siteContentRouter from "./siteContent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(storageRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(siteContentRouter);

export default router;
