const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const fs = require("node:fs/promises");
const path = require("node:path");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

const cache = new Map();

async function compilarPlantilla(nombre) {
  if (!cache.has(nombre)) {
    const ruta = path.join(__dirname, "..", "templates", `${nombre}.hbs`);
    const fuente = await fs.readFile(ruta, "utf8");
    cache.set(nombre, Handlebars.compile(fuente));
  }
  return cache.get(nombre);
}

async function enviarCorreo({ para, asunto, plantilla, parametros }) {
  const render = await compilarPlantilla(plantilla);
  const html = render(parametros);

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: para,
    subject: asunto,
    html,
  });
}

module.exports = { enviarCorreo };
