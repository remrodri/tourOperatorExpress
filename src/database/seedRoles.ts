import { RoleModel } from "../modules/role/model/roleModel";

// Array con las preguntas de seguridad en español
const roles = [
  { name: "administrador", color: "#e06860" },
  { name: "operador de ventas", color: "#7abe74" },
  { name: "guia de turismo", color: "#61afef" },
];

// Función para sembrar los datos
async function seedRoles(): Promise<void> {
  try {
    // Verificar si ya existen preguntas
    const count = await RoleModel.countDocuments();

    if (count === 0) {
      // No hay preguntas, insertar las predefinidas
      await RoleModel.insertMany(roles);
      console.log("Roles insertados correctamente");
    } else {
      console.log("Los roles ya existen en la base de datos");
    }
  } catch (error) {
    console.error("Error al sembrar los roles:", error);
  }
}

// Exportar el modelo y la función de seed
export { RoleModel, seedRoles };
