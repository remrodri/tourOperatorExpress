import { Router } from "express";
import authRouter from "./auth/authRouter";
import userRouter from "./user/router/userRouter";
import roleRouter from "./role/router/roleRouter";

const apiRouter: Router = Router();

apiRouter.use("/v1", authRouter);
apiRouter.use("/v1", userRouter);
apiRouter.use("/v1", roleRouter);

export default apiRouter;
