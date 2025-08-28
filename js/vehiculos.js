let editVehiculoId = null; // null => crear, con valor => editar 

// Abrir modal nuevo vehículo
document.getElementById("openVehiculoModal").onclick = () => {
  editVehiculoId = null;
  document.getElementById("vehiculoForm").reset();
  document.getElementById("vehiculoModalTitle").innerText = "Nuevo Vehículo";
  document.getElementById("vehiculoModal").classList.remove("hidden");
};
function closeVehiculoModal() {
  document.getElementById("vehiculoModal").classList.add("hidden");
}

// ================= VALIDACIONES =================

// Placa: máximo 10 caracteres, solo letras/números
document.getElementById("placa").addEventListener("input", e => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,10);
});

// Marca, modelo, color, tipo_vehiculo, descripción → solo letras y máximo 20 caracteres
["marca","modelo","color","tipo_vehiculo","descripcion"].forEach(id=>{
  document.getElementById(id).addEventListener("input", e => {
    e.target.value = e.target.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ ]/g,"").slice(0,20);
  });
});

// Kilometraje → solo números y no negativos
document.getElementById("kilometraje").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g,"");
  if (parseInt(e.target.value) < 0) e.target.value = "";
});

// Año → solo números, no negativos y no mayor al actual
document.getElementById("anio_fabricacion").addEventListener("input", e => {
  const currentYear = new Date().getFullYear();
  e.target.value = e.target.value.replace(/\D/g,"");
  if (parseInt(e.target.value) < 0) e.target.value = "";
  if (parseInt(e.target.value) > currentYear) e.target.value = currentYear;
});

// ================= CRUD =================
const vehiculosTable = document.getElementById('vehiculosTable').querySelector('tbody');

async function loadVehiculos() {
  try {
    const res = await fetch('https://backend-autos-6.onrender.com/api/vehiculos', { headers: authHeader() });
    if (!res.ok) throw new Error('Error al cargar vehículos');
    const vehiculos = await res.json();

    vehiculosTable.innerHTML = ''; // Limpiar tabla

    vehiculos.forEach(v => {
      vehiculosTable.innerHTML += `
<tr>
  <td>${v.placa}</td>
  <td>${v.marca}</td>
  <td>${v.modelo}</td>
  <td>${v.color}</td>
  <td>${v.tipo_vehiculo}</td>
  <td>${v.descripcion || ''}</td>
  <td>${v.kilometraje}</td>
  <td>${v.anio_fabricacion}</td>
  <td>
    <button class="btn btn-danger" onclick="deleteVehiculo('${v._id}')">Eliminar</button>
    <button class="btn btn-primary" onclick="editVehiculo('${v._id}')">Editar</button>
  </td>
</tr>`;
    });
  } catch (error) {
    console.error(error);
    showError('No se pudieron cargar los vehículos');
  }
}

async function deleteVehiculo(id) {
  try {
    const res = await fetch(`https://backend-autos-6.onrender.com/api/vehiculos/${id}`, { method: 'DELETE', headers: authHeader() });
    if (!res.ok) throw new Error("Error al eliminar");
    showSuccess('Vehículo eliminado');
    await loadVehiculos();
  } catch (err) {
    console.error(err);
    showError("No se pudo eliminar el vehículo");
  }
}

async function editVehiculo(id) {
  try {
    const res = await fetch(`https://backend-autos-6.onrender.com/api/vehiculos/${id}`, { headers: authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener el vehículo');
    const v = await res.json();

    // Llenar el formulario con los datos existentes
    document.getElementById('placa').value = v.placa;
    document.getElementById('marca').value = v.marca;
    document.getElementById('modelo').value = v.modelo;
    document.getElementById('anio_fabricacion').value = v.anio_fabricacion;
    document.getElementById('color').value = v.color;
    document.getElementById('tipo_vehiculo').value = v.tipo_vehiculo;
    document.getElementById('kilometraje').value = v.kilometraje;
    document.getElementById('descripcion').value = v.descripcion || '';

    editVehiculoId = id; // Guardar el ID que se va a editar
    document.getElementById("vehiculoModalTitle").innerText = "Editar Vehículo";
    document.getElementById("vehiculoModal").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showError('No se pudo cargar el vehículo');
  }
}

// ================= GUARDAR (crear/editar) =================
document.getElementById('vehiculoForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const placa = document.getElementById('placa').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const anio_fabricacion = parseInt(document.getElementById('anio_fabricacion').value);
  const color = document.getElementById('color').value.trim();
  const tipo_vehiculo = document.getElementById('tipo_vehiculo').value.trim();
  const kilometraje = parseInt(document.getElementById('kilometraje').value);
  const descripcion = document.getElementById('descripcion').value.trim();

  try {
    let res;
    if (editVehiculoId) {
      // Editar vehículo
      res = await fetch(`https://backend-autos-6.onrender.com/api/vehiculos/${editVehiculoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ marca, modelo, anio_fabricacion, placa, color, tipo_vehiculo, kilometraje, descripcion })
      });
    } else {
      // Crear vehículo
      res = await fetch('https://backend-autos-6.onrender.com/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ marca, modelo, anio_fabricacion, placa, color, tipo_vehiculo, kilometraje, descripcion })
      });
    }

    if (res.ok) {
      showSuccess(editVehiculoId ? 'Vehículo editado' : 'Vehículo agregado');
      await loadVehiculos();
      document.getElementById('vehiculoForm').reset(); 
      closeVehiculoModal();
      editVehiculoId = null;
    } else {
      const err = await res.json();
      showError(err.message || "Error al guardar");
    }
  } catch (err) {
    console.error(err);
    showError('Error al guardar el vehículo');
  }
});

// Cargar lista inicial
if (vehiculosTable) loadVehiculos();
