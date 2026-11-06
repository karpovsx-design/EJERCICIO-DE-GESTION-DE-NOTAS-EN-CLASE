// ===== Configuración =====
const TOTAL_ESTUDIANTES = 10;
const NOTAS_POR_ESTUDIANTE = 4;
const NOTA_MIN = 0;
const NOTA_MAX = 5;
const NOTA_APROBACION = 3.0;
const CLAVE_STORAGE = "gestorNotas";

// ===== Referencias al DOM =====
const cuerpoTabla = document.getElementById("cuerpoTabla");
const inputAsignatura = document.getElementById("asignatura");
const inputDocente = document.getElementById("docente");
const mensaje = document.getElementById("mensaje");

// ===== Construir la tabla =====
function construirTabla() {
  for (let i = 0; i < TOTAL_ESTUDIANTES; i++) {
    const fila = document.createElement("tr");
    fila.dataset.indice = i;

    let celdasNotas = "";
    for (let n = 0; n < NOTAS_POR_ESTUDIANTE; n++) {
      celdasNotas += `
        <td>
          <input type="number" class="nota" data-nota="${n}"
                 min="${NOTA_MIN}" max="${NOTA_MAX}" step="0.1"
                 aria-label="Nota ${n + 1} del estudiante ${i + 1}">
        </td>`;
    }

    fila.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <input type="text" class="nombre" placeholder="Nombre del estudiante"
               aria-label="Nombre del estudiante ${i + 1}">
      </td>
      ${celdasNotas}
      <td class="promedio">–</td>
      <td><span class="estado pendiente">Pendiente</span></td>`;

    cuerpoTabla.appendChild(fila);
  }
}

// ===== Validación y cálculos =====
function leerNota(input) {
  if (input.value.trim() === "") {
    input.classList.remove("invalida");
    return null;
  }
  const valor = parseFloat(input.value);
  const valida = !isNaN(valor) && valor >= NOTA_MIN && valor <= NOTA_MAX;
  input.classList.toggle("invalida", !valida);
  return valida ? valor : null;
}

function calcularPromedio(notas) {
  if (notas.length === 0) return null;
  const suma = notas.reduce((acc, n) => acc + n, 0);
  return suma / notas.length;
}

function actualizarFila(fila) {
  const inputs = fila.querySelectorAll(".nota");
  const notas = [];
  inputs.forEach((input) => {
    const nota = leerNota(input);
    if (nota !== null) notas.push(nota);
  });

  const promedio = calcularPromedio(notas);
  const celdaPromedio = fila.querySelector(".promedio");
  const etiqueta = fila.querySelector(".estado");

  if (promedio === null) {
    celdaPromedio.textContent = "–";
    etiqueta.textContent = "Pendiente";
    etiqueta.className = "estado pendiente";
  } else {
    celdaPromedio.textContent = promedio.toFixed(2);
    const aprobado = promedio >= NOTA_APROBACION;
    etiqueta.textContent = aprobado ? "Aprobado" : "Reprobado";
    etiqueta.className = "estado " + (aprobado ? "aprobado" : "reprobado");
  }
  return promedio;
}

function actualizarResumen() {
  const promedios = [];
  document.querySelectorAll("#cuerpoTabla tr").forEach((fila) => {
    const p = actualizarFila(fila);
    if (p !== null) promedios.push(p);
  });

  const aprobados = promedios.filter((p) => p >= NOTA_APROBACION).length;
  const reprobados = promedios.length - aprobados;

  document.getElementById("aprobados").textContent = aprobados;
  document.getElementById("reprobados").textContent = reprobados;

  if (promedios.length === 0) {
    ["promCurso", "notaAlta", "notaBaja"].forEach(
      (id) => (document.getElementById(id).textContent = "–")
    );
    return;
  }
  document.getElementById("promCurso").textContent =
    calcularPromedio(promedios).toFixed(2);
  document.getElementById("notaAlta").textContent = Math.max(...promedios).toFixed(2);
  document.getElementById("notaBaja").textContent = Math.min(...promedios).toFixed(2);
}

// ===== Guardar / cargar =====
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  setTimeout(() => (mensaje.textContent = ""), 2500);
}

function guardar() {
  const datos = {
    asignatura: inputAsignatura.value,
    docente: inputDocente.value,
    estudiantes: [],
  };

  document.querySelectorAll("#cuerpoTabla tr").forEach((fila) => {
    datos.estudiantes.push({
      nombre: fila.querySelector(".nombre").value,
      notas: Array.from(fila.querySelectorAll(".nota")).map((i) => i.value),
    });
  });

  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
    mostrarMensaje("✔ Notas guardadas");
  } catch (e) {
    mostrarMensaje("No se pudo guardar en este navegador");
  }
}

function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return;
    const datos = JSON.parse(guardado);

    inputAsignatura.value = datos.asignatura || "";
    inputDocente.value = datos.docente || "";

    const filas = document.querySelectorAll("#cuerpoTabla tr");
    datos.estudiantes.forEach((est, i) => {
      if (!filas[i]) return;
      filas[i].querySelector(".nombre").value = est.nombre || "";
      filas[i].querySelectorAll(".nota").forEach((input, n) => {
        input.value = est.notas[n] ?? "";
      });
    });
  } catch (e) {
    console.error("Error al cargar los datos:", e);
  }
}

// ===== Limpiar =====
function limpiar() {
  if (!confirm("¿Seguro que quieres borrar todas las notas y nombres?")) return;
  document.querySelectorAll("#cuerpoTabla input").forEach((i) => {
    i.value = "";
    i.classList.remove("invalida");
  });
  try { localStorage.removeItem(CLAVE_STORAGE); } catch (e) {}
  actualizarResumen();
  mostrarMensaje("Datos borrados");
}

// ===== Exportar CSV =====
function exportarCSV() {
  const encabezados = ["#", "Estudiante", "Nota 1", "Nota 2", "Nota 3", "Nota 4", "Promedio", "Estado"];
  const lineas = [encabezados.join(";")];

  document.querySelectorAll("#cuerpoTabla tr").forEach((fila, i) => {
    const nombre = fila.querySelector(".nombre").value.replace(/;/g, ",");
    const notas = Array.from(fila.querySelectorAll(".nota")).map((n) => n.value);
    const promedio = fila.querySelector(".promedio").textContent;
    const estado = fila.querySelector(".estado").textContent;
    lineas.push([i + 1, nombre, ...notas, promedio, estado].join(";"));
  });

  const contenido = "\uFEFF" + lineas.join("\n"); // BOM para tildes en Excel
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "notas.csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

// ===== Eventos e inicio =====
cuerpoTabla.addEventListener("input", (e) => {
  if (e.target.classList.contains("nota")) actualizarResumen();
});
document.getElementById("btnGuardar").addEventListener("click", guardar);
document.getElementById("btnLimpiar").addEventListener("click", limpiar);
document.getElementById("btnExportar").addEventListener("click", exportarCSV);

construirTabla();
cargar();
actualizarResumen();
