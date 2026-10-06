// Dirección del backend.
const API = "http://localhost:3000/api";

// Los tres formularios y sus campos.
const pasoCorreo = document.querySelector("#pasoCorreo");
const pasoCodigo = document.querySelector("#pasoCodigo");
const pasoClave = document.querySelector("#pasoClave");
const campoCorreo = document.querySelector("#correo");
const campoCodigo = document.querySelector("#codigo");
const campoClave1 = document.querySelector("#clave1");
const campoClave2 = document.querySelector("#clave2");

// Aquí se guardan el correo y el código para usarlos en el paso 3.
let correoGuardado = "";
let codigoGuardado = "";

// Función auxiliar: envía una petición al backend y devuelve la respuesta.
// Si el backend responde con error, lanza un aviso con su mensaje.
async function llamar(ruta, metodo, cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok)
    throw new Error(datos.message || "No fue posible completar la operación.");
  return datos;
}

// PASO 1: la persona pulsa "Enviar código".
pasoCorreo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = campoCorreo.value.trim();
  try {
    await llamar("/auth/recuperarcontrasenia", "POST", { email: correo });
    correoGuardado = correo;
    pasoCorreo.hidden = true;
    pasoCodigo.hidden = false;
    campoCodigo.focus();
  } catch (error) {
    alert(error.message);
  }
});

// PASO 2: la persona pulsa "Verificar código".
pasoCodigo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = campoCodigo.value.trim();
  try {
    await llamar("/auth/verificarcodigo", "POST", {
      email: correoGuardado,
      codigo,
    });
    codigoGuardado = codigo;
    pasoCodigo.hidden = true;
    pasoClave.hidden = false;
    campoClave1.focus();
  } catch (error) {
    alert(error.message);
  }
});

// PASO 3: la persona pulsa "Cambiar contraseña".
pasoClave.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Las dos contraseñas deben ser iguales.
  if (campoClave1.value !== campoClave2.value) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  try {
    await llamar("/auth/cambiarcontrasenia", "PATCH", {
      email: correoGuardado,
      codigo: codigoGuardado,
      nuevaContrasenia: campoClave1.value,
    });
    alert("Contraseña actualizada. Ahora puedes iniciar sesión.");
    location.href = "admin-login.html"; // vuelve al panel de administrador
  } catch (error) {
    alert(error.message);
  }
});
