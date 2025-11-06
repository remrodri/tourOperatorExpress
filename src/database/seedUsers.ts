import { UserModel } from "../modules/user/model/userModel";
import { RoleModel } from "../modules/role/model/roleModel";
import { hashPassword } from "../utils/bcryptUtils";

export async function seedUsers(): Promise<void> {
  try {
    const existingUsers = await UserModel.countDocuments();

    if (existingUsers > 0) {
      console.log("Ya existen usuarios en la base de datos, seed omitido");
      return;
    }

    // Buscar los roles requeridos
    const roles = await RoleModel.find({
      name: { $in: ["administrador", "operador de ventas", "guia de turismo"] },
    });

    if (roles.length !== 3) {
      console.log("Faltan roles. Ejecuta primero: seedRoles()");
      return;
    }

    const adminRole = roles.find((r) => r.name === "administrador")!._id;
    const operadorRole = roles.find(
      (r) => r.name === "operador de ventas"
    )!._id;
    const guiaRole = roles.find((r) => r.name === "guia de turismo")!._id;

    const users = [
      {
        firstName: "María Fernanda",
        lastName: "Quiroga Salazar",
        phone: "71234567",
        ci: "6789123 LP",
        email: "maria.quiroga@admin.bo",
        password: await hashPassword("AdminBolivia2024"),
        role: adminRole,
        address: "Zona Sur, La Paz",
        imagePath: "/uploads/perfilImage/image-1737042598312-854757107.jpg",
      },
      {
        firstName: "José Carlos",
        lastName: "Rojas Mendoza",
        phone: "72123456",
        ci: "8123456 CB",
        email: "jose.rojas@ventas.bo",
        password: await hashPassword("VentasBol2024"),
        role: operadorRole,
        address: "Av. Blanco Galindo, Cochabamba",
        imagePath: "/uploads/perfilImage/image-1737126818109-245359609.jpg",
      },
      {
        firstName: "Valeria",
        lastName: "López Chávez",
        phone: "73123456",
        ci: "7345678 SC",
        email: "valeria.lopez@guia.bo",
        password: await hashPassword("GuiaBol2024"),
        role: guiaRole,
        address: "Av. Cristo Redentor, Santa Cruz",
        imagePath: "/uploads/perfilImage/image-1737070949610-475315359.jpg",
      },
    ];

    await UserModel.insertMany(users);
    console.log("Usuarios de prueba creados correctamente");
  } catch (error) {
    console.error("Error al sembrar los usuarios:", error);
  }
}
