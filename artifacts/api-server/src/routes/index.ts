import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import storageRouter from "./storage";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(storageRouter);
router.use(ordersRouter);
router.use(reviewsRouter);

export default router;
