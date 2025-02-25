import { Router } from "express";
import authRouter from "./auth/authRouter";
import userRouter from "./user/router/userRouter";
import roleRouter from "./role/router/roleRouter";
import securitySetupRouter from "./securitySetup/router/securitySetupRouter";
import tourTypeRouter from "./tourType/router/tourTypeRouter";
import cancellationPolicyRouter from "./cancellationPolicy/router/cancellationPolicyRouter";
import touristDestinationRouter from "./touristDestination/router/touristDestinationRouter";

const apiRouter: Router = Router();

apiRouter.use("/v1", authRouter);
apiRouter.use("/v1", userRouter);
apiRouter.use("/v1", roleRouter);
apiRouter.use("/v1", securitySetupRouter);
apiRouter.use("/v1", tourTypeRouter);
apiRouter.use("/v1", cancellationPolicyRouter);
apiRouter.use("/v1", touristDestinationRouter);

export default apiRouter;
