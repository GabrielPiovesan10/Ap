// ==========================================
// FIREBASE - BANCO DE DADOS NA NUVEM
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDY_WTOjZG_xOnmzebcnL83MBGJZPhShIE",
  authDomain: "bianchin-671f6.firebaseapp.com",
  projectId: "bianchin-671f6",
  storageBucket: "bianchin-671f6.firebasestorage.app",
  messagingSenderId: "455624189366",
  appId: "1:455624189366:web:3a907f14a62a59ddfacd17",
  measurementId: "G-H45CMN2MNB"
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ==========================================
// ESTADO GLOBAL
// ==========================================
let clientes = [];
let equipamentos = [];
let agenda = [];
let os = [];
let financas = [];

// ==========================================
// UTILITÁRIOS
// ==========================================
const formatMoney = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

// Comprime imagem para evitar estourar limite do Firebase
function compressImage(file, callback) {
  if (!file) return callback(null);
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Limita a largura máxima
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.7)); // Compressão 70%
    }
  }
}

// ==========================================
// MODAIS
// ==========================================
window.openModal = function(modalId) {
  if (modalId === 'modal-cliente') {
    document.getElementById('cli-id').value = '';
    ['cli-nome', 'cli-cpf', 'cli-whats', 'cli-email', 'cli-endereco', 'cli-obs'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('title-modal-cliente').textContent = "Novo Cliente";
  } else if (modalId === 'modal-equip') {
    document.getElementById('eq-id').value = '';
    ['eq-nome', 'eq-hori', 'eq-oleo', 'eq-manut', 'eq-doc', 'eq-seguro', 'eq-custos'].forEach(id => document.getElementById(id).value = '');
    
    // Limpa a foto
    const eqImagem = document.getElementById('eq-imagem');
    if(eqImagem) eqImagem.value = '';
    window.currentEquipFoto = null;
    
    document.getElementById('eq-status').value = 'Operacional';
    document.getElementById('title-modal-equip').textContent = "Novo Equipamento";
  } else if (modalId === 'modal-agenda') {
    document.getElementById('ag-id').value = '';
    ['ag-data', 'ag-hora'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ag-status').value = 'Pendente';
    document.getElementById('title-modal-agenda').textContent = "Novo Agendamento";
  } else if (modalId === 'modal-os') {
    document.getElementById('os-id').value = '';
    ['os-numero', 'os-hini', 'os-hfim', 'os-foto', 'os-assinatura'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('os-status').value = 'Em Andamento';
    document.getElementById('title-modal-os').textContent = "Nova Ordem de Serviço";
    // Limpa a foto global de edição
    window.currentOSFoto = null; 
    window.currentOSAssinatura = null;
  } else if (modalId === 'modal-fin') {
    document.getElementById('fin-id').value = '';
    ['fin-desc', 'fin-valor', 'fin-data'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fin-tipo').value = 'Receita';
    document.getElementById('fin-cat').value = 'Serviço';
    document.getElementById('fin-status').value = 'Pago';
    document.getElementById('title-modal-fin').textContent = "Novo Lançamento";
  }
  document.getElementById(modalId).classList.add('active');
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
};

// ==========================================
// RENDERIZAÇÃO
// ==========================================
function renderAll() {
  renderClientes();
  renderEquipamentos();
  renderAgenda();
  renderOS();
  renderFinanceiro();
  renderRelatorios();
  renderDashboard();
}

function renderClientes() {
  const tbody = document.getElementById('tbody-clientes');
  if (tbody) {
    tbody.innerHTML = '';
    clientes.forEach((c) => {
      tbody.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.whats}</td>
          <td>${c.endereco || '-'}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarCliente('${c.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerCliente('${c.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    });
  }
  ['orc-cliente', 'ag-cliente', 'os-cliente'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const prev = el.value;
      el.innerHTML = '<option value="">Selecione</option>';
      clientes.forEach(c => el.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
      el.value = prev;
    }
  });
}

// ATUALIZADO: Renderização de Equipamentos em Formato de Cards bonitões
function renderEquipamentos() {
  const grid = document.getElementById('grid-equipamentos');
  if (grid) {
    grid.innerHTML = ''; // Limpa os estáticos para injetar os do banco
    equipamentos.forEach((e) => {
      
      // Cores para os status
      let colorClass = 'var(--info-color)';
      let bgClass = 'rgba(59, 130, 246, 0.1)';
      if(e.status === 'Operacional') { colorClass = 'var(--accent-color)'; bgClass = 'rgba(16,185,129,0.1)'; }
      else if(e.status === 'Alugado') { colorClass = 'var(--warning-color)'; bgClass = 'rgba(245, 158, 11, 0.1)'; }
      else if(e.status === 'Em Manutenção') { colorClass = 'var(--danger-color)'; bgClass = 'rgba(239, 68, 68, 0.1)'; }

      // Se tiver foto no banco exibe ela, senão exibe o ícone padrão
      const imgHtml = e.fotoBase64 
        ? `<img src="${e.fotoBase64}" alt="${e.nome}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<i class="ph ph-image" style="font-size: 3rem; color: #9ca3af;"></i>`;

      grid.innerHTML += `
        <div class="glass-card equip-card" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; border-radius: 12px;">
          <!-- Área da Imagem -->
          <div style="width: 100%; height: 180px; background-color: #f3f4f6; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${imgHtml}
          </div>
          
          <!-- Informações -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-primary);">${e.nome}</h3>
              <span style="padding: 4px 8px; background: ${bgClass}; color: ${colorClass}; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">${e.status}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-secondary);">
              <span style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-clock" style="font-size: 1rem;"></i> Horímetro: <strong>${e.horimetro || '0'}h</strong></span>
              <span style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-wrench" style="font-size: 1rem;"></i> Próx. Manut.: <strong>${formatDate(e.manutencao) || '-'}</strong></span>
            </div>
          </div>
          
          <!-- Botões -->
          <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <button class="btn" style="flex: 1; padding: 8px; font-size: 0.85rem; background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color);" onclick="editarEquip('${e.id}')">
              <i class="ph ph-pencil"></i> Editar
            </button>
            <button class="btn" style="padding: 8px; font-size: 0.85rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--danger-color);" onclick="removerEquip('${e.id}')">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>`;
    });
  }

  // Preenche os selects da agenda e OS
  ['ag-equip', 'os-equip'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const prev = el.value;
      el.innerHTML = '<option value="">Selecione</option>';
      equipamentos.forEach(e => el.innerHTML += `<option value="${e.id}">${e.nome}</option>`);
      el.value = prev;
    }
  });
}

function renderAgenda() {
  const tbody = document.getElementById('tbody-agenda');
  if (tbody) {
    tbody.innerHTML = '';
    agenda.forEach((a) => {
      const cliName = (clientes.find(c => c.id === a.clienteId) || {}).nome || 'Desconhecido';
      const eqName = (equipamentos.find(e => e.id === a.equipId) || {}).nome || 'Desconhecido';
      tbody.innerHTML += `
        <tr>
          <td>${cliName}</td>
          <td>${eqName}</td>
          <td>${formatDate(a.data)}</td>
          <td>${a.hora || '-'}</td>
          <td>${a.status}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarAgenda('${a.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerAgenda('${a.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    });
  }
}

function renderOS() {
  const tbody = document.getElementById('tbody-os');
  if (tbody) {
    tbody.innerHTML = '';
    os.forEach((o) => {
      const cliName = (clientes.find(c => c.id === o.clienteId) || {}).nome || 'Desconhecido';
      const eqName = (equipamentos.find(e => e.id === o.equipId) || {}).nome || 'Desconhecido';
      tbody.innerHTML += `
        <tr>
          <td>${o.numero}</td>
          <td>${cliName}</td>
          <td>${eqName}</td>
          <td>${o.hini || '-'} / ${o.hfim || '-'}</td>
          <td>${o.status}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarOS('${o.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerOS('${o.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    });
  }
}

let chartInstanceSecundario = null;
function renderFinanceiro() {
  const tbody = document.getElementById('tbody-fin');
  
  let entradas = 0, saidas = 0, aReceber = 0, aPagar = 0, pendentes = 0;

  if (tbody) tbody.innerHTML = '';

  const sorted = [...financas].sort((a, b) => new Date(a.data) - new Date(b.data));
  sorted.forEach((f) => {
    const val = Number(f.valor);
    const isReceita = f.tipo === 'Receita';
    const isPago = f.statusPagamento === 'Pago';

    // Lógica para os Cards Financeiros
    if (isReceita && isPago) entradas += val;
    if (!isReceita && isPago) saidas += val;
    if (isReceita && !isPago) { aReceber += val; pendentes++; }
    if (!isReceita && !isPago) aPagar += val;

    // Preenche a tabela
    if (tbody) {
      const badgeCor = isPago ? 'badge-success' : (f.statusPagamento === 'Atrasado' ? 'badge-danger' : 'badge-warning');
      tbody.innerHTML += `
        <tr>
          <td>${formatDate(f.data)}</td>
          <td>${f.desc}</td>
          <td>${f.categoria || 'Outros'}</td>
          <td><span class="badge ${badgeCor}">${f.statusPagamento || 'Pago'}</span></td>
          <td style="color:${isReceita ? 'var(--accent-color)' : 'var(--danger-color)'}">${formatMoney(f.valor)}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarFin('${f.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerFin('${f.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    }
  });

  // Atualiza Dados na Tela
  const elEntradas = document.getElementById('fin-entradas');
  if (elEntradas) {
    elEntradas.textContent = formatMoney(entradas);
    document.getElementById('fin-saidas').textContent = formatMoney(saidas);
    document.getElementById('fin-fluxo').textContent = formatMoney(entradas - saidas);
    document.getElementById('fin-receber').textContent = formatMoney(aReceber);
    document.getElementById('fin-pagar').textContent = formatMoney(aPagar);
    document.getElementById('fin-pendentes').textContent = pendentes;
  }

  // Gráfico Financeiro Secundário (Pizza ou Barra)
  const ctx = document.getElementById('chartFinanceiroSecundario');
  if (ctx && window.Chart) {
    if (chartInstanceSecundario) chartInstanceSecundario.destroy();
    chartInstanceSecundario = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Entradas (Recebido)', 'Saídas (Pago)'],
        datasets: [{
          data: [entradas, saidas],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: {color: '#f8fafc'} } }
      }
    });
  }
}

function renderRelatorios() {
  let fatMes = 0;
  let recTotal = 0;
  let despTotal = 0;
  let custoDiesel = 0;
  let custoManut = 0;

  const hj = new Date();
  const currentMonth = hj.getMonth();
  const currentYear = hj.getFullYear();

  // Calcula Finanças
  financas.forEach(f => {
    const val = Number(f.valor);
    if (f.tipo === 'Receita') {
      if(f.statusPagamento === 'Pago') recTotal += val;
      if (f.data) {
        const [y, m] = f.data.split('-');
        if (parseInt(y) === currentYear && parseInt(m) - 1 === currentMonth) {
          fatMes += val;
        }
      }
    } else {
      if(f.statusPagamento === 'Pago') despTotal += val;
      if (f.categoria === 'Diesel') custoDiesel += val;
      if (f.categoria === 'Manutenção') custoManut += val;
    }
  });

  const elFatMes = document.getElementById('rel-faturamento-mes');
  if(elFatMes) {
    elFatMes.textContent = formatMoney(fatMes);
    document.getElementById('rel-lucro').textContent = formatMoney(recTotal - despTotal);
    document.getElementById('rel-diesel').textContent = formatMoney(custoDiesel);
    document.getElementById('rel-manutencao').textContent = formatMoney(custoManut);
  }

  // Calcula Rankings (Top Clientes e Top Equipamentos)
  const osPorCliente = {};
  const osPorEquip = {};

  os.forEach(o => {
    osPorCliente[o.clienteId] = (osPorCliente[o.clienteId] || 0) + 1;
    osPorEquip[o.equipId] = (osPorEquip[o.equipId] || 0) + 1;
  });

  const topClientesList = Object.entries(osPorCliente)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(entry => {
      const c = clientes.find(x => x.id === entry[0]);
      return c ? `<li><strong>${c.nome}</strong>: ${entry[1]} obras/locações</li>` : '';
    }).join('');
    
  const elTopCli = document.getElementById('rel-top-clientes');
  if(elTopCli) elTopCli.innerHTML = topClientesList || '<li>Nenhum dado suficiente</li>';

  const topEquipsList = Object.entries(osPorEquip)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(entry => {
      const e = equipamentos.find(x => x.id === entry[0]);
      return e ? `<li><strong>${e.nome}</strong>: Locado em ${entry[1]} OS</li>` : '';
    }).join('');

  const elTopEq = document.getElementById('rel-top-equips');
  if(elTopEq) elTopEq.innerHTML = topEquipsList || '<li>Nenhum dado suficiente</li>';
}

let chartInstanceDashboard = null;
function renderDashboard() {
  const hj = new Date();
  const currentMonth = hj.getMonth();
  const currentYear = hj.getFullYear();
  let fatMes = 0;
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Duas linhas no gráfico
  const faturamentoData = new Array(12).fill(0);
  const lucroData = new Array(12).fill(0);

  financas.forEach(f => {
    // Só contabiliza no gráfico se a conta já estiver paga/recebida
    if (f.data && f.statusPagamento === 'Pago') {
      const [y, m] = f.data.split('-');
      const fMonth = parseInt(m) - 1;
      const fYear = parseInt(y);
      
      if (fYear === currentYear) {
        if (f.tipo === 'Receita') {
          faturamentoData[fMonth] += Number(f.valor);
          lucroData[fMonth] += Number(f.valor); // Soma no lucro
          if (fMonth === currentMonth) fatMes += Number(f.valor);
        } else if (f.tipo === 'Despesa') {
          lucroData[fMonth] -= Number(f.valor); // Subtrai do lucro
        }
      }
    }
  });

  const dashFat = document.getElementById('dash-fat');
  if (dashFat) dashFat.textContent = formatMoney(fatMes);

  const dashOs = document.getElementById('dash-os');
  if (dashOs) dashOs.textContent = os.filter(o => o.status === 'Em Andamento').length;

  const dashMaq = document.getElementById('dash-maq');
  if (dashMaq) dashMaq.textContent = equipamentos.filter(e => e.status === 'Operacional').length;

  const ctx = document.getElementById('chartFaturamento');
  if (ctx && window.Chart) {
    if (chartInstanceDashboard) chartInstanceDashboard.destroy();
    chartInstanceDashboard = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: `Faturamento Bruto`,
            data: faturamentoData,
            borderColor: '#F59E0B', 
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2
          },
          {
            label: `Lucro Líquido (Sobrou)`,
            data: lucroData,
            borderColor: '#10B981', 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            tension: 0.4,
            fill: true,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: {color: '#f8fafc'} } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

// ==========================================
// CRUD - CLIENTES
// ==========================================
window.salvarCliente = async function() {
  const id = document.getElementById('cli-id').value;
  const nome = document.getElementById('cli-nome').value;
  const cpf = document.getElementById('cli-cpf').value;
  const whats = document.getElementById('cli-whats').value;
  const email = document.getElementById('cli-email').value;
  const endereco = document.getElementById('cli-endereco').value;
  const obs = document.getElementById('cli-obs').value;

  if (!nome || !whats) return alert("Nome e WhatsApp são obrigatórios!");
  const data = { nome, cpf, whats, email, endereco, obs };

  if (id) {
    await updateDoc(doc(db, "clientes", id), data);
  } else {
    await addDoc(collection(db, "clientes"), data);
  }
  closeModal('modal-cliente');
};

window.editarCliente = function(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cli-id').value = c.id;
  document.getElementById('cli-nome').value = c.nome || '';
  document.getElementById('cli-cpf').value = c.cpf || '';
  document.getElementById('cli-whats').value = c.whats || '';
  document.getElementById('cli-email').value = c.email || '';
  document.getElementById('cli-endereco').value = c.endereco || '';
  document.getElementById('cli-obs').value = c.obs || '';
  document.getElementById('title-modal-cliente').textContent = "Editar Cliente";
  document.getElementById('modal-cliente').classList.add('active');
};

window.removerCliente = async function(id) {
  if (confirm('Remover este cliente?')) await deleteDoc(doc(db, "clientes", id));
};

// ==========================================
// CRUD - EQUIPAMENTOS (COM UPLOAD DE FOTO)
// ==========================================
window.salvarEquip = async function() {
  const id = document.getElementById('eq-id').value;
  const nome = document.getElementById('eq-nome').value;
  const horimetro = document.getElementById('eq-hori').value;
  const status = document.getElementById('eq-status').value;
  const oleo = document.getElementById('eq-oleo').value;
  const manutencao = document.getElementById('eq-manut').value;
  const docum = document.getElementById('eq-doc').value;
  const seguro = document.getElementById('eq-seguro').value;
  const custos = document.getElementById('eq-custos').value;

  if (!nome) return alert("Nome do equipamento é obrigatório!");

  // Pega o arquivo da imagem inserido no modal
  const inputImagem = document.getElementById('eq-imagem');
  const fotoFile = inputImagem ? inputImagem.files[0] : null;

  // Usa a mesma função de comprimir imagem para economizar espaço
  compressImage(fotoFile, async (fotoB64) => {
    const data = { 
      nome, 
      horimetro: horimetro || '0', 
      status,
      oleo,
      manutencao,
      documentacao: docum,
      seguro,
      custosAcumulados: Number(custos || 0),
      fotoBase64: fotoB64 || window.currentEquipFoto || null
    };

    if (id) {
      await updateDoc(doc(db, "equipamentos", id), data);
    } else {
      await addDoc(collection(db, "equipamentos"), data);
    }
    closeModal('modal-equip');
  });
};

window.editarEquip = function(id) {
  const e = equipamentos.find(x => x.id === id);
  if (!e) return;
  document.getElementById('eq-id').value = e.id;
  document.getElementById('eq-nome').value = e.nome || '';
  document.getElementById('eq-hori').value = e.horimetro || '';
  document.getElementById('eq-status').value = e.status || 'Operacional';
  document.getElementById('eq-oleo').value = e.oleo || '';
  document.getElementById('eq-manut').value = e.manutencao || '';
  document.getElementById('eq-doc').value = e.documentacao || '';
  document.getElementById('eq-seguro').value = e.seguro || '';
  document.getElementById('eq-custos').value = e.custosAcumulados || '';
  
  // Mantém a foto na memória para não sumir ao editar outras informações
  window.currentEquipFoto = e.fotoBase64 || null;
  
  document.getElementById('title-modal-equip').textContent = "Editar Equipamento";
  document.getElementById('modal-equip').classList.add('active');
};

window.removerEquip = async function(id) {
  if (confirm('Remover equipamento?')) await deleteDoc(doc(db, "equipamentos", id));
};

// ==========================================
// CRUD - AGENDA
// ==========================================
window.salvarAgenda = async function() {
  const id = document.getElementById('ag-id').value;
  const clienteId = document.getElementById('ag-cliente').value;
  const equipId = document.getElementById('ag-equip').value;
  const dataPrev = document.getElementById('ag-data').value;
  const horaPrev = document.getElementById('ag-hora').value;
  const status = document.getElementById('ag-status').value;

  if (!clienteId || !equipId || !dataPrev) return alert("Preencha os campos obrigatórios!");
  const data = { clienteId, equipId, data: dataPrev, hora: horaPrev, status };

  if (id) {
    await updateDoc(doc(db, "agenda", id), data);
  } else {
    await addDoc(collection(db, "agenda"), data);
  }
  closeModal('modal-agenda');
};

window.editarAgenda = function(id) {
  const a = agenda.find(x => x.id === id);
  if (!a) return;
  document.getElementById('ag-id').value = a.id;
  document.getElementById('ag-cliente').value = a.clienteId || '';
  document.getElementById('ag-equip').value = a.equipId || '';
  document.getElementById('ag-data').value = a.data || '';
  document.getElementById('ag-hora').value = a.hora || '';
  document.getElementById('ag-status').value = a.status || 'Pendente';
  document.getElementById('title-modal-agenda').textContent = "Editar Agendamento";
  document.getElementById('modal-agenda').classList.add('active');
};

window.removerAgenda = async function(id) {
  if (confirm('Remover agendamento?')) await deleteDoc(doc(db, "agenda", id));
};

// ==========================================
// CRUD - ORDENS DE SERVIÇO (COM FOTOS E AUTOMAÇÃO)
// ==========================================
window.salvarOS = async function() {
  const id = document.getElementById('os-id').value;
  const numero = document.getElementById('os-numero').value;
  const clienteId = document.getElementById('os-cliente').value;
  const equipId = document.getElementById('os-equip').value;
  const hini = document.getElementById('os-hini').value;
  const hfim = document.getElementById('os-hfim').value;
  const status = document.getElementById('os-status').value;

  if (!numero || !clienteId || !equipId) return alert("Preencha Nº OS, Cliente e Equipamento!");

  // Arquivos
  const fotoFile = document.getElementById('os-foto').files[0];
  const assFile = document.getElementById('os-assinatura').files[0];

  // Processa Imagens Base64 se existirem
  compressImage(fotoFile, async (fotoB64) => {
    compressImage(assFile, async (assB64) => {
      
      const data = { 
        numero, clienteId, equipId, hini, hfim, status,
        fotoBase64: fotoB64 || window.currentOSFoto || null,
        assinaturaBase64: assB64 || window.currentOSAssinatura || null
      };

      if (id) {
        await updateDoc(doc(db, "os", id), data);
      } else {
        await addDoc(collection(db, "os"), data);
      }

      // ---------------------------------------------------------
      // NOVA AUTOMAÇÃO: ATUALIZA O STATUS DO EQUIPAMENTO SOZINHO
      // ---------------------------------------------------------
      try {
        const novoStatusEquip = (status === 'Finalizada') ? 'Operacional' : 'Alugado';
        await updateDoc(doc(db, "equipamentos", equipId), { status: novoStatusEquip });
      } catch (err) {
        console.error("Erro ao atualizar o equipamento:", err);
      }
      // ---------------------------------------------------------

      closeModal('modal-os');
    });
  });
};

window.editarOS = function(id) {
  const o = os.find(x => x.id === id);
  if (!o) return;
  document.getElementById('os-id').value = o.id;
  document.getElementById('os-numero').value = o.numero || '';
  document.getElementById('os-cliente').value = o.clienteId || '';
  document.getElementById('os-equip').value = o.equipId || '';
  document.getElementById('os-hini').value = o.hini || '';
  document.getElementById('os-hfim').value = o.hfim || '';
  document.getElementById('os-status').value = o.status || 'Em Andamento';
  
  // Salva as fotos atuais em memória caso ele só edite o texto
  window.currentOSFoto = o.fotoBase64 || null;
  window.currentOSAssinatura = o.assinaturaBase64 || null;

  document.getElementById('title-modal-os').textContent = "Editar OS";
  document.getElementById('modal-os').classList.add('active');
};

window.removerOS = async function(id) {
  if (confirm('Remover OS?')) {
    const o = os.find(x => x.id === id);
    
    // Automação: Se você deletar uma OS que estava em andamento, devolve a máquina pro pátio
    if (o && o.equipId && o.status !== 'Finalizada') {
      try {
        await updateDoc(doc(db, "equipamentos", o.equipId), { status: 'Operacional' });
      } catch(e) {
        console.error("Erro ao liberar equipamento:", e);
      }
    }
    
    await deleteDoc(doc(db, "os", id));
  }
};

// ==========================================
// CRUD - FINANCEIRO
// ==========================================
window.salvarFin = async function() {
  const id = document.getElementById('fin-id').value;
  const desc = document.getElementById('fin-desc').value;
  const tipo = document.getElementById('fin-tipo').value;
  const valor = document.getElementById('fin-valor').value;
  const cat = document.getElementById('fin-cat').value;
  const statusPayment = document.getElementById('fin-status').value;
  const dataLanc = document.getElementById('fin-data').value;

  if (!desc || !valor || !dataLanc) return alert("Preencha todos os campos!");
  const data = { 
    desc, 
    tipo, 
    categoria: cat,
    statusPagamento: statusPayment,
    valor: Number(valor), 
    data: dataLanc 
  };

  if (id) {
    await updateDoc(doc(db, "financas", id), data);
  } else {
    await addDoc(collection(db, "financas"), data);
  }
  closeModal('modal-fin');
};

window.editarFin = function(id) {
  const f = financas.find(x => x.id === id);
  if (!f) return;
  document.getElementById('fin-id').value = f.id;
  document.getElementById('fin-desc').value = f.desc || '';
  document.getElementById('fin-tipo').value = f.tipo || 'Receita';
  document.getElementById('fin-valor').value = f.valor || '';
  document.getElementById('fin-cat').value = f.categoria || 'Serviço';
  document.getElementById('fin-status').value = f.statusPagamento || 'Pago';
  document.getElementById('fin-data').value = f.data || '';
  document.getElementById('title-modal-fin').textContent = "Editar Lançamento";
  document.getElementById('modal-fin').classList.add('active');
};

window.removerFin = async function(id) {
  if (confirm('Remover lançamento?')) await deleteDoc(doc(db, "financas", id));
};

// ==========================================
// ORÇAMENTOS - WHATSAPP E PDF (COM LOGO)
// ==========================================
window.obterDadosOrcamento = function() {
  const clienteId = document.getElementById('orc-cliente').value;
  if (!clienteId) { alert("Selecione um cliente no Orçamento."); return null; }
  const cliente = clientes.find(c => c.id === clienteId);

  const checkboxes = document.querySelectorAll('#orc-equipamentos input[type="checkbox"]:checked');
  const equipsSelecionados = Array.from(checkboxes).map(cb => cb.value);
  if (equipsSelecionados.length === 0) { alert("Selecione ao menos um equipamento ou ferramenta."); return null; }

  return {
    cliente,
    equipsSelecionados,
    valor: document.getElementById('orc-valor').value,
    cobranca: document.getElementById('orc-cobranca').value,
    comb: document.getElementById('orc-combustivel').checked ? "Sim" : "Não",
    op: document.getElementById('orc-operador').checked ? "Sim" : "Não",
    obs: document.getElementById('orc-obs').value
  };
};

window.enviarWhatsApp = function() {
  const dados = obterDadosOrcamento();
  if (!dados) return;
  let texto = `*ORÇAMENTO - BIANCHIN ESCAVAÇÕES*\n\n`;
  texto += `*Cliente:* ${dados.cliente.nome}\n`;
  texto += `*Itens Solicitados:*\n- ${dados.equipsSelecionados.join('\n- ')}\n\n`;
  texto += `*Valor Estimado:* ${formatMoney(dados.valor || 0)} (${dados.cobranca})\n`;
  texto += `*Combustível Incluso:* ${dados.comb}\n`;
  texto += `*Operador Incluso:* ${dados.op}\n`;
  if (dados.obs) texto += `\n*Observações:* ${dados.obs}\n`;
  texto += `\nFicamos à disposição!`;
  const whatsLimpo = (dados.cliente.whats || '').replace(/\D/g, '');
  window.open(`https://wa.me/55${whatsLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
};

window.gerarPDF = function() {
  const dados = obterDadosOrcamento();
  if (!dados) return;
  
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const divPDF = document.createElement('div');
  divPDF.style.cssText = 'padding:40px;font-family:Arial,Helvetica,sans-serif;color:#334155;background:#ffffff;';

  // ATUALIZADO: Adicionado cabeçalho com espaço pra colocar a sua logo direto no documento gerado.
  divPDF.innerHTML = `
    <div style="border-bottom:3px solid #F59E0B;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex; align-items:center; gap: 15px;">
        <img src="sua-logo.PNG" alt="Logo" style="max-height: 80px;" />
        <div>
          <h1 style="color:#0f172a;margin:0;font-size:24px;text-transform:uppercase;">Bianchin Escavações</h1>
          <p style="margin:5px 0 0;color:#64748b;font-size:14px;">Proposta Comercial de Locação</p>
        </div>
      </div>
      <div style="text-align:right;color:#64748b;font-size:14px;">
        <p style="margin:0;">Data: <strong style="color:#334155;">${dataAtual}</strong></p>
      </div>
    </div>
    
    <div style="margin-bottom:30px;background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
      <h3 style="margin-top:0;color:#0f172a;border-bottom:1px solid #cbd5e1;padding-bottom:10px;font-size:18px;">Dados do Cliente</h3>
      <table style="width:100%;font-size:14px;">
        <tr>
          <td style="padding:5px 0;"><strong>Nome / Razão Social:</strong> ${dados.cliente.nome}</td>
          <td style="padding:5px 0;"><strong>WhatsApp:</strong> ${dados.cliente.whats || '-'}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;" colspan="2"><strong>Endereço:</strong> ${dados.cliente.endereco || 'Não informado'}</td>
        </tr>
      </table>
    </div>
    <div style="margin-bottom:30px;">
      <h3 style="color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:10px;font-size:18px;">Itens do Orçamento</h3>
      <ul style="list-style-type:none;padding:0;margin:0;">
        ${dados.equipsSelecionados.map(eq => `
          <li style="padding:12px 10px;border-bottom:1px dashed #cbd5e1;display:flex;align-items:center;">
            <span style="color:#10b981;margin-right:10px;font-size:16px;">✔</span> ${eq}
          </li>`).join('')}
      </ul>
    </div>
    <div style="display:flex;gap:20px;margin-bottom:30px;">
      <div style="flex:1;background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
        <h4 style="margin:0 0 15px 0;color:#0f172a;font-size:16px;">Detalhes da Cobrança</h4>
        <p style="margin:8px 0;font-size:14px;"><strong>Valor Estimado:</strong> <span style="font-size:16px;color:#F59E0B;font-weight:bold;">${formatMoney(dados.valor || 0)}</span></p>
        <p style="margin:8px 0;font-size:14px;"><strong>Tipo de Cobrança:</strong> ${dados.cobranca}</p>
      </div>
      <div style="flex:1;background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
        <h4 style="margin:0 0 15px 0;color:#0f172a;font-size:16px;">Adicionais</h4>
        <p style="margin:8px 0;font-size:14px;"><strong>Combustível:</strong> ${dados.comb === 'Sim' ? '<span style="color:#10b981;">Incluso</span>' : '<span style="color:#ef4444;">Não Incluso</span>'}</p>
        <p style="margin:8px 0;font-size:14px;"><strong>Operador:</strong> ${dados.op === 'Sim' ? '<span style="color:#10b981;">Incluso</span>' : '<span style="color:#ef4444;">Não Incluso</span>'}</p>
      </div>
    </div>
    ${dados.obs ? `
    <div style="margin-bottom:30px;">
      <h3 style="color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:10px;font-size:18px;">Observações</h3>
      <p style="background:#f1f5f9;padding:15px;border-radius:8px;font-style:italic;font-size:14px;border-left:4px solid #94a3b8;margin:0;">${dados.obs}</p>
    </div>` : ''}
    <div style="margin-top:50px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:5px 0;">Este orçamento é válido por 7 dias. A locação está sujeita à disponibilidade do equipamento.</p>
      <p style="margin:5px 0;font-size:14px;"><strong style="color:#0f172a;">Bianchin Escavações</strong> - Agradecemos a preferência!</p>
    </div>
  `;
  html2pdf().set({
    margin: 0.5,
    filename: `Orcamento_${dados.cliente.nome.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).from(divPDF).save();
};

// ==========================================
// SINCRONIZAÇÃO TEMPO REAL COM FIRESTORE
// ==========================================
let seeded = false;
function syncData() {
  onSnapshot(collection(db, "clientes"), (snapshot) => {
    clientes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "equipamentos"), async (snapshot) => {
    equipamentos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (equipamentos.length === 0 && !seeded) {
      seeded = true;
      const defaults = [
        { nome: 'Escavadeira Suny', horimetro: '0', status: 'Operacional' },
        { nome: 'Escavadeira Yanmar', horimetro: '0', status: 'Operacional' },
        { nome: 'Carregadeira XCMG', horimetro: '0', status: 'Operacional' },
        { nome: 'MUNK 45 toneladas ARGOS', horimetro: '0', status: 'Operacional' },
        { nome: 'Equipamento Parceiros', horimetro: '0', status: 'Operacional' },
        { nome: 'Perfuratriz (cobrado por metro)', horimetro: '0', status: 'Operacional' },
        { nome: 'Rompedor (cobrado por hora)', horimetro: '0', status: 'Operacional' },
        { nome: 'Conchas (15cm a 70cm)', horimetro: '0', status: 'Operacional' }
      ];
      for (const e of defaults) {
        await addDoc(collection(db, "equipamentos"), e);
      }
    } else {
      renderAll();
    }
  });

  onSnapshot(collection(db, "agenda"), (snapshot) => {
    agenda = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "os"), (snapshot) => {
    os = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });

  onSnapshot(collection(db, "financas"), (snapshot) => {
    financas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  });
}

// ==========================================
// INICIALIZAÇÃO, NAVEGAÇÃO E AUTENTICAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('header-title').textContent = item.textContent.trim();
      const targetView = item.getAttribute('data-view');
      viewSections.forEach(s => {
        s.classList.remove('active');
        if (s.id === targetView) s.classList.add('active');
      });
      if (window.innerWidth <= 768 && sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
      }
    });
  });

  let isRegistering = false;
  const authRegisterToggle = document.getElementById('auth-register-toggle');
  const authForgotPass = document.getElementById('auth-forgot-pass');
  const authTitle = document.getElementById('auth-title');
  const authBtn = document.getElementById('auth-btn');
  const authForm = document.getElementById('auth-form');
  const authError = document.getElementById('auth-error');

  if (authRegisterToggle) {
    authRegisterToggle.addEventListener('click', (e) => {
      e.preventDefault();
      isRegistering = !isRegistering;
      authTitle.textContent = isRegistering ? "Criar Conta" : "Acesso ao Sistema";
      authBtn.textContent = isRegistering ? "Cadastrar" : "Entrar no Sistema";
      authRegisterToggle.textContent = isRegistering ? "Voltar para Login" : "Criar conta";
      authError.style.display = 'none';
    });
  }

  if (authForgotPass) {
    authForgotPass.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      if (!email) {
        authError.style.color = "var(--warning-color)";
        authError.textContent = "Digite seu e-mail no campo acima e clique em 'Esqueci a senha' novamente.";
        authError.style.display = 'block';
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        authError.style.color = "var(--accent-color)";
        authError.textContent = "E-mail de redefinição enviado! Verifique sua caixa de entrada.";
        authError.style.display = 'block';
      } catch (err) {
        authError.style.color = "var(--danger-color)";
        authError.textContent = "Erro. Verifique se o e-mail está correto e cadastrado.";
        authError.style.display = 'block';
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-pass').value;
      authError.style.display = 'none';
      authBtn.textContent = isRegistering ? 'Cadastrando...' : 'Entrando...';
      authBtn.disabled = true;
      try {
        if (isRegistering) {
          await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          await signInWithEmailAndPassword(auth, email, pass);
        }
      } catch (err) {
        const msgs = {
          'auth/invalid-credential': 'E-mail ou senha incorretos.',
          'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
          'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
          'auth/invalid-email': 'E-mail inválido.',
          'auth/user-not-found': 'Usuário não encontrado.',
          'auth/wrong-password': 'Senha incorreta.',
          'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
        };
        authError.style.color = "var(--danger-color)";
        authError.textContent = msgs[err.code] || err.message;
        authError.style.display = 'block';
      } finally {
        authBtn.textContent = isRegistering ? 'Cadastrar' : 'Entrar no Sistema';
        authBtn.disabled = false;
      }
    });
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => signOut(auth));
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById('auth-wrapper').style.display = 'none';
      document.getElementById('app-container').style.display = 'flex';
      syncData(); 
    } else {
      document.getElementById('auth-wrapper').style.display = 'flex';
      document.getElementById('app-container').style.display = 'none';
    }
  });
});
