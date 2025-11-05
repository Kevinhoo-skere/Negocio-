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
    localStorage.setItem(`datos_${fechaSeleccionada}`, JSON.stringify)
}
function descargarResumen() {
    const resumen = document.getElementById("resumenFinal").textContent;
    if (!resumen) return;
    const blob = new Blob([resumen], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resumen_${fechaSeleccionada}.txt`;
    link.click();
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
