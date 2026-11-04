document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('finor-arrow-editor');
  if (!editor) return;

  const surface = editor.querySelector('.finor-arrow-surface');
  const image = surface.querySelector('img');
  const markers = editor.querySelector('.finor-arrow-markers');
  const status = editor.querySelector('.finor-arrow-selection');
  let activeRow = null;

  const rows = () => [...document.querySelectorAll('input[name^="flechas-"][name$="-posicion_x"]')]
    .map((field) => field.closest('tr'))
    .filter((row) => row && !row.classList.contains('empty-form'));
  const field = (row, suffix) => row?.querySelector(`[name$="-${suffix}"]`);
  const deleted = (row) => Boolean(field(row, 'DELETE')?.checked);

  function selectRow(row) {
    rows().forEach((item) => item.classList.toggle('finor-arrow-active', item === row));
    activeRow = row;
    status.textContent = row
      ? 'Ahora haz clic en la fotografía para colocar esta flecha.'
      : 'Añade una flecha y selecciona su fila.';
  }

  function renderMarkers() {
    markers.replaceChildren();
    rows().forEach((row) => {
      if (deleted(row)) return;
      const x = Number(field(row, 'posicion_x')?.value);
      const y = Number(field(row, 'posicion_y')?.value);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return;
      if (!field(row, 'posicion_x')?.value || !field(row, 'posicion_y')?.value) return;
      const direction = field(row, 'direccion')?.value || 'ADELANTE';
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `finor-arrow-marker direction-${direction.toLowerCase()}`;
      marker.style.left = `${x * 100}%`;
      marker.style.top = `${y * 100}%`;
      marker.title = field(row, 'etiqueta')?.value || `Flecha: ${direction.toLowerCase()}`;
      marker.setAttribute('aria-label', marker.title);
      marker.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7"/></svg>';
      marker.addEventListener('click', (event) => { event.stopPropagation(); selectRow(row); });
      markers.append(marker);
    });
  }

  surface.addEventListener('click', (event) => {
    if (!activeRow || deleted(activeRow)) {
      status.textContent = 'Selecciona una flecha activa en la tabla.';
      return;
    }
    if (!field(activeRow, 'conexion')?.value) {
      status.textContent = 'Primero elige la conexión a la que llevará esta flecha.';
      return;
    }
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    field(activeRow, 'posicion_x').value = x.toFixed(4);
    field(activeRow, 'posicion_y').value = y.toFixed(4);
    status.textContent = 'Flecha colocada. Guarda la fotografía para verla en la app.';
    renderMarkers();
  });

  document.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (row && rows().includes(row)) selectRow(row);
  });
  document.addEventListener('change', (event) => {
    if (event.target.name?.startsWith('flechas-')) renderMarkers();
  });
  document.addEventListener('input', (event) => {
    if (event.target.name?.startsWith('flechas-')) renderMarkers();
  });

  const imageInput = document.getElementById('id_imagen');
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (file) image.src = URL.createObjectURL(file);
  });

  const inlineGroup = document.getElementById('flechas-group');
  if (inlineGroup) new MutationObserver(() => {
    if (!rows().includes(activeRow)) selectRow(rows().at(-1) || null);
    renderMarkers();
  }).observe(inlineGroup, { childList: true, subtree: true });

  selectRow(rows()[0] || null);
  renderMarkers();
});
