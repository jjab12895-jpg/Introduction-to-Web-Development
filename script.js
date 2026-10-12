"use strict";

/* =====================================================================
   Portafolio de Jonathan Aguilar · interactividad
   Secciones:  1) Menú móvil   2) Desplazamiento suave   3) Filtro de proyectos
               4) Lightbox     5) Validación del formulario
   ===================================================================== */

/* ----- Depuración (Paso 6) -----
   Cambia DEPURAR a true para ver en la consola del navegador qué hace cada función. */
const DEPURAR = false;

function registrar() {
  if (DEPURAR) {
    console.log.apply(console, ["[portafolio]"].concat(Array.prototype.slice.call(arguments)));
  }
}

const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");


/* =====================================================================
   1) MENÚ MÓVIL
   ===================================================================== */
const navegacion = document.querySelector("nav");
const botonMenu = document.querySelector(".menu-toggle");

// Abre o cierra el menú. Sin argumento alterna; con true/false fuerza el estado.
function toggleMenu(forzarAbierto) {
  if (!navegacion || !botonMenu) {
    return;
  }

  const abrir = typeof forzarAbierto === "boolean"
    ? forzarAbierto
    : !navegacion.classList.contains("abierto");

  navegacion.classList.toggle("abierto", abrir);
  botonMenu.setAttribute("aria-expanded", String(abrir));
  registrar("toggleMenu ->", abrir ? "abierto" : "cerrado");
}

if (botonMenu) {
  botonMenu.addEventListener("click", function () {
    toggleMenu();
  });
}

// Con la tecla Escape el menú se cierra y el foco vuelve al botón
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && navegacion && navegacion.classList.contains("abierto")) {
    toggleMenu(false);
    botonMenu.focus();
  }
});


/* =====================================================================
   2) DESPLAZAMIENTO SUAVE
   ===================================================================== */

// Para cualquier enlace interno (href="#algo"): baja con animación hasta esa sección.
function desplazarASeccion(evento) {
  const enlace = evento.target.closest('a[href^="#"]');
  if (!enlace) {
    return;
  }

  const id = enlace.getAttribute("href").slice(1);
  const destino = id ? document.getElementById(id) : null;

  if (!destino) {
    registrar("Enlace interno sin destino:", enlace.getAttribute("href"));
    return; // el navegador se encarga
  }

  evento.preventDefault();
  toggleMenu(false);

  destino.scrollIntoView({
    behavior: prefiereMenosMovimiento.matches ? "auto" : "smooth",
    block: "start"
  });

  // Actualiza la dirección (#seccion) para poder copiar el enlace
  try {
    history.pushState(null, "", "#" + id);
  } catch (error) {
    registrar("No se pudo actualizar la URL:", error.message);
  }

  // Mueve el foco a la sección, para quien usa teclado o lector de pantalla
  if (!destino.hasAttribute("tabindex")) {
    destino.setAttribute("tabindex", "-1");
  }
  destino.focus({ preventScroll: true });
  registrar("Desplazamiento a #" + id);
}

document.addEventListener("click", desplazarASeccion);


/* =====================================================================
   3) FILTRO DE PROYECTOS
   ===================================================================== */
const tarjetasProyecto = document.querySelectorAll(".proyectos-grid article");
const botonesFiltro = document.querySelectorAll(".filtro");
const resultadoFiltro = document.getElementById("resultado-filtro");

// category: "todos", "csharp" o "web" (coincide con data-categoria de cada tarjeta)
function filterProjects(category) {
  let visibles = 0;

  tarjetasProyecto.forEach(function (tarjeta) {
    const categorias = (tarjeta.dataset.categoria || "").split(" ");
    const coincide = category === "todos" || categorias.indexOf(category) !== -1;

    tarjeta.hidden = !coincide;
    if (coincide) {
      visibles++;
    }
  });

  botonesFiltro.forEach(function (boton) {
    boton.setAttribute("aria-pressed", String(boton.dataset.filtro === category));
  });

  if (resultadoFiltro) {
    resultadoFiltro.textContent = visibles === 0
      ? "No hay proyectos en esta categoría."
      : "Mostrando " + visibles + " de " + tarjetasProyecto.length + " proyectos.";
  }

  registrar("filterProjects(" + category + ") ->", visibles, "visibles");
}

botonesFiltro.forEach(function (boton) {
  boton.addEventListener("click", function () {
    filterProjects(boton.dataset.filtro);
  });
});

if (tarjetasProyecto.length > 0) {
  filterProjects("todos"); // estado inicial y mensaje
}


/* =====================================================================
   4) LIGHTBOX (vista modal de las imágenes)
   ===================================================================== */
const ventanaModal = document.getElementById("lightbox");
const imagenAmpliada = document.getElementById("lightbox-img");
const leyendaAmpliada = document.getElementById("lightbox-leyenda");
let botonQueAbrio = null;

// Muestra la imagen recibida en grande, dentro de la ventana modal
function openLightbox(imagen) {
  if (!ventanaModal || !imagen) {
    return;
  }

  const figura = imagen.closest("figure");
  const pie = figura ? figura.querySelector("figcaption") : null;

  imagenAmpliada.src = imagen.currentSrc || imagen.src;
  imagenAmpliada.alt = imagen.alt;
  leyendaAmpliada.textContent = pie ? pie.textContent : "";

  botonQueAbrio = document.activeElement;
  document.body.classList.add("modal-abierto");

  if (typeof ventanaModal.showModal === "function") {
    ventanaModal.showModal();
  } else {
    ventanaModal.setAttribute("open", ""); // respaldo para navegadores sin <dialog>
  }

  registrar("openLightbox ->", imagenAmpliada.src);
}

function closeLightbox() {
  if (!ventanaModal) {
    return;
  }

  if (typeof ventanaModal.close === "function") {
    ventanaModal.close(); // dispara el evento "close" que limpia todo
  } else {
    ventanaModal.removeAttribute("open");
    alCerrarLightbox();
  }
}

// Se ejecuta siempre que la ventana se cierra (botón, Escape o clic fuera)
function alCerrarLightbox() {
  document.body.classList.remove("modal-abierto");

  if (botonQueAbrio) {
    botonQueAbrio.focus();
    botonQueAbrio = null;
  }

  registrar("closeLightbox");
}

if (ventanaModal) {
  ventanaModal.addEventListener("close", alCerrarLightbox);

  // Clic en el fondo oscuro (fuera del contenido) -> cerrar
  ventanaModal.addEventListener("click", function (evento) {
    if (evento.target === ventanaModal) {
      closeLightbox();
    }
  });

  ventanaModal.querySelector(".lightbox-cerrar").addEventListener("click", closeLightbox);
}

document.querySelectorAll(".ampliar").forEach(function (boton) {
  boton.addEventListener("click", function () {
    openLightbox(boton.querySelector("img"));
  });
});


/* =====================================================================
   5) VALIDACIÓN DEL FORMULARIO DE CONTACTO
   ===================================================================== */
const formulario = document.getElementById("formulario-contacto");
const estadoFormulario = document.getElementById("estado-formulario");

// Cada regla devuelve el texto del error, o "" si el valor es correcto
const reglasDeValidacion = {
  nombre: function (valor) {
    if (valor === "") return "Escribe tu nombre.";
    if (valor.length < 2) return "El nombre debe tener al menos 2 caracteres.";
    return "";
  },
  correo: function (valor) {
    if (valor === "") return "Escribe tu correo electrónico.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
      return "Escribe un correo válido, por ejemplo nombre@dominio.com.";
    }
    return "";
  },
  mensaje: function (valor) {
    if (valor === "") return "Escribe un mensaje.";
    if (valor.length < 10) {
      return "El mensaje debe tener al menos 10 caracteres (ahora tiene " + valor.length + ").";
    }
    return "";
  }
};

// Revisa un campo, muestra u oculta su error y devuelve true si es válido
function validarCampo(campo) {
  const regla = reglasDeValidacion[campo.name];
  if (!regla) {
    return true;
  }

  const textoError = regla(campo.value.trim());
  const contenedor = campo.closest(".campo");
  const zonaError = document.getElementById("error-" + campo.name);

  zonaError.textContent = textoError;
  campo.setAttribute("aria-invalid", textoError ? "true" : "false");
  contenedor.classList.toggle("invalido", textoError !== "");
  contenedor.classList.toggle("valido", textoError === "");

  return textoError === "";
}

function mostrarEstado(texto, tipo) {
  estadoFormulario.textContent = texto;
  estadoFormulario.className = tipo || "";
}

if (formulario) {
  const campos = formulario.querySelectorAll("input, textarea");

  // Desactiva los mensajes nativos del navegador para mostrar los propios
  formulario.noValidate = true;

  campos.forEach(function (campo) {
    // Al salir del campo se valida y se marca como "tocado"
    campo.addEventListener("blur", function () {
      campo.dataset.tocado = "true";
      validarCampo(campo);
    });

    // Mientras se escribe: valida en tiempo real, pero solo si ya se tocó el campo
    campo.addEventListener("input", function () {
      if (campo.dataset.tocado === "true") {
        validarCampo(campo);
      }
    });
  });

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let primerCampoInvalido = null;
    let totalErrores = 0;

    campos.forEach(function (campo) {
      campo.dataset.tocado = "true";
      if (!validarCampo(campo)) {
        totalErrores++;
        if (!primerCampoInvalido) {
          primerCampoInvalido = campo;
        }
      }
    });

    if (totalErrores > 0) {
      mostrarEstado(
        totalErrores === 1
          ? "Hay 1 campo por corregir."
          : "Hay " + totalErrores + " campos por corregir.",
        "fallo"
      );
      primerCampoInvalido.focus();
      registrar("Formulario con", totalErrores, "errores");
      return;
    }

    // DEMOSTRACIÓN: aquí iría el envío real a un servidor.
    const nombre = formulario.elements.nombre.value.trim();
    mostrarEstado(
      "Gracias, " + nombre + ". Tu mensaje está listo (demostración: todavía no se envía a ningún servidor).",
      "exito"
    );
    formulario.reset();

    campos.forEach(function (campo) {
      delete campo.dataset.tocado;
      campo.removeAttribute("aria-invalid");
      campo.closest(".campo").classList.remove("valido", "invalido");
    });

    registrar("Formulario válido enviado (simulado)");
  });
}

registrar("Script cargado correctamente");