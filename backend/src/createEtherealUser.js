const nodemailer = require("nodemailer");

(async () => {
  let testAccount = await nodemailer.createTestAccount();
  console.log("Credenciales Ethereal:");
  console.log(testAccount);
})();
