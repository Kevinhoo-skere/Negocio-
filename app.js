let fechaActual = new Date();
let hoy = fechaActual.toLocaleDateString('es-AR');
let entradas = [], salidas = [], deudores = [];
let fechaSeleccionada = hoy;

function agregarEntrada(tipo) {
    const monto = parseFloat(document.getElementById("ventaMonto").value);
    if (!isNaN(monto)) {
        entradas.push({ monto, tipo });
        actualizarListaEntradas();
        document.getElementById("ventaMonto").value = "";
    }
}

function agregarSalida() {
    const desc = document.getElementById("gastoDesc").value;
    const monto = parseFloat(document.getElementById("gastoMonto").value);
    if (desc && !isNaN(monto)) {
        salidas.push({ desc, monto });
        actualizarListaSalida();
        document.getElementById("gastoDesc").value = "";
        document.getElementById("gastoMonto").value = "";
    }
}

function agregarDeudor() {
    const nombre = document.getElementById("nombreDeudor").value;
    const tel = document.getElementById("telefonoDeudor").value;
    const detalle = document.getElementById("descripcionDeuda").value;
    const monto = parseFloat(document.getElementById("montoDeuda").value);
    if (nombre && tel && detalle && !isNaN(monto)) {
        deudores.push({ nombre, tel, detalle, monto });
        actualizarListaDeudores();
        document.getElementById("nombreDeudor").value = "";
        document.getElementById("telefonoDeudor").value = "";
        document.getElementById("descripcionDeuda").value = "";
        document.getElementById("montoDeuda").value = "";
    }
}

function actualizarListaEntradas() {
    const ul = document.getElementById("listaEntrada");
    ul.innerHTML = "";
    entradas.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `$${e.monto} — ${e.tipo}`;
        ul.appendChild(li);
    });
}

function actualizarListaSalida() {
    const ul = document.getElementById("listaSalida");
    ul.innerHTML = "";
    salidas.forEach((s, i) => {
        const li = document.createElement("li");
        li.textContent = `${s.desc}: $${s.monto}`;
        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.onclick = () => { salidas.splice(i, 1); actualizarListaSalida(); };
        li.appendChild(del);
        ul.appendChild(li);
    });
}

function actualizarListaDeudores() {
    const ul = document.getElementById("listaDeudores");
    ul.innerHTML = "";
    deudores.forEach((d, i) => {
        const li = document.createElement("li");
        li.textContent = `${d.nombre} (${d.tel}): $${d.monto} — ${d.detalle}`;
        const btn1 = document.createElement("button");
        btn1.textContent = "✅ Pagado";
        btn1.onclick = () => { deudores.splice(i, 1); actualizarListaDeudores(); };
        const btn2 = document.createElement("button");
        btn2.textContent = "💰 Pago Parcial";
        btn2.onclick = () => {
            const pago = parseFloat(prompt(`¿Cuánto pagó ${d.nombre}?`, "0"));
            if (!isNaN(pago)) {
                d.monto -= pago;
                if (d.monto <= 0) deudores.splice(i, 1);
                actualizarListaDeudores();
            }
        };
        li.appendChild(btn2);
        li.appendChild(btn1);
        ul.appendChild(li);
    });
}

function generarResumen() {
    const efectivo = entradas.filter(e => e.tipo === 'efectivo').reduce((a, b) => a + b.monto, 0);
    const transf = entradas.filter(e => e.tipo === 'transferencia').reduce((a, b) => a + b.monto, 0);
    const gastos = salidas.reduce((a, b) => a + b.monto, 0);
    const total = efectivo + transf;
    const diezmo = total * 0.1;

    let resumen = `🗓️ Fecha: ${fechaSeleccionada}
💵 Efectivo: $${efectivo}
💳 Transferencia: $${transf}
🔹 Total Vendido: $${total}
🔸 Total Gastado: $${gastos}
📌 Diezmo: $${diezmo.toFixed(2)}\n`;

    if (salidas.length) resumen += `\n📤 Gastos:\n${salidas.map(s => `- ${s.desc}: $${s.monto}`).join("\n")}`;
    if (deudores.length) resumen += `\n\n💳 Deudores:\n${deudores.map(d => `- ${d.nombre} (${d.tel}): $${d.monto} — ${d.detalle}`).join("\n")}`;

    document.getElementById("resumenFinal").textContent = resumen;

    // Guardar datos del día correctamente en localStorage
    const datosGuardar = { entradas, salidas, deudores };
    localStorage.setItem(`datos_${fechaSeleccionada}`, JSON.stringify(datosGuardar));
}

function sanitizeForPDF(text) {
    // quitar emojis y algunos símbolos no soportados, normalizar guiones y puntos suspensivos
    return text
        .replace(/\u2026/g, '...')                 // … -> ...
        .replace(/[—–−]/g, '-')                    // guiones largos -> -
        .replace(/[\u2018\u2019\u201C\u201D]/g, "'")// comillas tipográficas -> '
        .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        ;
}

function descargarResumen() {
    const resumenEl = document.getElementById("resumenFinal");
    const resumen = resumenEl.textContent;
    if (!resumen) return;

    if (window.jspdf && window.html2canvas) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const filename = `resumen_${fechaSeleccionada.replace(/\//g, '-')}.pdf`;

        // Dimensiones PDF en mm y conversión a px (aprox. 96dpi)
        const pdfContentWidthMM = doc.internal.pageSize.getWidth() - 20; // margen 10mm ambos lados
        const pxPerMm = 96 / 25.4;
        const pdfPixelWidth = Math.round(pdfContentWidthMM * pxPerMm);

        // clonar para no tocar la UI y forzar tamaño/estilo de impresión
        const clone = resumenEl.cloneNode(true);
        clone.style.fontFamily = 'Arial, sans-serif';
        clone.style.fontSize = '12px';
        clone.style.lineHeight = '1.25';
        clone.style.whiteSpace = 'pre-wrap';
        clone.style.boxSizing = 'border-box';
        clone.style.background = window.getComputedStyle(resumenEl).backgroundColor || '#ffffff';
        clone.style.color = window.getComputedStyle(resumenEl).color;
        clone.style.width = pdfPixelWidth + 'px'; // clave: forzar ancho real en px

        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '-9999px';
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        // usar devicePixelRatio (limitado) para buena resolución sin excesivo peso
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        window.html2canvas(clone, {
            scale: dpr,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: pdfPixelWidth,
            windowWidth: pdfPixelWidth
        }).then(canvas => {
            // calcular tamaño final en mm manteniendo proporción
            const imgData = canvas.toDataURL('image/png');
            const pdfWidthMM = pdfContentWidthMM;
            const pdfHeightMM = (canvas.height / (canvas.width / (pdfPixelWidth))) * (pdfWidthMM / (pdfPixelWidth / pxPerMm)) / pxPerMm * 25.4;
            // alternativa más estable: calcular por proporción entre pixeles y mm
            const imgWidthMM = pdfWidthMM;
            const imgHeightMM = (canvas.height * (1 / pxPerMm)) * (1 / dpr); // canvas.height px -> mm (aprox)
            // usar imgWidthMM e imgHeightMM para addImage
            doc.addImage(imgData, 'PNG', 10, 10, imgWidthMM, imgHeightMM);
            doc.save(filename);
            document.body.removeChild(wrapper);
        }).catch(err => {
            console.error(err);
            document.body.removeChild(wrapper);
            // fallback al método de texto (sin emojis)
            const safe = sanitizeForPDF(resumen);
            const { jsPDF } = window.jspdf;
            const doc2 = new jsPDF();
            doc2.setFont("helvetica");
            doc2.setFontSize(12);
            const lines = doc2.splitTextToSize(safe, 190);
            doc2.text(lines, 10, 15);
            doc2.save(filename);
        });

        return;
    }

    // Fallback: método de texto (sin emojis)
    const safe = sanitizeForPDF(resumen);
    if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont("helvetica");
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(safe, 190);
        doc.text(lines, 10, 15);
        const filename = `resumen_${fechaSeleccionada.replace(/\//g, '-')}.pdf`;
        doc.save(filename);
        return;
    }

    // Último recurso: abrir ventana para imprimir/guardar
    const w = window.open('', '_blank');
    w.document.write(`<pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size:12px;">${resumen}</pre>`);
    w.document.close();
    w.focus();
    w.print();
}

function cambiarDeDia() {
    // Guardar los datos completos antes de cambiar de día
    const datos = {
        entradas,
        salidas,
        deudores
    };
    localStorage.setItem(`datos_${fechaSeleccionada}`, JSON.stringify(datos));

    // Avanzar la fecha y limpiar datos
    fechaActual.setDate(fechaActual.getDate() + 1);
    fechaSeleccionada = fechaActual.toLocaleDateString('es-AR');
    hoy = fechaSeleccionada;

    entradas = [];
    salidas = [];
    deudores = [];

    document.getElementById("listaEntrada").innerHTML = "";
    document.getElementById("listaSalida").innerHTML = "";
    document.getElementById("listaDeudores").innerHTML = "";
    document.getElementById("resumenFinal").textContent = "";

    actualizarSelectorFechas();
}

function cargarDiaActual() {
    fechaSeleccionada = hoy;
    const datos = JSON.parse(localStorage.getItem(`datos_${fechaSeleccionada}`) || "{}");
    entradas = datos.entradas || [];
    salidas = datos.salidas || [];
    deudores = datos.deudores || [];

    actualizarListaEntradas();
    actualizarListaSalida();
    actualizarListaDeudores();
    document.getElementById("resumenFinal").textContent = "";
}

function cargarFechaSeleccionada() {
    const select = document.getElementById("selectorFecha");
    fechaSeleccionada = select.value;

    const datos = JSON.parse(localStorage.getItem(`datos_${fechaSeleccionada}`) || "{}");
    entradas = datos.entradas || [];
    salidas = datos.salidas || [];
    deudores = datos.deudores || [];

    actualizarListaEntradas();
    actualizarListaSalida();
    actualizarListaDeudores();
    document.getElementById("resumenFinal").textContent = "";
}

function actualizarSelectorFechas() {
    const selector = document.getElementById("selectorFecha");
    selector.innerHTML = "";

    const claves = Object.keys(localStorage).filter(k => k.startsWith("datos_"));
    const fechas = claves.map(k => k.replace("datos_", "")).sort((a, b) => {
        const [da, ma, aa] = a.split("/").map(Number);
        const [db, mb, ab] = b.split("/").map(Number);
        return new Date(ab, mb - 1, db) - new Date(aa, ma - 1, da);
    });

    fechas.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        if (f === fechaSeleccionada) opt.selected = true;
        selector.appendChild(opt);
    });
}

window.onload = () => {
    actualizarSelectorFechas();
    cargarDiaActual();
};
