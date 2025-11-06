import { RoleModel } from "../modules/role/model/roleModel";

const roles = [
  { name: "administrador", color: "#e06860" },
  { name: "operador de ventas", color: "#7abe74" },
  { name: "guia de turismo", color: "#61afef" },
];

async function seedRoles(): Promise<void> {
  try {
    const count = await RoleModel.countDocuments();

    if (count === 0) {
      await RoleModel.insertMany(roles);
      console.log("Roles insertados correctamente");
    } else {
      console.log("Los roles ya existen en la base de datos, seed omitido");
    }
  } catch (error) {
    console.error("Error al sembrar los roles:", error);
  }
}

export { seedRoles };
