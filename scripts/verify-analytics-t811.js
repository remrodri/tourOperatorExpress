require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { performance } = require("perf_hooks");
const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../dist/app").default;
const { generateToken } = require("../dist/utils/jwt");
const { DateRangeModel } = require("../dist/modules/dateRange/model/DateRangeModel");
const {
  AnalyticsRepository,
} = require("../dist/modules/analytics/repository/AnalyticsRepository");
const {
  ANALYTICS_TRENDS_AS_OF,
  ANALYTICS_TRENDS_MAX_POINTS,
  ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS,
  ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS,
} = require("../dist/modules/analytics/types/AnalyticsTypes");

const TASK = "T-811";
const AS_OF = ANALYTICS_TRENDS_AS_OF;
const RUNS = Math.min(
  10,
  Math.max(3, Number(process.env.T811_RUNS || 5)),
);
const OUT_INDEX = process.argv.indexOf("--out");
const OUT_PATH =
  OUT_INDEX >= 0 && process.argv[OUT_INDEX + 1]
    ? path.resolve(process.argv[OUT_INDEX + 1])
    : null;

const FORBIDDEN_KEYS = new Set([
  "email",
  "phone",
  "ci",
  "firstName",
  "lastName",
  "address",
  "password",
  "touristsIds",
  "sellerId",
  "notes",
  "paymentProof",
  "paymentProofImage",
  "bookingCode",
  "paymentIds",
  "attendance",
  "refundAmount",
  "cancellationFee",
  "refundedAt",
]);

const ERROR_LEAK_PATTERNS = [
  "stack",
  "MongoServerError",
  "MongooseError",
  "CastError",
  "ValidationError",
  "Bookings",
  "Payments",
  "Tourists",
  "Date_Ranges",
  "Roles",
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /\b[67]\d{7}\b/;

const failures = [];
const warnings = [];
let stdoutOriginalWrite = null;

const fail = (message) => {
  failures.push(message);
};

const objectKeys = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const walk = (value, visitor, currentPath = "response") => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(item, visitor, `${currentPath}[${index}]`),
    );
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visitor(key, child, `${currentPath}.${key}`);
      walk(child, visitor, `${currentPath}.${key}`);
    }
  }
};

const scanPii = (value) => {
  const findings = [];

  walk(value, (key, child, currentPath) => {
    if (FORBIDDEN_KEYS.has(key)) {
      findings.push({ type: "forbidden-key", path: currentPath });
    }

    if (typeof child === "string") {
      if (EMAIL_PATTERN.test(child)) {
        findings.push({ type: "email-value", path: currentPath });
      }

      if (PHONE_PATTERN.test(child)) {
        findings.push({ type: "phone-value", path: currentPath });
      }
    }
  });

  return findings;
};

const scanErrorLeaks = (value, includeCollectionNames = true) => {
  const serialized = JSON.stringify(value);
  const patterns = includeCollectionNames
    ? ERROR_LEAK_PATTERNS
    : ERROR_LEAK_PATTERNS.slice(0, 5);

  return patterns.filter((pattern) => serialized.includes(pattern));
};

const bytesOf = (value) => Buffer.byteLength(JSON.stringify(value), "utf8");

const round = (value) => Number(value.toFixed(2));

const summarizeSamples = (samples) => {
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  return {
    runs: samples.length,
    minMs: round(Math.min(...samples)),
    medianMs: round(median),
    maxMs: round(Math.max(...samples)),
    meanMs: round(
      samples.reduce((total, value) => total + value, 0) / samples.length,
    ),
  };
};

const copyPipeline = (pipeline) => [...pipeline];

const planStageNames = (plan, names = []) => {
  if (!plan || typeof plan !== "object") {
    return names;
  }

  if (plan.stage) {
    names.push(plan.stage);
  }

  if (plan.inputStage) {
    planStageNames(plan.inputStage, names);
  }

  if (Array.isArray(plan.inputStages)) {
    plan.inputStages.forEach((stage) => planStageNames(stage, names));
  }

  return names;
};

const findPlanValue = (plan, key) => {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  if (plan[key] !== undefined) {
    return plan[key];
  }

  if (plan.inputStage) {
    const found = findPlanValue(plan.inputStage, key);
    if (found !== null) {
      return found;
    }
  }

  if (Array.isArray(plan.inputStages)) {
    for (const stage of plan.inputStages) {
      const found = findPlanValue(stage, key);
      if (found !== null) {
        return found;
      }
    }
  }

  return null;
};

const summarizeExplain = (explain) => {
  const stages = Array.isArray(explain.stages) ? explain.stages : [];
  const cursorStage = stages.find((stage) => stage.$cursor);
  const lookupStages = stages.filter((stage) => stage.$lookup);
  const sortStage = stages.find((stage) => stage.$sort);
  const facetStage = stages.find((stage) => stage.$facet);
  const cursorDetail = cursorStage?.$cursor ?? {
    queryPlanner: explain.queryPlanner,
    executionStats: explain.executionStats,
  };
  const cursorExecution = cursorDetail?.executionStats;
  const cursorPlan = cursorExecution?.executionStages;
  const winningPlan = cursorDetail?.queryPlanner?.winningPlan;
  const cursorStageNames = planStageNames(winningPlan, []);
  const cursorIndex = findPlanValue(winningPlan, "indexName");

  return {
    queryShapeHash: explain.queryShapeHash ?? null,
    serverVersion: explain.serverInfo?.version ?? null,
    dateRangesCursor: {
      stage: cursorStageNames[cursorStageNames.length - 1] ?? null,
      stages: cursorStageNames,
      indexName: cursorIndex,
      nReturned: cursorExecution?.nReturned ?? null,
      docsExamined: cursorExecution?.totalDocsExamined ?? null,
      keysExamined: cursorExecution?.totalKeysExamined ?? null,
      executionTimeMillis: cursorExecution?.executionTimeMillis ?? null,
      collectionScans:
        cursorPlan?.collectionScans ??
        (cursorStageNames.includes("COLLSCAN") ? 1 : 0),
    },
    lookups: lookupStages.map((stage) => ({
      from: stage.$lookup?.from ?? stage.$lookup?.as ?? null,
      indexesUsed: stage.indexesUsed ?? [],
      collectionScans: stage.collectionScans ?? 0,
      docsExamined: stage.totalDocsExamined ?? null,
      keysExamined: stage.totalKeysExamined ?? null,
      executionTimeMillis: stage.executionTimeMillisEstimate ?? null,
    })),
    sort: sortStage
      ? {
          usedDisk: sortStage.usedDisk ?? false,
          spills: sortStage.spills ?? 0,
          nReturned: sortStage.nReturned ?? null,
          peakTrackedMemBytes: sortStage.peakTrackedMemBytes ?? null,
          totalDataSizeSortedBytesEstimate:
            sortStage.totalDataSizeSortedBytesEstimate ?? null,
        }
      : null,
    facet: facetStage
      ? {
          nReturned: facetStage.nReturned ?? null,
          peakTrackedMemBytes: facetStage.peakTrackedMemBytes ?? null,
        }
      : null,
    peakTrackedMemBytes: explain.peakTrackedMemBytes ?? null,
  };
};

const readGitHead = (cwd) => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const sourceGuardrails = () => {
  const routerPath = path.join(
    process.cwd(),
    "src",
    "modules",
    "analytics",
    "router",
    "analyticsRouter.ts",
  );
  const repositoryPath = path.join(
    process.cwd(),
    "src",
    "modules",
    "analytics",
    "repository",
    "AnalyticsRepository.ts",
  );
  const departuresDtoPath = path.join(
    process.cwd(),
    "src",
    "modules",
    "analytics",
    "dto",
    "AnalyticsDeparturesQueryDto.ts",
  );
  const frontendServicePath = path.resolve(
    process.cwd(),
    "..",
    "tourOperatorReactMui",
    "src",
    "features",
    "analytics",
    "service",
    "analyticsService.ts",
  );

  const routerSource = fs.readFileSync(routerPath, "utf8");
  const repositorySource = fs.readFileSync(repositoryPath, "utf8");
  const departuresDtoSource = fs.readFileSync(departuresDtoPath, "utf8");
  const frontendSource = fs.existsSync(frontendServicePath)
    ? fs.readFileSync(frontendServicePath, "utf8")
    : null;
  const transactionalCalls = frontendSource
    ? ["/bookings", "/tourists", "/payments", "/dateRanges", "/date-ranges"]
        .filter((endpoint) => frontendSource.includes(endpoint))
    : [];

  return {
    routerProtected:
      routerSource.includes("authMiddleware") &&
      routerSource.includes("analyticsRoleGuard"),
    repositoryUsesAggregate: repositorySource.includes(".aggregate"),
    repositoryStages: {
      match: repositorySource.includes("$match"),
      lookup: repositorySource.includes("$lookup"),
      sort: repositorySource.includes("$sort"),
      limit: repositorySource.includes("$limit"),
      facet: repositorySource.includes("$facet"),
    },
    departuresLimitBounded:
      departuresDtoSource.includes(".min(1)") &&
      departuresDtoSource.includes(".max(100)"),
    trendsMaxPoints: ANALYTICS_TRENDS_MAX_POINTS,
    trendsDefaultWindowDays: ANALYTICS_TRENDS_DEFAULT_WINDOW_DAYS,
    trendsMaxDefaultWindowDays:
      ANALYTICS_TRENDS_MAX_DEFAULT_WINDOW_DAYS,
    frontend: {
      checked: Boolean(frontendSource),
      callsAnalytics:
        Boolean(frontendSource) && frontendSource.includes('"/analytics"'),
      transactionalCalls,
      aggregatesOnly:
        Boolean(frontendSource) &&
        frontendSource.includes('"/analytics"') &&
        transactionalCalls.length === 0,
    },
  };
};

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI no configurada");
  }

  await mongoose.connect(mongoUri);
};

const roleAuthorization = async (roleName) => {
  const role = await mongoose.connection
    .collection("Roles")
    .findOne({ name: roleName });

  if (!role) {
    return null;
  }

  const token = generateToken({
    id: new mongoose.Types.ObjectId().toString(),
    firstName: "Verificacion",
    lastName: "T811",
    phone: "00000000",
    email: "verificacion@example.test",
    firstLogin: false,
    role: role._id.toString(),
    ci: "000000",
    imagePath: "test.webp",
  });

  return `Bearer ${token}`;
};

const pickDeparture = async () => {
  const bookings = mongoose.connection.collection("Bookings");
  const booking = await bookings.findOne({
    dateRangeId: { $exists: true, $ne: null },
  });

  if (booking?.dateRangeId) {
    try {
      const departure = await DateRangeModel.findById(
        booking.dateRangeId,
      ).lean();
      if (departure) {
        return departure;
      }
    } catch {
      void 0;
    }
  }

  const departure = await DateRangeModel.findOne({
    startDate: { $ne: null },
  })
    .sort({ startDate: 1, _id: 1 })
    .lean();

  if (!departure) {
    throw new Error("No hay salidas para verificar");
  }

  return departure;
};

const applyAuth = (httpRequest, authorization) =>
  authorization
    ? httpRequest.set("Authorization", authorization)
    : httpRequest;

const surfaceRequests = (authorization, departureId) => [
  {
    name: "overview",
    request: applyAuth(
      request(app).get("/api/v1/analytics"),
      authorization,
    ),
  },
  {
    name: "summary",
    request: applyAuth(
      request(app).get("/api/v1/analytics/summary"),
      authorization,
    ),
  },
  {
    name: "departures",
    request: applyAuth(
      request(app)
        .get("/api/v1/analytics/departures")
        .query({ limit: 100 }),
      authorization,
    ),
  },
  {
    name: "detail",
    request: applyAuth(
      request(app).get(
        `/api/v1/analytics/departures/${departureId}`,
      ),
      authorization,
    ),
  },
  {
    name: "trends",
    request: applyAuth(
      request(app)
        .get("/api/v1/analytics/trends")
        .query({
          dateRangeId: departureId,
          from: "2025-10-10",
          to: AS_OF,
        }),
      authorization,
    ),
  },
];

const runRoleMatrix = async (authorization, expectedStatus) => {
  const requests = surfaceRequests(authorization, globalDepartureId);
  const results = [];

  for (const { name, request: httpRequest } of requests) {
    const response = await httpRequest;
    results.push({
      name,
      expectedStatus,
      status: response.status,
      ok: response.status === expectedStatus,
    });
  }

  return results;
};

const runEndpoint = async (spec, authorization) => {
  const buildRequest = () => {
    const httpRequest = applyAuth(
      request(app).get(spec.path),
      authorization,
    );
    return spec.query ? httpRequest.query(spec.query) : httpRequest;
  };

  await buildRequest();

  const samples = [];
  let lastResponse = null;

  for (let index = 0; index < RUNS; index += 1) {
    const started = performance.now();
    lastResponse = await buildRequest();
    samples.push(performance.now() - started);
  }

  const body = lastResponse.body;
  const items = Array.isArray(body?.data?.items)
    ? body.data.items
    : [];
  const points = Array.isArray(body?.data?.series?.points)
    ? body.data.series.points
    : [];
  const piiFindings = scanPii(body);
  const leaks = scanErrorLeaks(body, false);
  const bytes = bytesOf(body);
  const withinByteLimit = bytes < spec.maxBytes;
  const withinItemLimit =
    spec.maxItems === undefined || items.length <= spec.maxItems;
  const withinPointLimit =
    spec.maxPoints === undefined || points.length <= spec.maxPoints;
  const statusOk = lastResponse.status === spec.expectedStatus;

  if (!statusOk) {
    fail(`${spec.name}: estado ${lastResponse.status}, esperado ${spec.expectedStatus}`);
  }

  if (!withinByteLimit) {
    fail(
      `${spec.name}: ${bytes} bytes supera el límite de ${spec.maxBytes} bytes`,
    );
  }

  if (!withinItemLimit) {
    fail(
      `${spec.name}: ${items.length} elementos supera el límite de ${spec.maxItems}`,
    );
  }

  if (!withinPointLimit) {
    fail(
      `${spec.name}: ${points.length} puntos supera el límite de ${spec.maxPoints}`,
    );
  }

  if (piiFindings.length > 0) {
    fail(`${spec.name}: se detectaron claves o valores PII`);
  }

  if (leaks.length > 0) {
    fail(`${spec.name}: la respuesta contiene detalles internos`);
  }

  if (Math.max(...samples) > 1000) {
    warnings.push(
      `${spec.name}: ejecución máxima ${round(Math.max(...samples))} ms; no se declara SLA`,
    );
  }

  return {
    name: spec.name,
    status: lastResponse.status,
    statusOk,
    bytes,
    maxBytes: spec.maxBytes,
    withinByteLimit,
    itemCount: items.length,
    maxItems: spec.maxItems ?? null,
    withinItemLimit,
    pointCount: points.length,
    maxPoints: spec.maxPoints ?? null,
    withinPointLimit,
    warningsCount: Array.isArray(body?.warnings)
      ? body.warnings.length
      : 0,
    dataKeys: objectKeys(body?.data),
    piiFindings,
    internalLeaks: leaks,
    timing: summarizeSamples(samples),
  };
};

const runProbe = async (probe, authorization) => {
  const httpRequest = applyAuth(
    request(app).get(probe.path),
    authorization,
  );
  const response = probe.query
    ? await httpRequest.query(probe.query)
    : await httpRequest;
  const piiFindings = scanPii(response.body);
  const leaks = scanErrorLeaks(response.body, response.status >= 400);
  const ok = response.status === probe.expectedStatus;

  if (!ok) {
    fail(
      `sonda ${probe.name}: estado ${response.status}, esperado ${probe.expectedStatus}`,
    );
  }

  if (piiFindings.length > 0) {
    fail(`sonda ${probe.name}: PII en la respuesta`);
  }

  if (leaks.length > 0) {
    fail(`sonda ${probe.name}: detalles internos en la respuesta`);
  }

  return {
    name: probe.name,
    status: response.status,
    expectedStatus: probe.expectedStatus,
    ok,
    bytes: bytesOf(response.body),
    piiFindings,
    internalLeaks: leaks,
  };
};

const capturePipelines = async (departureId) => {
  const captures = {};
  const originalAggregate = DateRangeModel.aggregate;
  let current = [];

  DateRangeModel.aggregate = function (pipeline, ...args) {
    current.push(copyPipeline(pipeline));
    return originalAggregate.call(this, pipeline, ...args);
  };

  try {
    const repository = new AnalyticsRepository();

    const capture = async (name, operation) => {
      current = [];
      await operation();
      captures[name] = current;
    };

    await capture("summary", () => repository.findSummary({}));
    await capture("summaryByDeparture", () =>
      repository.findSummary({ dateRangeId: departureId }),
    );
    await capture("departures", () =>
      repository.findDepartures({}, { limit: 100, cursor: null }),
    );
    await capture("detail", () =>
      repository.findDepartureById(departureId, {}),
    );
    await capture("trends", () =>
      repository.findTrendData(departureId, {
        dateRangeId: departureId,
      }),
    );

    return { captures, originalAggregate };
  } finally {
    DateRangeModel.aggregate = originalAggregate;
  }
};

const explainPipelines = async (departureId) => {
  const { captures, originalAggregate } =
    await capturePipelines(departureId);
  const result = {};

  for (const name of [
    "summary",
    "summaryByDeparture",
    "departures",
    "detail",
    "trends",
  ]) {
    const pipelines = captures[name] ?? [];

    if (pipelines.length !== 1) {
      fail(`${name}: se esperaba un pipeline y se capturaron ${pipelines.length}`);
      result[name] = { captured: pipelines.length };
      continue;
    }

    try {
      const explain = await originalAggregate
        .call(DateRangeModel, pipelines[0])
        .explain("executionStats");
      result[name] = summarizeExplain(explain);
    } catch {
      fail(`${name}: no se pudo obtener explain executionStats`);
      result[name] = { captured: 1, explainFailed: true };
    }
  }

  for (const [name, summary] of Object.entries(result)) {
    for (const lookup of summary.lookups ?? []) {
      if (lookup.collectionScans > 0) {
        fail(`${name}: $lookup sobre ${lookup.from} hizo collection scan`);
      }
    }
  }

  return result;
};

const setStdoutSuppressed = (suppressed) => {
  if (suppressed && !stdoutOriginalWrite) {
    stdoutOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, encoding, callback) => {
      if (typeof encoding === "function") {
        encoding();
      } else if (typeof callback === "function") {
        callback();
      }
      return true;
    };
    return;
  }

  if (!suppressed && stdoutOriginalWrite) {
    process.stdout.write = stdoutOriginalWrite;
    stdoutOriginalWrite = null;
  }
};

const writeResult = (payload) => {
  setStdoutSuppressed(false);
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  if (OUT_PATH) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, json, "utf8");
  }

  process.stdout.write(json);
};

let globalDepartureId = null;

const main = async () => {
  setStdoutSuppressed(true);
  await connectDatabase();

  const departure = await pickDeparture();
  globalDepartureId = departure._id.toString();

  const counts = {
    dateRanges: await DateRangeModel.countDocuments({}),
    bookings: await mongoose.connection
      .collection("Bookings")
      .countDocuments({}),
    payments: await mongoose.connection
      .collection("Payments")
      .countDocuments({}),
    tourPackages: await mongoose.connection
      .collection("Tour_Packages")
      .countDocuments({}),
    tourists: await mongoose.connection
      .collection("Tourists")
      .countDocuments({}),
    roles: await mongoose.connection.collection("Roles").countDocuments({}),
  };

  const admin = await roleAuthorization("administrador");
  const operator = await roleAuthorization("operador de ventas");
  const guide = await roleAuthorization("guia de turismo");

  if (!admin) {
    fail("No se encontró el rol administrador");
  }

  if (!operator) {
    fail("No se encontró el rol operador de ventas");
  }

  if (!guide) {
    fail("No se encontró el rol guia de turismo");
  }

  if (!admin || !operator || !guide) {
    throw new Error("Faltan roles requeridos");
  }

  const roleMatrix = {
    anonymous: await runRoleMatrix(undefined, 401),
    guide: await runRoleMatrix(guide, 403),
    administrator: await runRoleMatrix(admin, 200),
    operator: await runRoleMatrix(operator, 200),
  };

  for (const [roleName, checks] of Object.entries(roleMatrix)) {
    for (const check of checks) {
      if (!check.ok) {
        fail(
          `matriz ${roleName}/${check.name}: estado ${check.status}, esperado ${check.expectedStatus}`,
        );
      }
    }
  }

  const endpointSpecs = [
    {
      name: "overview",
      path: "/api/v1/analytics",
      maxBytes: 5 * 1024,
      expectedStatus: 200,
    },
    {
      name: "summary",
      path: "/api/v1/analytics/summary",
      maxBytes: 5 * 1024,
      expectedStatus: 200,
    },
    {
      name: "summaryByDeparture",
      path: "/api/v1/analytics/summary",
      query: { dateRangeId: globalDepartureId },
      maxBytes: 5 * 1024,
      expectedStatus: 200,
    },
    {
      name: "departures",
      path: "/api/v1/analytics/departures",
      query: { limit: 100 },
      maxBytes: 250 * 1024,
      maxItems: 100,
      expectedStatus: 200,
    },
    {
      name: "detail",
      path: `/api/v1/analytics/departures/${globalDepartureId}`,
      maxBytes: 10 * 1024,
      expectedStatus: 200,
    },
    {
      name: "trends",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        from: "2025-10-10",
        to: AS_OF,
      },
      maxBytes: 250 * 1024,
      maxPoints: 400,
      expectedStatus: 200,
    },
  ];

  const endpoints = [];
  for (const spec of endpointSpecs) {
    endpoints.push(await runEndpoint(spec, admin));
  }

  const asOfInstant = new Date(`${AS_OF}T00:00:00.000Z`);
  const dayMs = 86_400_000;
  const nextDay = new Date(asOfInstant.getTime() + dayMs)
    .toISOString()
    .slice(0, 10);
  const maxFrom = new Date(asOfInstant.getTime() - 399 * dayMs)
    .toISOString()
    .slice(0, 10);
  const excessiveFrom = new Date(asOfInstant.getTime() - 400 * dayMs)
    .toISOString()
    .slice(0, 10);
  const unknownId = new mongoose.Types.ObjectId().toString();

  const probes = [
    {
      name: "limit-0",
      path: "/api/v1/analytics/departures",
      query: { limit: 0 },
      expectedStatus: 400,
    },
    {
      name: "limit-101",
      path: "/api/v1/analytics/departures",
      query: { limit: 101 },
      expectedStatus: 400,
    },
    {
      name: "limit-decimal",
      path: "/api/v1/analytics/departures",
      query: { limit: 1.5 },
      expectedStatus: 400,
    },
    {
      name: "limit-text",
      path: "/api/v1/analytics/departures",
      query: { limit: "abc" },
      expectedStatus: 400,
    },
    {
      name: "limit-negative",
      path: "/api/v1/analytics/departures",
      query: { limit: -1 },
      expectedStatus: 400,
    },
    {
      name: "cursor-invalid",
      path: "/api/v1/analytics/departures",
      query: { cursor: "not-a-cursor" },
      expectedStatus: 400,
    },
    {
      name: "unknown-param-departures",
      path: "/api/v1/analytics/departures",
      query: { limit: 10, all: "true" },
      expectedStatus: 400,
    },
    {
      name: "unknown-param-summary",
      path: "/api/v1/analytics/summary",
      query: { skip: 1000 },
      expectedStatus: 400,
    },
    {
      name: "invalid-date-range-id",
      path: "/api/v1/analytics/summary",
      query: { dateRangeId: "invalid" },
      expectedStatus: 400,
    },
    {
      name: "reversed-dates",
      path: "/api/v1/analytics/summary",
      query: { from: AS_OF, to: "2026-11-01" },
      expectedStatus: 400,
    },
    {
      name: "incomplete-date",
      path: "/api/v1/analytics/summary",
      query: { from: "2026-11" },
      expectedStatus: 400,
    },
    {
      name: "trends-max-window",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        from: maxFrom,
        to: AS_OF,
      },
      expectedStatus: 200,
    },
    {
      name: "trends-excessive-window",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        from: excessiveFrom,
        to: AS_OF,
      },
      expectedStatus: 400,
    },
    {
      name: "trends-future-to",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        from: AS_OF,
        to: nextDay,
      },
      expectedStatus: 400,
    },
    {
      name: "trends-huge-window",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        from: "1900-01-01",
        to: AS_OF,
      },
      expectedStatus: 400,
    },
    {
      name: "trends-invalid-granularity",
      path: "/api/v1/analytics/trends",
      query: {
        dateRangeId: globalDepartureId,
        granularity: "year",
      },
      expectedStatus: 400,
    },
    {
      name: "trends-unknown-param",
      path: "/api/v1/analytics/trends",
      query: { dateRangeId: globalDepartureId, limit: 10 },
      expectedStatus: 400,
    },
    {
      name: "trends-missing-date-range",
      path: "/api/v1/analytics/trends",
      expectedStatus: 400,
    },
    {
      name: "detail-invalid-id",
      path: "/api/v1/analytics/departures/invalid",
      expectedStatus: 400,
    },
    {
      name: "detail-unknown-id",
      path: `/api/v1/analytics/departures/${unknownId}`,
      expectedStatus: 404,
    },
  ];

  const limitProbes = [];
  for (const probe of probes) {
    limitProbes.push(await runProbe(probe, admin));
  }

  const explains = await explainPipelines(globalDepartureId);
  const guardrails = sourceGuardrails();

  if (!guardrails.routerProtected) {
    fail("El router analítico no aplica authMiddleware y analyticsRoleGuard");
  }

  if (!guardrails.repositoryUsesAggregate) {
    fail("El repositorio analítico no usa aggregate");
  }

  if (!guardrails.departuresLimitBounded) {
    fail("El DTO de salidas no acota limit entre 1 y 100");
  }

  if (!guardrails.frontend.checked) {
    warnings.push("No se pudo inspeccionar el servicio analítico del frontend");
  } else if (!guardrails.frontend.aggregatesOnly) {
    fail("El frontend analítico consume endpoints transaccionales");
  }

  const mongoVersion =
    explains.summary?.serverVersion ??
    explains.departures?.serverVersion ??
    null;

  const payload = {
    task: TASK,
    generatedAt: new Date().toISOString(),
    environment: {
      database: mongoose.connection.db.databaseName,
      asOf: AS_OF,
      dataOrigin: "fictitious-local",
      businessValidation: "not-performed",
      backendCommit: readGitHead(process.cwd()),
      frontendCommit: readGitHead(
        path.resolve(process.cwd(), "..", "tourOperatorReactMui"),
      ),
      nodeVersion: process.version,
      mongoVersion,
      measuredRunsPerEndpoint: RUNS,
      performanceNote:
        "Tiempos locales de referencia; no se declara SLA ni validación empresarial.",
    },
    dataset: counts,
    roleMatrix,
    endpoints,
    limitProbes,
    explains,
    sourceGuardrails: guardrails,
    privacy: {
      forbiddenKeysChecked: [...FORBIDDEN_KEYS].sort(),
      emailPatternChecked: true,
      phonePatternChecked: true,
      tokensStored: false,
      connectionStringsStored: false,
      piiStored: false,
    },
    warnings,
    result: {
      status: failures.length === 0 ? "PASS" : "FAIL",
      failures,
    },
  };

  return payload;
};

main()
  .then((payload) => {
    writeResult(payload);
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  })
  .catch((error) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Error desconocido";
    const redacted = message.replace(
      /mongodb(\+srv)?:\/\/\S+/gi,
      "[redacted]",
    );
    const safeMessage = redacted.includes("ECONNREFUSED")
      ? "No se pudo conectar a MongoDB local"
      : redacted;
    const payload = {
      task: TASK,
      generatedAt: new Date().toISOString(),
      result: {
        status: "FAIL",
        failures: failures.length > 0 ? failures : [safeMessage],
      },
    };
    writeResult(payload);
    process.exitCode = 1;
  })
  .finally(async () => {
    setStdoutSuppressed(false);
    await mongoose.disconnect().catch(() => undefined);
  });
