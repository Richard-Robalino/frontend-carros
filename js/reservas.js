let editReservaId = null;
const API_URL = import.meta.env.VITE_API_URL;

const reservasTable = document.getElementById('reservasTable').querySelector('tbody');
const clienteSelect = document.getElementById('clienteId');
const vehiculoSelect = document.getElementById('vehiculoId');
const reservaForm = document.getElementById('reservaForm');
const btnSubmitReserva = reservaForm.querySelector('button[type="submit"]');

// =============================
// Cargar clientes en select
// =============================
async function loadClientes() {
  try {
    const res = await fetch('${API_URL}/api/clientes', { headers: authHeader() });
    const data = await res.json();
    clienteSelect.innerHTML = `<option value="">Seleccione Cliente</option>` +
      data.map(c => `<option value="${c._id}">${c.nombre} ${c.apellido}</option>`).join('');
  } catch (err) {
    console.error("Error cargando clientes", err);
  }
}

// =============================
// Cargar vehículos en select
// =============================
async function loadVehiculos() {
  try {
    const res = await fetch('${API_URL}/api/vehiculos', { headers: authHeader() });
    const data = await res.json();
    vehiculoSelect.innerHTML = `<option value="">Seleccione Vehículo</option>` +
      data.map(v => `<option value="${v._id}">${v.marca} ${v.modelo} (${v.placa})</option>`).join('');
  } catch (err) {
    console.error("Error cargando vehículos", err);
  }
}

// =============================
// Cargar reservas en tabla
// =============================
async function loadReservas() {
  try {
    const res = await fetch('${API_URL}/api/reservas', { headers: authHeader() });
    const data = await res.json();

    reservasTable.innerHTML = "";
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.codigo}</td>
        <td>${r.cliente?.nombre || ''} ${r.cliente?.apellido || ''}</td>
        <td>${r.vehiculo?.marca || ''} ${r.vehiculo?.modelo || ''} (${r.vehiculo?.placa || ''})</td>
        <td>${new Date(r.fechaInicio).toLocaleDateString()}</td>
        <td>${new Date(r.fechaFin).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-primary" onclick="editarReserva('${r._id}')">✏️ Editar</button>
          <button class="btn btn-danger" onclick="eliminarReserva('${r._id}')">🗑️ Eliminar</button>
        </td>
      `;
      reservasTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Error cargando reservas", err);
  }
}

// =============================
// Guardar / Actualizar reserva con validación de duplicados
// =============================
reservaForm.addEventListener('submit', async e => {
  e.preventDefault();

  const data = {
    cliente: clienteSelect.value,
    vehiculo: vehiculoSelect.value,
    codigo: document.getElementById('codigo').value.trim(),
    fechaInicio: document.getElementById('fechaInicio').value,
    fechaFin: document.getElementById('fechaFin').value
  };

  // Validar fechas
  if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
    alert("⚠️ La fecha de inicio no puede ser mayor que la de fin");
    return;
  }

  // Validar que las fechas no sean anteriores a hoy
  const hoy = new Date().toISOString().split('T')[0];
  if (data.fechaInicio < hoy || data.fechaFin < hoy) {
    alert("⚠️ Las fechas no pueden ser anteriores a hoy");
    return;
  }

  // Validar que no exista reserva duplicada para el mismo vehículo
  try {
    const resExist = await fetch('${API_URL}/api/reservas', { headers: authHeader() });
    const reservas = await resExist.json();

    const overlap = reservas.some(r => 
      r.vehiculo?._id === data.vehiculo &&
      r._id !== editReservaId && // ignorar si estamos editando la misma reserva
      ((new Date(data.fechaInicio) >= new Date(r.fechaInicio) && new Date(data.fechaInicio) <= new Date(r.fechaFin)) ||
       (new Date(data.fechaFin) >= new Date(r.fechaInicio) && new Date(data.fechaFin) <= new Date(r.fechaFin)) ||
       (new Date(data.fechaInicio) <= new Date(r.fechaInicio) && new Date(data.fechaFin) >= new Date(r.fechaFin)))
    );

    if (overlap) {
      alert("⚠️ Este vehículo ya está reservado en esas fechas");
      return;
    }

  } catch (err) {
    console.error("Error validando fechas duplicadas", err);
  }

  // Guardar o actualizar
  try {
    if (editReservaId) {
      const res = await fetch(`${API_URL}/api/reservas/${editReservaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error al actualizar");
      showSuccess("✅ Reserva actualizada correctamente");
    } else {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error al crear");
      showSuccess("✅ Reserva creada correctamente");
    }
    nuevaReserva();
    await loadReservas();
    closeReservaModal();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar reserva");
  }
});
const reservaModal = document.getElementById('reservaModal');
// =============================
// Botón NUEVA RESERVA
// =============================
// =============================
// Botón NUEVA RESERVA
// =============================
function nuevaReserva() {
  editReservaId = null;
  reservaForm.reset();
  clienteSelect.value = "";
  vehiculoSelect.value = "";
  btnSubmitReserva.textContent = "Guardar Reserva";

  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fechaInicio').setAttribute("min", hoy);
  document.getElementById('fechaFin').setAttribute("min", hoy);
  document.getElementById('reservaModalTitle').textContent = "Nueva Reserva";
  reservaModal.classList.remove('hidden');
  // 🔄 Recargar listas actualizadas al abrir modal
  loadClientes();
  loadVehiculos();

  // Mostrar modal
  document.getElementById("reservaModal").classList.remove("hidden");
}

// =============================
// Cerrar modal
// =============================
function closeReservaModal() {
  document.getElementById("reservaModal").classList.add("hidden");
}


// =============================
// Editar reserva
// =============================
async function editarReserva(id) {
  try {
    const res = await fetch(`${API_URL}/api/reservas/${id}`, { headers: authHeader() });
    const r = await res.json();

    editReservaId = r._id;
    clienteSelect.value = r.cliente?._id || "";
    vehiculoSelect.value = r.vehiculo?._id || "";
    document.getElementById('codigo').value = r.codigo;
    document.getElementById('fechaInicio').value = r.fechaInicio.split('T')[0];
    document.getElementById('fechaFin').value = r.fechaFin.split('T')[0];

    btnSubmitReserva.textContent = "Actualizar Reserva";
    document.getElementById('reservaModalTitle').textContent = "Editar Reserva";

    // 🔹 Abrir modal
    reservaModal.classList.remove('hidden');

    // ❌ Ya no llamamos closeReservaModal()
  } catch (err) {
    console.error("Error al editar reserva", err);
  }
}


// =============================
// Eliminar reserva
// =============================
async function eliminarReserva(id) {
  if (!confirm("¿Seguro que desea eliminar esta reserva?")) return;

  try {
    const res = await fetch(`${API_URL}/api/reservas/${id}`, {
      method: 'DELETE',
      headers: authHeader()
    });
    if (!res.ok) throw new Error("Error al eliminar");
    showSuccess("✅ Reserva eliminada correctamente");
    loadReservas();
  } catch (err) {
    console.error("Error al eliminar", err);
  }
}

// =============================
// Inicialización
// =============================
// Cuando entras a la pestaña "reservas", actualizas listas
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  if (tabId === "reservas") {
    loadClientes();
    loadVehiculos();
    loadReservas();
  }
}
