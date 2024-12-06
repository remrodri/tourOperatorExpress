const bcrypt = require("bcrypt");

const satlRounds = 10;

const hashPassword = async (password:string):Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, satlRounds);
    console.log("hashedPassword::: ", hashedPassword);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Error al hashear password: ${error}`);
  }
};

const comparePassword = async (password:string, hashedPassword:string) => {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error(`Error al comparar los passwords: ${error}`);
  }
};
module.exports = { hashPassword, comparePassword };
