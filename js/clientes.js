let editId = null; // Si es null => crear, si tiene valor => editar

const clientesTable = document.getElementById('clientesTable').querySelector('tbody');

// Abrir / Cerrar modal 
document.getElementById("openClienteModal").onclick = () => { 
  editId = null; 
  document.getElementById("clienteForm").reset(); 
  document.getElementById("modalTitle").innerText = "Nuevo Cliente"; 
  document.getElementById("clienteModal").classList.remove("hidden"); 
}; 

function closeClienteModal() { 
  document.getElementById("clienteModal").classList.add("hidden"); 
}

// Botón CANCELAR dentro del modal
const btnCancelarCliente = document.createElement("button");
btnCancelarCliente.type = "button";
btnCancelarCliente.textContent = "Cancelar";
btnCancelarCliente.className = "btn btn-secondary";
btnCancelarCliente.onclick = closeClienteModal;

// Agregar el botón al final del formulario
const clienteForm = document.getElementById("clienteForm");
clienteForm.appendChild(btnCancelarCliente);

// Validaciones en inputs 
document.getElementById("cedula").addEventListener("input", e => { 
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); 
});

["nombre", "apellido", "ciudad"].forEach(id => { 
  document.getElementById(id).addEventListener("input", e => { 
    e.target.value = e.target.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ ]/g, "").slice(0, 20); 
  }); 
}); 

document.getElementById("telefono").addEventListener("input", e => { 
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); 
});

// Cargar clientes en tabla
async function loadClientes() {
  try {
    const res = await fetch('https://backend-autos-6.onrender.com/api/clientes', { headers: authHeader() });
    if (!res.ok) throw new Error('Error al cargar clientes');
    const clientes = await res.json();

    clientesTable.innerHTML = ''; // Limpiar tabla
    clientes.forEach(c => {
      clientesTable.innerHTML += `
<tr>
  <td>${c.cedula}</td>
  <td>${c.nombre}</td>
  <td>${c.apellido}</td>
  <td>${c.email}</td>
  <td>${c.telefono}</td>
  <td>${c.ciudad}</td>
  <td>${c.direccion}</td>
  <td>${new Date(c.fecha_nacimiento).toLocaleDateString()}</td>
  <td>
    <button class="btn btn-danger" onclick="deleteCliente('${c._id}')">Eliminar</button>
    <button class="btn btn-primary" onclick="editCliente('${c._id}')">Editar</button>
  </td>
</tr>`;
    });
  } catch (error) {
    console.error(error);
    showError('No se pudieron cargar los clientes');
  }
}

// Eliminar cliente
async function deleteCliente(id) {
  if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
  try {
    const res = await fetch(`https://backend-autos-6.onrender.com/api/clientes/${id}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) {
      showSuccess('Cliente eliminado');
      await loadClientes();
    } else {
      showError("Error al eliminar cliente");
    }
  } catch (err) {
    console.error(err);
    showError("Error en el servidor");
  }
}

// Editar cliente
async function editCliente(id) {
  try {
    const res = await fetch(`https://backend-autos-6.onrender.com/api/clientes/${id}`, { headers: authHeader() });
    if (!res.ok) throw new Error('No se pudo obtener el cliente');
    const c = await res.json();

    // Llenar formulario
    document.getElementById('cedula').value = c.cedula;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('apellido').value = c.apellido;
    document.getElementById('emailCliente').value = c.email;
    document.getElementById('telefono').value = c.telefono;
    document.getElementById('ciudad').value = c.ciudad;
    document.getElementById('direccion').value = c.direccion;
    document.getElementById('fecha_nacimiento').value = new Date(c.fecha_nacimiento).toISOString().split('T')[0];

    editId = id; 
    document.getElementById("modalTitle").innerText = "Editar Cliente";
    document.getElementById("clienteModal").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showError('No se pudo cargar el cliente');
  }
}

// Guardar cliente (crear/editar)
clienteForm.addEventListener('submit', async e => {
  e.preventDefault();

  const cedula = document.getElementById('cedula').value;
  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const email = document.getElementById('emailCliente').value;
  const telefono = document.getElementById('telefono').value;
  const ciudad = document.getElementById('ciudad').value;
  const direccion = document.getElementById('direccion').value;
  const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;

  try {
    let res;
    const wasEdit = !!editId;
    if (wasEdit) {
      res = await fetch(`https://backend-autos-6.onrender.com/api/clientes/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ cedula, nombre, apellido, email, telefono, ciudad, direccion, fecha_nacimiento })
      });
      editId = null;
    } else {
      res = await fetch('https://backend-autos-6.onrender.com/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ cedula, nombre, apellido, email, telefono, ciudad, direccion, fecha_nacimiento })
      });
    }

    if (res.ok) {
      showSuccess(wasEdit ? 'Cliente editado' : 'Cliente agregado');
      clienteForm.reset();
      closeClienteModal(); // Cerrar modal tras guardar
      await loadClientes(); // Refrescar tabla
    } else {
      const err = await res.json();
      showError(err.message);
    }
  } catch (err) {
    console.error(err);
    showError('Error al guardar el cliente');
  }
});

// Inicializar tabla al cargar
if (clientesTable) loadClientes();
