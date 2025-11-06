import { UserModel } from "../modules/user/model/userModel";
import { QuestionsModel } from "../modules/securitySetup/model/recoveryPassword/question/questionModel";
import { AnswerModel } from "../modules/securitySetup/model/recoveryPassword/answer/answerModel";
import { UserQuestionsAnswersModel } from "../modules/securitySetup/model/recoveryPassword/userQuestionsAnswers/userQuestionsAnswersModel";

export async function seedUserQuestionsAnswers(): Promise<void> {
  try {
    const users = await UserModel.find();
    const questions = await QuestionsModel.find();

    if (users.length === 0) {
      console.log("No hay usuarios registrados, seed omitido");
      return;
    }

    if (questions.length < 3) {
      console.log(
        "No hay suficientes preguntas registradas (mínimo 3). Ejecuta seedQuestions primero."
      );
      return;
    }

    const firstThreeQuestions = questions.slice(0, 3);
    let assignedUsers = 0;

    for (const user of users) {
      const existingQA = await UserQuestionsAnswersModel.findOne({
        user: user._id,
      });

      if (existingQA) {
        console.log(
          `Usuario ${user.email} ya tiene preguntas asignadas, omitido`
        );
        continue;
      }

      // Crear respuestas por defecto (texto genérico en lugar de vacío)
      const answers = await Promise.all(
        firstThreeQuestions.map(async (q) =>
          AnswerModel.create({
            answerText: "pending",
          })
        )
      );

      const userQA = await UserQuestionsAnswersModel.create({
        user: user._id,
        questionsAnswers: firstThreeQuestions.map((q, index) => ({
          question: q._id,
          answer: answers[index]._id,
        })),
      });

      await UserModel.findByIdAndUpdate(user._id, {
        questionsAnswers: userQA._id,
      });

      assignedUsers++;
      console.log(`Preguntas asignadas a ${user.email}`);
    }

    console.log(
      `\n Seed completado: ${assignedUsers} usuarios vinculados con preguntas y respuestas`
    );
  } catch (error) {
    console.error("Error durante el seed de preguntas y respuestas:", error);
  }
}
