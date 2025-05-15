import { UserModel } from "../modules/user/model/userModel";
import { QuestionsModel } from "../modules/securitySetup/model/recoveryPassword/question/questionModel";
import { AnswerModel } from "../modules/securitySetup/model/recoveryPassword/answer/answerModel";
import { UserQuestionsAnswersModel } from "../modules/securitySetup/model/recoveryPassword/userQuestionsAnswers/userQuestionsAnswersModel";

async function seedUserQuestionsAnswers() {
  try {
    const users = await UserModel.find();
    // console.log(`Encontrados ${users.length} usuarios`);

    const questions = await QuestionsModel.find();
    // console.log(`Encontradas ${questions.length} preguntas`);

    if (questions.length < 3) {
      console.error(
        "Error: No hay suficientes preguntas registradas (mínimo 3)."
      );
      return;
    }

    const firstThreeQuestions = questions.slice(0, 3);
    // console.log(
    //   `Usando las primeras 3 preguntas: ${firstThreeQuestions.map(
    //     (q) => q._id
    //   )}`
    // );

    let count = 0;
    for (const user of users) {
      // Verificar si el usuario ya tiene preguntas de manera más segura
      if (
        user.questionsAnswers &&
        (await UserQuestionsAnswersModel.findById(user.questionsAnswers))
      ) {
        // console.log(
        //   `Usuario ${user._id} ya tiene preguntas asignadas, saltando...`
        // );
        continue;
      }

      try {
        // Crear respuestas con un texto predeterminado
        const questionAnswerRefs = await Promise.all(
          firstThreeQuestions.map(async (question) => {
            const answer = await AnswerModel.create({
              answerText: "", // Usar un valor no vacío
            });
            return {
              question: question._id,
              answer: answer._id,
            };
          })
        );

        const userQA = await UserQuestionsAnswersModel.create({
          user: user._id,
          questionsAnswers: questionAnswerRefs,
        });

        await UserModel.findByIdAndUpdate(user._id, {
          questionsAnswers: userQA._id,
        });

        count++;
        console.log(`Preguntas asignadas al usuario ${user._id}`);
      } catch (userError) {
        console.error(`Error al procesar usuario ${user._id}:`, userError);
      }
    }

    // console.log(
    //   `Proceso completado. ${count} usuarios actualizados con preguntas y respuestas.`
    // );
  } catch (error) {
    console.error("Error durante el proceso de seed:", error);
  }
}

export { seedUserQuestionsAnswers };
