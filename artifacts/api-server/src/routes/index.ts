import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import trainsRouter from "./trains.js";
import schedulesRouter from "./schedules.js";
import passengersRouter from "./passengers.js";
import reservationsRouter from "./reservations.js";
import ticketsRouter from "./tickets.js";
import reportsRouter from "./reports.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(trainsRouter);
router.use(schedulesRouter);
router.use(passengersRouter);
router.use(reservationsRouter);
router.use(ticketsRouter);
router.use(reportsRouter);
router.use(usersRouter);

export default router;
