import { QuestionsModel } from "../modules/securitySetup/model/recoveryPassword/question/questionModel";

// Array con las preguntas de seguridad en español
const securityQuestions = [
  { questionText: "¿Cuál es tu color favorito?" },
  { questionText: "¿Cuál era el nombre de tu primera mascota?" },
  { questionText: "¿Cuál es el apellido de soltera de tu madre?" },
  { questionText: "¿Cuál fue la marca de tu primer automóvil?" },
  { questionText: "¿Cuál es el nombre de la calle donde creciste?" },
  { questionText: "¿Cuál es el nombre de tu mejor amigo de la infancia?" },
  { questionText: "¿Cuál era el nombre de tu primera escuela?" },
  { questionText: "¿En qué ciudad naciste?" },
  { questionText: "¿Cuál era tu materia favorita en la escuela?" },
  { questionText: "¿Cuál es el nombre de tu primer empleador?" },
  { questionText: "¿Cuál era tu apodo durante tu infancia?" },
  { questionText: "¿Cuál es el nombre de tu profesor favorito?" },
];

// Función para sembrar los datos
async function seedQuestions(): Promise<void> {
  try {
    // Verificar si ya existen preguntas
    const count = await QuestionsModel.countDocuments();

    if (count === 0) {
      // No hay preguntas, insertar las predefinidas
      await QuestionsModel.insertMany(securityQuestions);
      console.log("Preguntas de seguridad insertadas correctamente");
    } else {
      console.log("Las preguntas de seguridad ya existen en la base de datos");
    }
  } catch (error) {
    console.error("Error al sembrar las preguntas de seguridad:", error);
  }
}

// Exportar el modelo y la función de seed
export { QuestionsModel, seedQuestions };
