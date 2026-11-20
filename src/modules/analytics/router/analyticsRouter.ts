import { Router } from "express";
import { authMiddleware } from "../../../middleware/authMiddleware";
import { AnalyticsController } from "../controller/AnalyticsController";
import { analyticsRoleGuard } from "../middleware/analyticsRoleGuard";
import { AnalyticsRepository } from "../repository/AnalyticsRepository";
import { AnalyticsService } from "../service/AnalyticsService";

const analyticsRouter = Router();

const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

analyticsRouter.get(
  "/analytics",
  authMiddleware,
  analyticsRoleGuard,
  (req, res, next) => analyticsController.getOverview(req, res, next),
);

analyticsRouter.get(
  "/analytics/summary",
  authMiddleware,
  analyticsRoleGuard,
  (req, res, next) => analyticsController.getSummary(req, res, next),
);

analyticsRouter.get(
  "/analytics/departures",
  authMiddleware,
  analyticsRoleGuard,
  (req, res, next) => analyticsController.listDepartures(req, res, next),
);

analyticsRouter.get(
  "/analytics/departures/:id",
  authMiddleware,
  analyticsRoleGuard,
  (req, res, next) => analyticsController.getDepartureDetail(req, res, next),
);

export default analyticsRouter;
