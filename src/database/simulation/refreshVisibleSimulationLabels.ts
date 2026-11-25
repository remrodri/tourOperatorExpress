import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { BookingModel } from "../../modules/booking/model/BookingModel";
import { TourPackageModel } from "../../modules/tourPackage/model/TourPackageModel";
import { SIMULATION_DATABASE } from "./simulationConfig";
import { sha256Hex, stableStringify } from "./simulationRandom";
import { replaceVisibleSimulationLabel } from "./visibleSimulationLabels";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const protectedPackageHash = (packages: Record<string, unknown>[]): string => sha256Hex(stableStringify(
  packages.map((tourPackage) => ({
    _id: String(tourPackage._id),
    tourType: String(tourPackage.tourType ?? ""),
    touristDestination: String(tourPackage.touristDestination ?? ""),
    dateRanges: (tourPackage.dateRanges as unknown[] | undefined)?.map(String) ?? [],
    dataOrigin: tourPackage.dataOrigin,
    simulationId: tourPackage.simulationId,
    simulationVersion: tourPackage.simulationVersion,
    simulationSeed: tourPackage.simulationSeed,
    simulationKey: tourPackage.simulationKey,
  })).sort((left, right) => left._id.localeCompare(right._id)),
));

const run = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI es obligatorio");
  await mongoose.connect(mongoUri);
  if (mongoose.connection.db?.databaseName !== SIMULATION_DATABASE) {
    throw new Error(`Solo se permite la base ${SIMULATION_DATABASE}`);
  }

  const bookings = await BookingModel.find({
    dataOrigin: "simulated",
    notes: /simulad/i,
  }).select("_id notes").lean().exec();
  const packages = await TourPackageModel.find({ dataOrigin: "simulated" })
    .select("_id name itinerary tourType touristDestination dateRanges dataOrigin simulationId simulationVersion simulationSeed simulationKey")
    .lean()
    .exec();
  const packageChanges = packages.flatMap((tourPackage) => {
    const original = tourPackage.itinerary;
    const changed = JSON.parse(JSON.stringify(original)) as typeof original;
    const originalName = tourPackage.name ?? "";
    const changedName = replaceVisibleSimulationLabel(originalName);
    let replacements = 0;
    changed?.days?.forEach((day) => day.activities?.forEach((activity) => {
      const next = replaceVisibleSimulationLabel(activity.description ?? "");
      if (next !== activity.description) {
        activity.description = next;
        replacements += 1;
      }
    }));
    return replacements > 0 || changedName !== originalName
      ? [{
        id: tourPackage._id.toString(),
        nameBefore: originalName,
        nameAfter: changedName,
        itineraryBefore: original,
        itineraryAfter: changed,
        replacements,
      }]
      : [];
  });
  const beforeHash = protectedPackageHash(packages as unknown as Record<string, unknown>[]);

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    bookingChanges: bookings.length,
    packageChanges: packageChanges.length,
    packageNameChanges: packageChanges.filter((item) => item.nameBefore !== item.nameAfter).length,
    activityChanges: packageChanges.reduce((sum, item) => sum + item.replacements, 0),
  }, null, 2));
  if (!apply || (bookings.length === 0 && packageChanges.length === 0)) return;

  const backupRoot = getArg("--backup-path");
  if (!backupRoot) throw new Error("--backup-path es obligatorio con --apply");
  await mkdir(backupRoot, { recursive: true });
  const backupPath = path.join(
    backupRoot,
    `visible-labels-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(backupPath, JSON.stringify({ bookings, packages: packageChanges }, null, 2), "utf8");

  if (bookings.length > 0) {
    await BookingModel.bulkWrite(bookings.map((booking) => ({
      updateOne: {
        filter: { _id: booking._id, dataOrigin: "simulated" },
        update: { $set: { notes: replaceVisibleSimulationLabel(booking.notes ?? "") } },
      },
    })));
  }
  if (packageChanges.length > 0) {
    await TourPackageModel.bulkWrite(packageChanges.map((tourPackage) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(tourPackage.id), dataOrigin: "simulated" },
        update: { $set: { name: tourPackage.nameAfter, itinerary: tourPackage.itineraryAfter } },
      },
    })));
  }

  const remainingBookings = await BookingModel.countDocuments({
    dataOrigin: "simulated",
    notes: /simulad/i,
  });
  const remainingPackages = await TourPackageModel.countDocuments({
    dataOrigin: "simulated",
    $or: [
      { name: /simulad/i },
      { "itinerary.days.activities.description": /simulad/i },
    ],
  });
  const packagesAfter = await TourPackageModel.find({ dataOrigin: "simulated" })
    .select("_id tourType touristDestination dateRanges dataOrigin simulationId simulationVersion simulationSeed simulationKey")
    .lean()
    .exec();
  const afterHash = protectedPackageHash(packagesAfter as unknown as Record<string, unknown>[]);
  console.log(JSON.stringify({
    mode: "verification",
    backupPath,
    remainingBookings,
    remainingPackages,
    protectedRelationsBeforeHash: beforeHash,
    protectedRelationsAfterHash: afterHash,
    relationsPreserved: beforeHash === afterHash,
  }, null, 2));
  if (remainingBookings !== 0 || remainingPackages !== 0 || beforeHash !== afterHash) {
    throw new Error("Persisten marcas visibles de simulación");
  }
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
