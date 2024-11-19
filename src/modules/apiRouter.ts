import { Router } from "express";
import authRouter from "./auth/authRouter";

const apiRouter: Router = Router();

apiRouter.use("/v1", authRouter);

export default apiRouter;
