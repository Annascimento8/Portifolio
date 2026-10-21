const apiBase = '/api';

const form = document.getElementById('content-form');
const tableBody = document.getElementById('content-table-body');
const statusBox = document.getElementById('status-box');
const emptyState = document.getElementById('empty-state');
const ADMIN_SECRET_KEY = 'portfolio-admin-secret';

function getAdminSecret() {
  const saved = localStorage.getItem(ADMIN_SECRET_KEY);
  if (saved) {
    return saved;
  }

  const secret = window.prompt('Informe a chave administrativa do painel:', '');
  if (secret && secret.trim()) {
    localStorage.setItem(ADMIN_SECRET_KEY, secret.trim());
    return secret.trim();
  }

  return '';
}

function buildHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra
  };

  const secret = getAdminSecret();
  if (secret) {
    headers['x-admin-secret'] = secret;
  }

  return headers;
}

function setStatus(message, isError = false) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.style.color = isError ? '#b91c1c' : '#166534';
}

async function loadItems() {
  try {
    const response = await fetch(`${apiBase}/content?type=all`, {
      headers: buildHeaders()
    });
    const items = await response.json();

    if (!Array.isArray(items) || !items.length) {
      if (tableBody) {
        tableBody.innerHTML = '';
      }
      if (emptyState) {
        emptyState.hidden = false;
      }
      return;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.title || 'Sem título'}</td>
        <td>${(item.type || 'project').toUpperCase()}</td>
        <td>${item.status || 'draft'}</td>
        <td>
          <button type="button" class="row-action" data-action="edit" data-id="${item.id}">Editar</button>
          <button type="button" class="row-action danger" data-action="delete" data-id="${item.id}">Excluir</button>
          <button type="button" class="row-action publish" data-action="publish" data-id="${item.id}">Publicar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    setStatus('Não foi possível carregar os itens do portfólio.', true);
  }
}

function fillForm(item) {
  if (!form) return;

  form.title.value = item.title || '';
  form.description.value = item.description || item.short_description || '';
  form.github_url.value = item.github_url || '';
  form.live_url.value = item.live_url || '';
  form.image_url.value = item.image_url || '';
  form.type.value = item.type || 'project';
  form.featured.checked = Boolean(item.featured);
  form.status.value = item.status || 'draft';
  form.id.value = item.id || '';
}

function resetForm() {
  if (!form) return;
  form.reset();
  form.id.value = '';
  form.type.value = 'project';
  form.status.value = 'draft';
  form.featured.checked = false;
}

async function saveItem(event) {
  event.preventDefault();

  if (!form) return;

  const payload = {
    id: form.id.value || `content-${Date.now()}`,
    type: form.type.value,
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    short_description: form.description.value.trim(),
    github_url: form.github_url.value.trim(),
    live_url: form.live_url.value.trim(),
    image_url: form.image_url.value.trim(),
    featured: form.featured.checked,
    status: form.status.value,
    tags: []
  };

  if (!payload.title) {
    setStatus('O título é obrigatório.', true);
    return;
  }

  try {
    const response = await fetch(`${apiBase}/content`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Falha ao salvar');
    }

    setStatus('Conteúdo salvo com sucesso.');
    resetForm();
    await loadItems();
  } catch (error) {
    setStatus(error.message || 'Erro ao salvar o conteúdo.', true);
  }
}

async function deleteItem(id) {
  try {
    const response = await fetch(`${apiBase}/content`, {
      method: 'DELETE',
      headers: buildHeaders(),
      body: JSON.stringify({ id })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Falha ao excluir');
    }

    setStatus('Conteúdo removido.');
    await loadItems();
  } catch (error) {
    setStatus(error.message || 'Erro ao excluir o conteúdo.', true);
  }
}

async function publishToLinkedIn(id) {
  try {
    const response = await fetch(`${apiBase}/content?type=all`, {
      headers: buildHeaders()
    });
    const items = await response.json();
    const item = Array.isArray(items) ? items.find((entry) => entry.id === id) : null;

    if (!item) {
      throw new Error('Item não encontrado para publicação.');
    }

    const publishResponse = await fetch(`${apiBase}/linkedin`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ ...item, item })
    });

    const result = await publishResponse.json();

    if (!publishResponse.ok || !result.ok) {
      throw new Error(result.error || 'Falha na publicação');
    }

    setStatus('Publicação enviada ao LinkedIn com sucesso.');
  } catch (error) {
    setStatus(error.message || 'Erro ao publicar no LinkedIn.', true);
  }
}

async function handleTableActions(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === 'delete') {
    await deleteItem(id);
    return;
  }

  if (action === 'publish') {
    await publishToLinkedIn(id);
    return;
  }

  if (action === 'edit') {
    try {
      const response = await fetch(`${apiBase}/content?type=all`, {
        headers: buildHeaders()
      });
      const items = await response.json();
      const item = items.find((entry) => entry.id === id);

      if (item) {
        fillForm(item);
        setStatus('Conteúdo carregado no formulário.');
      }
    } catch (error) {
      setStatus('Não foi possível carregar o item para edição.', true);
    }
  }
}

if (form) {
  form.addEventListener('submit', saveItem);
}

if (tableBody) {
  tableBody.addEventListener('click', handleTableActions);
}

window.addEventListener('DOMContentLoaded', () => {
  loadItems();
});
