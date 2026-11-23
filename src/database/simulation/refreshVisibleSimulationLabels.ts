import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { BookingModel } from "../../modules/booking/model/BookingModel";
import { TourPackageModel } from "../../modules/tourPackage/model/TourPackageModel";
import { SIMULATION_DATABASE } from "./simulationConfig";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const replaceVisibleLabel = (value: string): string =>
  value
    .replace(/Reserva simulada/gi, "Reserva registrada mediante canal web")
    .replace(/Actividad simulada/gi, "Actividad programada");

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
    .select("_id itinerary")
    .lean()
    .exec();
  const packageChanges = packages.flatMap((tourPackage) => {
    const original = tourPackage.itinerary;
    const changed = JSON.parse(JSON.stringify(original)) as typeof original;
    let replacements = 0;
    changed?.days?.forEach((day) => day.activities?.forEach((activity) => {
      const next = replaceVisibleLabel(activity.description ?? "");
      if (next !== activity.description) {
        activity.description = next;
        replacements += 1;
      }
    }));
    return replacements > 0
      ? [{ id: tourPackage._id.toString(), before: original, after: changed, replacements }]
      : [];
  });

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    bookingChanges: bookings.length,
    packageChanges: packageChanges.length,
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
        update: { $set: { notes: replaceVisibleLabel(booking.notes ?? "") } },
      },
    })));
  }
  if (packageChanges.length > 0) {
    await TourPackageModel.bulkWrite(packageChanges.map((tourPackage) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(tourPackage.id), dataOrigin: "simulated" },
        update: { $set: { itinerary: tourPackage.after } },
      },
    })));
  }

  const remainingBookings = await BookingModel.countDocuments({
    dataOrigin: "simulated",
    notes: /simulad/i,
  });
  const remainingPackages = await TourPackageModel.countDocuments({
    dataOrigin: "simulated",
    "itinerary.days.activities.description": /simulad/i,
  });
  console.log(JSON.stringify({
    mode: "verification",
    backupPath,
    remainingBookings,
    remainingPackages,
  }, null, 2));
  if (remainingBookings !== 0 || remainingPackages !== 0) {
    throw new Error("Persisten marcas visibles de simulación");
  }
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
