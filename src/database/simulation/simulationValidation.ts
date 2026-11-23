import { resolveDateRangeBounds } from "../../modules/dateRange/domain/dateRangeNormalization";
import {
  BookingStatus,
  SimulationBookingDoc,
  SimulationDataset,
  SimulationDateRangeDoc,
  SimulationPaymentDoc,
  SimulationTouristDoc,
  SimulationTourPackageDoc,
  parseSimulationDate,
  toDateOnly,
} from "./simulationPlan";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export interface SimulationValidationCheck {
  name: string;
  passed: boolean;
  details?: string;
}

export interface SimulationValidationReport {
  passed: boolean;
  checks: SimulationValidationCheck[];
  failed: SimulationValidationCheck[];
}

export interface SimulationValidationOptions {
  strictVariation?: boolean;
  allowOverCapacity?: boolean;
}

const isValidIsoDateTime = (value: string): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

const summarizeIssues = (issues: string[]): string =>
  issues.slice(0, 8).join(" | ") +
  (issues.length > 8 ? ` | +${issues.length - 8} más` : "");

const uniqueIssueCount = (values: string[]): number =>
  values.length - new Set(values).size;

export const validateSimulationDataset = (
  dataset: SimulationDataset,
  options: SimulationValidationOptions = {}
): SimulationValidationReport => {
  const checks: SimulationValidationCheck[] = [];
  const add = (name: string, passed: boolean, details?: string): void => {
    checks.push({
      name,
      passed,
      ...(details ? { details } : {}),
    });
  };

  try {
    const {
      config,
      referenceData,
      collections,
      simulationId,
      summary,
    } = dataset;

    const dateRanges = collections.Date_Ranges;
    const tourPackages = collections.Tour_Packages;
    const tourists = collections.Tourists;
    const bookings = collections.Bookings;
    const payments = collections.Payments;

    const allDocuments: Array<
      | SimulationDateRangeDoc
      | SimulationTourPackageDoc
      | SimulationTouristDoc
      | SimulationBookingDoc
      | SimulationPaymentDoc
    > = [
      ...dateRanges,
      ...tourPackages,
      ...tourists,
      ...bookings,
      ...payments,
    ];

    const traceabilityIssues = allDocuments
      .filter(
        (document) =>
          document.dataOrigin !== "simulated" ||
          document.simulationId !== simulationId ||
          document.simulationVersion !== config.version ||
          document.simulationSeed !== config.seed ||
          !document.simulationKey
      )
      .map((document) => document._id);
    add(
      "trazabilidad de simulación",
      traceabilityIssues.length === 0,
      summarizeIssues(traceabilityIssues)
    );

    const duplicateIdIssues = [
      ...dateRanges.map((document) => document._id),
      ...tourPackages.map((document) => document._id),
      ...tourists.map((document) => document._id),
      ...bookings.map((document) => document._id),
      ...payments.map((document) => document._id),
    ];
    add(
      "identificadores únicos",
      uniqueIssueCount(duplicateIdIssues) === 0,
      `duplicados: ${uniqueIssueCount(duplicateIdIssues)}`
    );

    const duplicateKeyIssues = [
      ...dateRanges.map((document) => document.simulationKey),
      ...tourPackages.map((document) => document.simulationKey),
      ...tourists.map((document) => document.simulationKey),
      ...bookings.map((document) => document.simulationKey),
      ...payments.map((document) => document.simulationKey),
    ];
    add(
      "claves naturales únicas",
      uniqueIssueCount(duplicateKeyIssues) === 0,
      `duplicados: ${uniqueIssueCount(duplicateKeyIssues)}`
    );

    const destinationIds = new Set(
      referenceData.destinations.map((destination) => destination.id)
    );
    const tourTypeIds = new Set(
      referenceData.tourTypes.map((tourType) => tourType.id)
    );
    const sellerIds = new Set(
      referenceData.sellers.map((seller) => seller.id)
    );
    const guideIds = new Set(referenceData.guides.map((guide) => guide.id));

    const packageById = new Map(
      tourPackages.map((tourPackage) => [tourPackage._id, tourPackage])
    );
    const dateRangeById = new Map(
      dateRanges.map((dateRange) => [dateRange._id, dateRange])
    );
    const touristById = new Map(
      tourists.map((tourist) => [tourist._id, tourist])
    );
    const bookingById = new Map(
      bookings.map((booking) => [booking._id, booking])
    );
    const paymentById = new Map(
      payments.map((payment) => [payment._id, payment])
    );

    const packageIssues: string[] = [];
    for (const tourPackage of tourPackages) {
      if (!destinationIds.has(tourPackage.touristDestination)) {
        packageIssues.push(`${tourPackage._id}: destino inexistente`);
      }
      if (!tourTypeIds.has(tourPackage.tourType)) {
        packageIssues.push(`${tourPackage._id}: tipo de tour inexistente`);
      }
      if (tourPackage.duration !== tourPackage.itinerary.days.length) {
        packageIssues.push(`${tourPackage._id}: itinerario incoherente`);
      }
      if (tourPackage.dateRanges.length === 0) {
        packageIssues.push(`${tourPackage._id}: sin salidas`);
      }
      for (const dateRangeId of tourPackage.dateRanges) {
        if (!dateRangeById.has(dateRangeId)) {
          packageIssues.push(`${tourPackage._id}: salida inexistente ${dateRangeId}`);
        }
      }
      if (tourPackage.status !== "active" || tourPackage.deleted !== false) {
        packageIssues.push(`${tourPackage._id}: estado de paquete inválido`);
      }
      if (!(tourPackage.price > 0)) {
        packageIssues.push(`${tourPackage._id}: precio inválido`);
      }
    }
    add("paquetes íntegros", packageIssues.length === 0, summarizeIssues(packageIssues));

    const periodStart = parseSimulationDate(config.periodStart);
    const periodEnd = parseSimulationDate(config.periodEnd);
    const asOf = parseSimulationDate(config.asOf);

    const dateRangeIssues: string[] = [];
    for (const dateRange of dateRanges) {
      if (!Number.isInteger(dateRange.capacity) || dateRange.capacity <= 0) {
        dateRangeIssues.push(`${dateRange._id}: capacidad inválida`);
      }
      if (
        !isValidIsoDateTime(dateRange.startDate) ||
        !isValidIsoDateTime(dateRange.endDate)
      ) {
        dateRangeIssues.push(`${dateRange._id}: fechas inválidas`);
        continue;
      }

      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      if (startDate.getTime() > endDate.getTime()) {
        dateRangeIssues.push(`${dateRange._id}: inicio posterior al fin`);
      }
      if (
        startDate.getTime() < periodStart.getTime() ||
        startDate.getTime() > periodEnd.getTime()
      ) {
        dateRangeIssues.push(`${dateRange._id}: fuera del periodo`);
      }

      const bounds = resolveDateRangeBounds({ startDate, endDate });
      if (JSON.stringify(bounds.dates) !== JSON.stringify(dateRange.dates)) {
        dateRangeIssues.push(`${dateRange._id}: fechas de salida incoherentes`);
      }

      const expectedState =
        endDate.getTime() < asOf.getTime() ? "completed" : "pending";
      if (dateRange.state !== expectedState) {
        dateRangeIssues.push(`${dateRange._id}: estado temporal inválido`);
      }

      for (const guideId of dateRange.guides) {
        if (!guideIds.has(guideId)) {
          dateRangeIssues.push(`${dateRange._id}: guía inexistente ${guideId}`);
        }
      }

      const tourPackage = packageById.get(dateRange.tourPackageId);
      if (!tourPackage) {
        dateRangeIssues.push(`${dateRange._id}: paquete inexistente`);
      } else if (!tourPackage.dateRanges.includes(dateRange._id)) {
        dateRangeIssues.push(`${dateRange._id}: paquete sin referencia inversa`);
      }
    }
    add(
      "salidas íntegras",
      dateRangeIssues.length === 0,
      summarizeIssues(dateRangeIssues)
    );

    const touristIssues: string[] = [];
    for (const tourist of tourists) {
      if (!/^[a-z0-9.]+@example\.com$/.test(tourist.email)) {
        touristIssues.push(`${tourist._id}: correo ficticio inválido`);
      }
      if (!/^[67]\d{7}$/.test(tourist.phone)) {
        touristIssues.push(`${tourist._id}: teléfono ficticio inválido`);
      }
      if (/simulad|registro/i.test(`${tourist.firstName} ${tourist.lastName}`)) {
        touristIssues.push(`${tourist._id}: nombre con marca técnica visible`);
      }
      if (!tourist.nationality || !["ci", "passport"].includes(tourist.documentType)) {
        touristIssues.push(`${tourist._id}: nacionalidad o tipo documental inválido`);
      }
      if (tourist.documentType === "ci" && !/^\d{7,8}$/.test(tourist.ci)) {
        touristIssues.push(`${tourist._id}: CI ficticio inválido`);
      }
      if (tourist.documentType === "passport" && !/^[A-Z]{2}\d{7}$/.test(tourist.passportNumber)) {
        touristIssues.push(`${tourist._id}: pasaporte ficticio inválido`);
      }
      try {
        parseSimulationDate(tourist.dateOfBirth);
      } catch {
        touristIssues.push(`${tourist._id}: fecha de nacimiento inválida`);
      }
      if (tourist.bookingIds.length !== 1) {
        touristIssues.push(`${tourist._id}: debe pertenecer a una sola reserva`);
      }
      const booking = bookingById.get(tourist.bookingIds[0]);
      if (!booking) {
        touristIssues.push(`${tourist._id}: reserva inexistente`);
      } else if (!booking.touristsIds.includes(tourist._id)) {
        touristIssues.push(`${tourist._id}: reserva sin referencia inversa`);
      }
    }
    add(
      "turistas ficticios e íntegros",
      touristIssues.length === 0,
      summarizeIssues(touristIssues)
    );

    const paymentsByBooking = new Map<string, SimulationPaymentDoc[]>();
    for (const payment of payments) {
      const current = paymentsByBooking.get(payment.bookingId) ?? [];
      current.push(payment);
      paymentsByBooking.set(payment.bookingId, current);
    }

    const paymentIssues: string[] = [];
    for (const payment of payments) {
      if (!(payment.amount > 0)) {
        paymentIssues.push(`${payment._id}: monto inválido`);
      }
      if (!ISO_DATE_ONLY.test(payment.paymentDate)) {
        paymentIssues.push(`${payment._id}: fecha de pago inválida`);
      }
      if (!sellerIds.has(payment.sellerId)) {
        paymentIssues.push(`${payment._id}: vendedor inexistente`);
      }
      if (!isValidIsoDateTime(payment.createdAt) || !isValidIsoDateTime(payment.updatedAt)) {
        paymentIssues.push(`${payment._id}: marcas de tiempo inválidas`);
      } else {
        if (payment.createdAt.slice(0, 10) !== payment.paymentDate) {
          paymentIssues.push(`${payment._id}: fecha de pago incoherente`);
        }
        if (new Date(payment.createdAt).getTime() > asOf.getTime()) {
          paymentIssues.push(`${payment._id}: pago posterior a asOf`);
        }
        if (new Date(payment.updatedAt).getTime() > asOf.getTime()) {
          paymentIssues.push(`${payment._id}: actualización posterior a asOf`);
        }
        if (
          new Date(payment.updatedAt).getTime() <
          new Date(payment.createdAt).getTime()
        ) {
          paymentIssues.push(`${payment._id}: actualización anterior al pago`);
        }
      }

      const booking = bookingById.get(payment.bookingId);
      if (!booking) {
        paymentIssues.push(`${payment._id}: reserva inexistente`);
        continue;
      }
      if (!booking.paymentIds.includes(payment._id)) {
        paymentIssues.push(`${payment._id}: reserva sin referencia inversa`);
      }
      if (!booking.touristsIds.includes(payment.touristId)) {
        paymentIssues.push(`${payment._id}: turista ajeno a la reserva`);
      }
      const dateRange = dateRangeById.get(booking.dateRangeId);
      if (dateRange) {
        const bookingCreatedAt = new Date(booking.createdAt);
        const latestAllowed = new Date(
          Math.min(
            asOf.getTime(),
            new Date(dateRange.startDate).getTime() - 24 * 60 * 60 * 1000
          )
        );
        const paymentDate = new Date(`${payment.paymentDate}T00:00:00.000Z`);
        if (paymentDate.getTime() < bookingCreatedAt.getTime()) {
          paymentIssues.push(`${payment._id}: pago anterior a la reserva`);
        }
        if (paymentDate.getTime() > latestAllowed.getTime()) {
          paymentIssues.push(`${payment._id}: pago posterior al límite permitido`);
        }
      }
    }
    add(
      "pagos íntegros",
      paymentIssues.length === 0,
      summarizeIssues(paymentIssues)
    );

    const bookingIssues: string[] = [];
    const bookingCodes = new Set<string>();
    for (const booking of bookings) {
      if (!BOOKING_STATUSES.includes(booking.status)) {
        bookingIssues.push(`${booking._id}: estado inválido`);
      }
      if (booking.touristsIds.length === 0) {
        bookingIssues.push(`${booking._id}: sin turistas`);
      }
      if (!(booking.totalPrice > 0)) {
        bookingIssues.push(`${booking._id}: precio total inválido`);
      }
      if (!booking.paymentProofFolder) {
        bookingIssues.push(`${booking._id}: carpeta de comprobante vacía`);
      }
      if (!/^RSV-[A-Za-z0-9_-]{12}$/.test(booking.bookingCode)) {
        bookingIssues.push(`${booking._id}: código de reserva inválido`);
      }
      if (bookingCodes.has(booking.bookingCode)) {
        bookingIssues.push(`${booking._id}: código de reserva duplicado`);
      }
      bookingCodes.add(booking.bookingCode);

      if (!sellerIds.has(booking.sellerId)) {
        bookingIssues.push(`${booking._id}: vendedor inexistente`);
      }

      const dateRange = dateRangeById.get(booking.dateRangeId);
      if (!dateRange) {
        bookingIssues.push(`${booking._id}: salida inexistente`);
      } else {
        if (dateRange.tourPackageId !== booking.tourPackageId) {
          bookingIssues.push(`${booking._id}: paquete distinto al de la salida`);
        }
        if (
          !isValidIsoDateTime(booking.createdAt) ||
          !isValidIsoDateTime(booking.updatedAt)
        ) {
          bookingIssues.push(`${booking._id}: marcas de tiempo inválidas`);
        } else {
          const createdAt = new Date(booking.createdAt);
          const updatedAt = new Date(booking.updatedAt);
          const departureStart = new Date(dateRange.startDate);
          const departureEnd = new Date(dateRange.endDate);

          if (createdAt.getTime() >= departureStart.getTime()) {
            bookingIssues.push(`${booking._id}: reserva creada después de la salida`);
          }
          if (createdAt.getTime() > asOf.getTime()) {
            bookingIssues.push(`${booking._id}: reserva posterior a asOf`);
          }
          if (updatedAt.getTime() < createdAt.getTime()) {
            bookingIssues.push(`${booking._id}: actualización anterior a la creación`);
          }
          if (updatedAt.getTime() > asOf.getTime()) {
            bookingIssues.push(`${booking._id}: actualización posterior a asOf`);
          }

          if (
            departureEnd.getTime() < asOf.getTime() &&
            !["completed", "cancelled"].includes(booking.status)
          ) {
            bookingIssues.push(`${booking._id}: estado incompatible con salida pasada`);
          }
          if (
            departureEnd.getTime() >= asOf.getTime() &&
            booking.status === "completed"
          ) {
            bookingIssues.push(`${booking._id}: completada antes de finalizar`);
          }
        }
      }

      for (const touristId of booking.touristsIds) {
        const tourist = touristById.get(touristId);
        if (!tourist) {
          bookingIssues.push(`${booking._id}: turista inexistente ${touristId}`);
        } else if (!tourist.bookingIds.includes(booking._id)) {
          bookingIssues.push(`${booking._id}: turista sin referencia inversa`);
        }
      }

      const bookingPayments = paymentsByBooking.get(booking._id) ?? [];
      if (bookingPayments.length !== booking.paymentIds.length) {
        bookingIssues.push(`${booking._id}: pagos declarados incoherentes`);
      }
      for (const paymentId of booking.paymentIds) {
        const payment = paymentById.get(paymentId);
        if (!payment) {
          bookingIssues.push(`${booking._id}: pago inexistente ${paymentId}`);
        } else if (payment.bookingId !== booking._id) {
          bookingIssues.push(`${booking._id}: pago de otra reserva`);
        }
      }

      const paidAmount = bookingPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      if (paidAmount > booking.totalPrice + 0.01) {
        bookingIssues.push(`${booking._id}: pagos superan el precio total`);
      }

      if (booking.status === "cancelled") {
        if (booking.cancellationFee < 0 || booking.refundAmount < 0) {
          bookingIssues.push(`${booking._id}: cargos o reembolsos negativos`);
        }
        if (
          Math.abs(
            booking.cancellationFee + booking.refundAmount - paidAmount
          ) > 0.01
        ) {
          bookingIssues.push(`${booking._id}: cargos y reembolso no cuadran`);
        }
        if (booking.refundAmount > 0 && !booking.refundedAt) {
          bookingIssues.push(`${booking._id}: reembolso sin fecha`);
        }
        if (booking.refundAmount === 0 && booking.refundedAt !== null) {
          bookingIssues.push(`${booking._id}: fecha de reembolso sin monto`);
        }
        if (booking.refundedAt) {
          if (!isValidIsoDateTime(booking.refundedAt)) {
            bookingIssues.push(`${booking._id}: fecha de reembolso inválida`);
          } else {
            const refundedAt = new Date(booking.refundedAt);
            if (refundedAt.getTime() > asOf.getTime()) {
              bookingIssues.push(`${booking._id}: reembolso posterior a asOf`);
            }
            if (refundedAt.getTime() < new Date(booking.createdAt).getTime()) {
              bookingIssues.push(`${booking._id}: reembolso anterior a la reserva`);
            }
          }
        }
      } else if (
        booking.cancellationFee !== 0 ||
        booking.refundAmount !== 0 ||
        booking.refundedAt !== null
      ) {
        bookingIssues.push(`${booking._id}: cargos de cancelación inesperados`);
      }

      if (booking.status === "completed") {
        if (booking.attendance.length !== booking.touristsIds.length) {
          bookingIssues.push(`${booking._id}: asistencia incompleta`);
        }
        for (const attendance of booking.attendance) {
          if (!booking.touristsIds.includes(attendance.touristId)) {
            bookingIssues.push(`${booking._id}: asistencia de turista ajeno`);
          }
          if (!["present", "absent"].includes(attendance.status)) {
            bookingIssues.push(`${booking._id}: estado de asistencia inválido`);
          }
        }
      } else if (booking.attendance.length > 0) {
        bookingIssues.push(`${booking._id}: asistencia en reserva no completada`);
      }
    }
    add(
      "reservas íntegras",
      bookingIssues.length === 0,
      summarizeIssues(bookingIssues)
    );

    const activeTouristsByDateRange = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") {
        continue;
      }
      activeTouristsByDateRange.set(
        booking.dateRangeId,
        (activeTouristsByDateRange.get(booking.dateRangeId) ?? 0) +
          booking.touristsIds.length
      );
    }

    const allowOverCapacity =
      options.allowOverCapacity === true ||
      config.allowOverCapacityForTesting === true;

    const overCapacity = dateRanges.filter((dateRange) => {
      const activeTourists =
        activeTouristsByDateRange.get(dateRange._id) ?? 0;
      return activeTourists > dateRange.capacity;
    });

    add(
      "capacidad respetada",
      allowOverCapacity || overCapacity.length === 0,
      overCapacity.map((dateRange) => dateRange._id).join(" | ")
    );

    const summaryIssues: string[] = [];
    if (summary.collections.Date_Ranges !== dateRanges.length) {
      summaryIssues.push("Date_Ranges");
    }
    if (summary.collections.Tour_Packages !== tourPackages.length) {
      summaryIssues.push("Tour_Packages");
    }
    if (summary.collections.Tourists !== tourists.length) {
      summaryIssues.push("Tourists");
    }
    if (summary.collections.Bookings !== bookings.length) {
      summaryIssues.push("Bookings");
    }
    if (summary.collections.Payments !== payments.length) {
      summaryIssues.push("Payments");
    }
    add(
      "resumen coherente",
      summaryIssues.length === 0,
      summarizeIssues(summaryIssues)
    );

    if (options.strictVariation !== false) {
      const distinctDestinations = new Set(
        tourPackages.map((tourPackage) => tourPackage.touristDestination)
      ).size;
      add(
        "variedad de destinos",
        distinctDestinations >= Math.min(2, referenceData.destinations.length),
        `destinos distintos: ${distinctDestinations}`
      );

      const distinctTourTypes = new Set(
        tourPackages.map((tourPackage) => tourPackage.tourType)
      ).size;
      add(
        "variedad de tipos de tour",
        distinctTourTypes >= Math.min(2, referenceData.tourTypes.length),
        `tipos distintos: ${distinctTourTypes}`
      );

      const distinctMonths = new Set(
        dateRanges.map((dateRange) => dateRange.startDate.slice(0, 7))
      ).size;
      add(
        "variedad temporal",
        distinctMonths >= 3,
        `meses distintos: ${distinctMonths}`
      );

      const occupancyBuckets = new Set(
        dateRanges.map((dateRange) => {
          const activeTourists =
            activeTouristsByDateRange.get(dateRange._id) ?? 0;
          return Math.floor((activeTourists / dateRange.capacity) * 10);
        })
      ).size;
      add(
        "variedad de ocupación",
        occupancyBuckets >= 2,
        `tramos de ocupación distintos: ${occupancyBuckets}`
      );

      const hasPastDeparture = dateRanges.some(
        (dateRange) => new Date(dateRange.endDate).getTime() < asOf.getTime()
      );
      const hasFutureDeparture = dateRanges.some(
        (dateRange) => new Date(dateRange.startDate).getTime() >= asOf.getTime()
      );
      if (bookings.length >= 100 && hasPastDeparture && hasFutureDeparture) {
        const statuses = new Set(bookings.map((booking) => booking.status));
        add(
          "estados variados",
          statuses.size === 4,
          `estados: ${Array.from(statuses).sort().join(", ")}`
        );
      }
    }
  } catch (error) {
    add(
      "estructura del conjunto",
      false,
      error instanceof Error ? error.message : String(error)
    );
  }

  const failed = checks.filter((check) => !check.passed);
  return {
    passed: failed.length === 0,
    checks,
    failed,
  };
};
