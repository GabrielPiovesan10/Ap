// ==========================================
// FIREBASE - BANCO DE DADOS NA NUVEM
// Usando CDN para HTML puro (sem npm/bundler)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
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
    document.getElementById('eq-nome').value = '';
    document.getElementById('eq-hori').value = '';
    document.getElementById('title-modal-equip').textContent = "Novo Equipamento";
  } else if (modalId === 'modal-agenda') {
    document.getElementById('ag-id').value = '';
    document.getElementById('ag-data').value = '';
    document.getElementById('title-modal-agenda').textContent = "Novo Agendamento";
  } else if (modalId === 'modal-os') {
    document.getElementById('os-id').value = '';
    document.getElementById('os-numero').value = '';
    document.getElementById('os-hini').value = '';
    document.getElementById('os-hfim').value = '';
    document.getElementById('title-modal-os').textContent = "Nova Ordem de Serviço";
  } else if (modalId === 'modal-fin') {
    document.getElementById('fin-id').value = '';
    document.getElementById('fin-desc').value = '';
    document.getElementById('fin-valor').value = '';
    document.getElementById('fin-data').value = '';
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

function renderEquipamentos() {
  const tbody = document.getElementById('tbody-equipamentos');
  if (tbody) {
    tbody.innerHTML = '';
    equipamentos.forEach((e) => {
      const badge = e.status === 'Operacional' ? 'badge-success' : (e.status === 'Alugado' ? 'badge-warning' : 'badge-danger');
      tbody.innerHTML += `
        <tr>
          <td>${e.nome}</td>
          <td>${e.horimetro}</td>
          <td><span class="badge ${badge}">${e.status}</span></td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarEquip('${e.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerEquip('${e.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    });
  }
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

let chartInstance = null;

function renderFinanceiro() {
  const tbody = document.getElementById('tbody-fin');
  let totalReceitas = 0;
  let totalDespesas = 0;

  if (tbody) {
    tbody.innerHTML = '';
    const sorted = [...financas].sort((a, b) => new Date(a.data) - new Date(b.data));
    sorted.forEach((f) => {
      const val = Number(f.valor);
      if (f.tipo === 'Receita') totalReceitas += val; else totalDespesas += val;
      tbody.innerHTML += `
        <tr>
          <td>${formatDate(f.data)}</td>
          <td>${f.desc}</td>
          <td style="color:${f.tipo === 'Receita' ? 'var(--accent-color)' : 'var(--danger-color)'}">${f.tipo}</td>
          <td>${formatMoney(f.valor)}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding:4px 8px;font-size:0.8rem;" onclick="editarFin('${f.id}')">Editar</button>
              <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;background:var(--danger-color);color:white;border:none;" onclick="removerFin('${f.id}')">Remover</button>
            </div>
          </td>
        </tr>`;
    });
  }

  const relReceitas = document.getElementById('rel-receitas');
  if (relReceitas) {
    relReceitas.textContent = formatMoney(totalReceitas);
    document.getElementById('rel-despesas').textContent = formatMoney(totalDespesas);
    document.getElementById('rel-saldo').textContent = formatMoney(totalReceitas - totalDespesas);
  }
}

function renderDashboard() {
  const hj = new Date();
  const currentMonth = hj.getMonth();
  const currentYear = hj.getFullYear();
  let fatMes = 0;
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyData = new Array(12).fill(0);

  financas.forEach(f => {
    if (f.tipo === 'Receita' && f.data) {
      const [y, m] = f.data.split('-');
      const fMonth = parseInt(m) - 1;
      const fYear = parseInt(y);
      if (fYear === currentYear) {
        monthlyData[fMonth] += Number(f.valor);
        if (fMonth === currentMonth) fatMes += Number(f.valor);
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
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: `Receitas em ${currentYear}`,
          data: monthlyData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } }
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
// CRUD - EQUIPAMENTOS
// ==========================================
window.salvarEquip = async function() {
  const id = document.getElementById('eq-id').value;
  const nome = document.getElementById('eq-nome').value;
  const horimetro = document.getElementById('eq-hori').value;
  const status = document.getElementById('eq-status').value;

  if (!nome) return alert("Nome do equipamento é obrigatório!");
  const data = { nome, horimetro: horimetro || '0', status };

  if (id) {
    await updateDoc(doc(db, "equipamentos", id), data);
  } else {
    await addDoc(collection(db, "equipamentos"), data);
  }
  closeModal('modal-equip');
};

window.editarEquip = function(id) {
  const e = equipamentos.find(x => x.id === id);
  if (!e) return;
  document.getElementById('eq-id').value = e.id;
  document.getElementById('eq-nome').value = e.nome || '';
  document.getElementById('eq-hori').value = e.horimetro || '';
  document.getElementById('eq-status').value = e.status || 'Operacional';
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
  const status = document.getElementById('ag-status').value;

  if (!clienteId || !equipId || !dataPrev) return alert("Preencha os campos obrigatórios!");
  const data = { clienteId, equipId, data: dataPrev, status };

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
  document.getElementById('ag-status').value = a.status || 'Pendente';
  document.getElementById('title-modal-agenda').textContent = "Editar Agendamento";
  document.getElementById('modal-agenda').classList.add('active');
};

window.removerAgenda = async function(id) {
  if (confirm('Remover agendamento?')) await deleteDoc(doc(db, "agenda", id));
};

// ==========================================
// CRUD - ORDENS DE SERVIÇO
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
  const data = { numero, clienteId, equipId, hini, hfim, status };

  if (id) {
    await updateDoc(doc(db, "os", id), data);
  } else {
    await addDoc(collection(db, "os"), data);
  }
  closeModal('modal-os');
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
  document.getElementById('title-modal-os').textContent = "Editar OS";
  document.getElementById('modal-os').classList.add('active');
};

window.removerOS = async function(id) {
  if (confirm('Remover OS?')) await deleteDoc(doc(db, "os", id));
};

// ==========================================
// CRUD - FINANCEIRO
// ==========================================
window.salvarFin = async function() {
  const id = document.getElementById('fin-id').value;
  const desc = document.getElementById('fin-desc').value;
  const tipo = document.getElementById('fin-tipo').value;
  const valor = document.getElementById('fin-valor').value;
  const dataLanc = document.getElementById('fin-data').value;

  if (!desc || !valor || !dataLanc) return alert("Preencha todos os campos!");
  const data = { desc, tipo, valor: Number(valor), data: dataLanc };

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
  document.getElementById('fin-data').value = f.data || '';
  document.getElementById('title-modal-fin').textContent = "Editar Lançamento";
  document.getElementById('modal-fin').classList.add('active');
};

window.removerFin = async function(id) {
  if (confirm('Remover lançamento?')) await deleteDoc(doc(db, "financas", id));
};

// ==========================================
// ORÇAMENTOS - WHATSAPP E PDF
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

  divPDF.innerHTML = `
    <div style="border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <h1 style="color:#2563eb;margin:0;font-size:28px;text-transform:uppercase;">Bianchin Escavações</h1>
        <p style="margin:5px 0 0;color:#64748b;font-size:14px;">Orçamento de Locação</p>
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
        <p style="margin:8px 0;font-size:14px;"><strong>Valor Estimado:</strong> <span style="font-size:16px;color:#2563eb;font-weight:bold;">${formatMoney(dados.valor || 0)}</span></p>
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

    // Popula os equipamentos padrão somente uma vez, se vazio
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
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // --- Navegação ---
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  menuToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

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
      if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
    });
  });

  // --- Autenticação ---
  let isRegistering = false;
  const authToggle = document.getElementById('auth-toggle');
  const authTitle = document.getElementById('auth-title');
  const authBtn = document.getElementById('auth-btn');
  const authForm = document.getElementById('auth-form');
  const authError = document.getElementById('auth-error');

  authToggle.addEventListener('click', () => {
    isRegistering = !isRegistering;
    authTitle.textContent = isRegistering ? "Criar Conta" : "Acesso ao Sistema";
    authBtn.textContent = isRegistering ? "Cadastrar" : "Entrar";
    authToggle.textContent = isRegistering ? "Já tenho uma conta. Fazer login" : "Criar uma nova conta";
    authError.style.display = 'none';
  });

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
      authError.textContent = msgs[err.code] || err.message;
      authError.style.display = 'block';
    } finally {
      authBtn.textContent = isRegistering ? 'Cadastrar' : 'Entrar';
      authBtn.disabled = false;
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

  // --- Observar estado de login ---
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
