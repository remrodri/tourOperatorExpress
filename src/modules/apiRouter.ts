import { Router } from "express";
import authRouter from "./auth/authRouter";
import userManagementRouter from "./userManagement/userManagmentRouter";

const apiRouter: Router = Router();

apiRouter.use("/v1", authRouter);
apiRouter.use("/v1", userManagementRouter);

export default apiRouter;
