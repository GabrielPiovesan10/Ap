import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDY_WTOjZG_xOnmzebcnL83MBGJZPhShIE",
  authDomain: "bianchin-671f6.firebaseapp.com",
  projectId: "bianchin-671f6",
  storageBucket: "bianchin-671f6.firebasestorage.app",
  messagingSenderId: "455624189366",
  appId: "1:455624189366:web:3a907f14a62a59ddfacd17",
  measurementId: "G-H45CMN2MNB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let clientes = [];
let equipamentos = [];
let agenda = [];
let os = [];
let financas = [];

// Formatting utils
const formatMoney = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => {
  if(!dateString) return '-';
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

// Modals Setup
window.openModal = function(modalId) {
  // Clear ID fields when opening manually (New items)
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
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// ==========================================
// RENDER FUNCTIONS
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
  if(tbody) {
    tbody.innerHTML = '';
    clientes.forEach((c) => {
      tbody.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.whats}</td>
          <td>${c.endereco}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editarCliente('${c.id}')">Editar</button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerCliente('${c.id}')">Remover</button>
            </div>
          </td>
        </tr>
      `;
    });
  }
  
  const updateSelect = (id) => {
    const el = document.getElementById(id);
    if(el) {
      const prevVal = el.value;
      el.innerHTML = '<option value="">Selecione</option>';
      clientes.forEach((c) => {
        el.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
      });
      el.value = prevVal;
    }
  };
  updateSelect('orc-cliente');
  updateSelect('ag-cliente');
  updateSelect('os-cliente');
}

function renderEquipamentos() {
  const tbody = document.getElementById('tbody-equipamentos');
  if(tbody) {
    tbody.innerHTML = '';
    equipamentos.forEach((e) => {
      const badgeClass = e.status === 'Operacional' ? 'badge-success' : (e.status === 'Alugado' ? 'badge-warning' : 'badge-danger');
      tbody.innerHTML += `
        <tr>
          <td>${e.nome}</td>
          <td>${e.horimetro}</td>
          <td><span class="badge ${badgeClass}">${e.status}</span></td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editarEquip('${e.id}')">Editar</button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerEquip('${e.id}')">Remover</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  const updateSelect = (id) => {
    const el = document.getElementById(id);
    if(el) {
      const prevVal = el.value;
      el.innerHTML = '<option value="">Selecione</option>';
      equipamentos.forEach((e) => {
        el.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
      });
      el.value = prevVal;
    }
  };
  updateSelect('ag-equip');
  updateSelect('os-equip');
}

function renderAgenda() {
  const tbody = document.getElementById('tbody-agenda');
  if(tbody) {
    tbody.innerHTML = '';
    agenda.forEach((a) => {
      const cliObj = clientes.find(c => c.id === a.clienteId);
      const eqObj = equipamentos.find(e => e.id === a.equipId);
      const cliName = cliObj ? cliObj.nome : 'Desconhecido';
      const eqName = eqObj ? eqObj.nome : 'Desconhecido';
      
      tbody.innerHTML += `
        <tr>
          <td>${cliName}</td>
          <td>${eqName}</td>
          <td>${formatDate(a.data)}</td>
          <td>${a.status}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editarAgenda('${a.id}')">Editar</button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerAgenda('${a.id}')">Remover</button>
            </div>
          </td>
        </tr>
      `;
    });
  }
}

function renderOS() {
  const tbody = document.getElementById('tbody-os');
  if(tbody) {
    tbody.innerHTML = '';
    os.forEach((o) => {
      const cliObj = clientes.find(c => c.id === o.clienteId);
      const eqObj = equipamentos.find(e => e.id === o.equipId);
      const cliName = cliObj ? cliObj.nome : 'Desconhecido';
      const eqName = eqObj ? eqObj.nome : 'Desconhecido';

      tbody.innerHTML += `
        <tr>
          <td>${o.numero}</td>
          <td>${cliName}</td>
          <td>${eqName}</td>
          <td>${o.hini} / ${o.hfim}</td>
          <td>${o.status}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editarOS('${o.id}')">Editar</button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerOS('${o.id}')">Remover</button>
            </div>
          </td>
        </tr>
      `;
    });
  }
}

let chartInstance = null;

function renderFinanceiro() {
  const tbody = document.getElementById('tbody-fin');
  let totalReceitas = 0;
  let totalDespesas = 0;

  if(tbody) {
    tbody.innerHTML = '';
    const sorted = [...financas].sort((a,b) => new Date(a.data) - new Date(b.data));
    sorted.forEach((f) => {
      const val = Number(f.valor);
      if(f.tipo === 'Receita') totalReceitas += val;
      else totalDespesas += val;
      
      tbody.innerHTML += `
        <tr>
          <td>${formatDate(f.data)}</td>
          <td>${f.desc}</td>
          <td style="color: ${f.tipo === 'Receita' ? 'var(--accent-color)' : 'var(--danger-color)'}">${f.tipo}</td>
          <td>${formatMoney(f.valor)}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editarFin('${f.id}')">Editar</button>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerFin('${f.id}')">Remover</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  if(document.getElementById('rel-receitas')) {
    document.getElementById('rel-receitas').textContent = formatMoney(totalReceitas);
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
    if(f.tipo === 'Receita') {
      const [y, m, day] = f.data.split('-');
      const fMonth = parseInt(m) - 1;
      const fYear = parseInt(y);

      if (fYear === currentYear) {
        monthlyData[fMonth] += Number(f.valor);
        if (fMonth === currentMonth) {
          fatMes += Number(f.valor);
        }
      }
    }
  });

  const dashFat = document.getElementById('dash-fat');
  if(dashFat) dashFat.textContent = formatMoney(fatMes);

  const osEmAndamento = os.filter(o => o.status === 'Em Andamento').length;
  const dashOs = document.getElementById('dash-os');
  if(dashOs) dashOs.textContent = osEmAndamento;

  const maqDisp = equipamentos.filter(e => e.status === 'Operacional').length;
  const dashMaq = document.getElementById('dash-maq');
  if(dashMaq) dashMaq.textContent = maqDisp;

  const ctx = document.getElementById('chartFaturamento');
  if(ctx && window.Chart) {
    if(chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label:
