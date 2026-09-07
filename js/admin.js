function adminLogin(e) {
  e.preventDefault(); // e.preventDefault lo que hace es evitar el comportamineto predeterminado del navegador, con eso controlo lo que vaya a pasar
  location.href = "admin-orders.html"; // laction representa la ubicacion del navegador, .href es lo que permite cambiar de ubicacion, y lo que esta en comillas dobles es como tal la dirrecion
}
/* esta funcion basicamente lo que hace es que cuando se ejecute adminLogin, evita e comportamiento
normal del formulario y lleva al usuario a la paagina admin-orders.html
 */

function addProduct(e) {
  e.preventDefault();
  const name = document.querySelector("#productName").value; // document representa el documento html, js puede acceder a ese html utilizando document, querySelector sirve para buscar un elemento dentro del HTml, .values es lo que escribio el usuario, es como un input
  /* lo que basicamente significa esta linea es que busca en el 
  html el elemento que tiene id="productName" y guarda en la 
  constante name el valor que escribio el ususario 
  */
  const category = document.querySelector("#productCategory").value;
  /* category es la variable, #productCategory es lo que estamos buscando 
  js obtiene lo selecionado mediante .values
  */
  const price = document.querySelector("#productPrice").value;
  /* aqui es el mismo proceso, basicamente si el ususario escribio 2000
  entonces price contendra "2000", HAY UN DETALLE IMPORTANTE .VALUES NORMALMENTE 
  DEVUELVE TEXTO, INCLUSO SI EL INPUT ES DE TIPO NUMERO O SEA INT
  */
  const tbody = document.querySelector("#adminProducts");
  /* aquei nuevamente se utiiza una constante "const" 
  para cresr tbody y como document.querySelector("adminProducts")
  busca en  hatml un elemento que tenga wl id ="adminProduct".
   entonce js encuentrs ese tbody para agregarle productos.
  */
  tbody.insertAdjacentHTML(
    // insertAdjacenetHTML() es un metodo para insertar HTML desde js
    "beforeend", // // "beforeend" basicamente lo que significa es que agregue el nuevo html al final del elemento
    `<tr><td>${name}</td><td>${category}</td><td>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(price)}</td><td>Editar · Eliminar</td></tr>`, // esto agrega una fila a la tabla
  );
  document.querySelector("#productForm").reset();
  closeModal("productModal");
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#adminLogin")?.addEventListener("submit", adminLogin);
  document
    .querySelector("#productForm")
    ?.addEventListener("submit", addProduct);
});
