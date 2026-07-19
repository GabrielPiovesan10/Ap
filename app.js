document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  // Toggle Sidebar for mobile
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Switch Views
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      document.getElementById('header-title').textContent = item.textContent.trim();
      
      const targetView = item.getAttribute('data-view');
      viewSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetView) {
          section.classList.add('active');
        }
      });
      
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  // Modals
  window.openModal = function(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  // Formatting utils
  const formatMoney = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateString) => {
    if(!dateString) return '-';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  // --- DATA MANAGEMENT ---
  
  // 1. Load Data
  let clientes = JSON.parse(localStorage.getItem('bianchin_clientes')) || [];
  let equipamentos = JSON.parse(localStorage.getItem('bianchin_equipamentos'));
  
  if (!equipamentos || equipamentos.length === 0) {
    equipamentos = [
      { nome: 'Escavadeira Suny', horimetro: '0', status: 'Operacional' },
      { nome: 'Escavadeira Yanmar', horimetro: '0', status: 'Operacional' },
      { nome: 'Carregadeira XCMG', horimetro: '0', status: 'Operacional' },
      { nome: 'MUNK 45 toneladas ARGOS', horimetro: '0', status: 'Operacional' },
      { nome: 'Equipamento Parceiros', horimetro: '0', status: 'Operacional' },
      { nome: 'Perfuratriz (cobrado por metro)', horimetro: '0', status: 'Operacional' },
      { nome: 'Rompedor (cobrado por hora)', horimetro: '0', status: 'Operacional' },
      { nome: 'Conchas (15cm a 70cm)', horimetro: '0', status: 'Operacional' }
    ];
    localStorage.setItem('bianchin_equipamentos', JSON.stringify(equipamentos));
  }

  let agenda = JSON.parse(localStorage.getItem('bianchin_agenda')) || [];
  let os = JSON.parse(localStorage.getItem('bianchin_os')) || [];
  let financas = JSON.parse(localStorage.getItem('bianchin_financas')) || [];

  // --- RENDER FUNCTIONS ---

  function renderAll() {
    renderClientes();
    renderEquipamentos();
    renderAgenda();
    renderOS();
    renderFinanceiro();
    renderDashboard();
  }

  // CLIENTES
  function renderClientes() {
    const tbody = document.getElementById('tbody-clientes');
    if(tbody) {
      tbody.innerHTML = '';
      clientes.forEach((c, index) => {
        tbody.innerHTML += `
          <tr>
            <td>${c.nome}</td>
            <td>${c.whats}</td>
            <td>${c.endereco}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerCliente(${index})">Remover</button>
            </td>
          </tr>
        `;
      });
    }
    
    // Update Dropdowns
    const updateSelect = (id) => {
      const el = document.getElementById(id);
      if(el) {
        el.innerHTML = '<option value="">Selecione</option>';
        clientes.forEach((c, index) => {
          el.innerHTML += `<option value="${index}">${c.nome}</option>`;
        });
      }
    };
    updateSelect('orc-cliente');
    updateSelect('ag-cliente');
    updateSelect('os-cliente');
  }

  window.salvarCliente = function() {
    const nome = document.getElementById('cli-nome').value;
    const cpf = document.getElementById('cli-cpf').value;
    const whats = document.getElementById('cli-whats').value;
    const email = document.getElementById('cli-email').value;
    const endereco = document.getElementById('cli-endereco').value;
    const obs = document.getElementById('cli-obs').value;

    if(!nome || !whats) return alert("Nome e WhatsApp são obrigatórios!");

    clientes.push({ nome, cpf, whats, email, endereco, obs });
    localStorage.setItem('bianchin_clientes', JSON.stringify(clientes));
    renderAll();
    closeModal('modal-cliente');
    
    ['cli-nome', 'cli-cpf', 'cli-whats', 'cli-email', 'cli-endereco', 'cli-obs'].forEach(id => document.getElementById(id).value = '');
  }
  window.removerCliente = function(index) {
    if(confirm('Remover cliente?')) { clientes.splice(index, 1); localStorage.setItem('bianchin_clientes', JSON.stringify(clientes)); renderAll(); }
  }

  // EQUIPAMENTOS
  function renderEquipamentos() {
    const tbody = document.getElementById('tbody-equipamentos');
    if(tbody) {
      tbody.innerHTML = '';
      equipamentos.forEach((e, index) => {
        const badgeClass = e.status === 'Operacional' ? 'badge-success' : (e.status === 'Alugado' ? 'badge-warning' : 'badge-danger');
        tbody.innerHTML += `
          <tr>
            <td>${e.nome}</td>
            <td>${e.horimetro}h</td>
            <td><span class="badge ${badgeClass}">${e.status}</span></td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerEquip(${index})">Remover</button>
            </td>
          </tr>
        `;
      });
    }

    // Update Dropdowns
    const updateSelect = (id) => {
      const el = document.getElementById(id);
      if(el) {
        el.innerHTML = '<option value="">Selecione</option>';
        equipamentos.forEach((e, index) => {
          el.innerHTML += `<option value="${index}">${e.nome}</option>`;
        });
      }
    };
    updateSelect('ag-equip');
    updateSelect('os-equip');
  }

  window.salvarEquip = function() {
    const nome = document.getElementById('eq-nome').value;
    const horimetro = document.getElementById('eq-hori').value;
    const status = document.getElementById('eq-status').value;

    if(!nome) return alert("Nome do equipamento é obrigatório!");

    equipamentos.push({ nome, horimetro: horimetro || '0', status });
    localStorage.setItem('bianchin_equipamentos', JSON.stringify(equipamentos));
    renderAll();
    closeModal('modal-equip');
    
    document.getElementById('eq-nome').value = '';
    document.getElementById('eq-hori').value = '';
  }
  window.removerEquip = function(index) {
    if(confirm('Remover equipamento?')) { equipamentos.splice(index, 1); localStorage.setItem('bianchin_equipamentos', JSON.stringify(equipamentos)); renderAll(); }
  }

  // AGENDA
  function renderAgenda() {
    const tbody = document.getElementById('tbody-agenda');
    if(tbody) {
      tbody.innerHTML = '';
      agenda.forEach((a, index) => {
        const cliName = clientes[a.clienteIdx] ? clientes[a.clienteIdx].nome : 'Desconhecido';
        const eqName = equipamentos[a.equipIdx] ? equipamentos[a.equipIdx].nome : 'Desconhecido';
        tbody.innerHTML += `
          <tr>
            <td>${cliName}</td>
            <td>${eqName}</td>
            <td>${formatDate(a.data)}</td>
            <td>${a.status}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerAgenda(${index})">Remover</button>
            </td>
          </tr>
        `;
      });
    }
  }

  window.salvarAgenda = function() {
    const clienteIdx = document.getElementById('ag-cliente').value;
    const equipIdx = document.getElementById('ag-equip').value;
    const data = document.getElementById('ag-data').value;
    const status = document.getElementById('ag-status').value;

    if(clienteIdx === '' || equipIdx === '' || !data) return alert("Preencha os campos obrigatórios!");

    agenda.push({ clienteIdx, equipIdx, data, status });
    localStorage.setItem('bianchin_agenda', JSON.stringify(agenda));
    renderAll();
    closeModal('modal-agenda');
  }
  window.removerAgenda = function(index) {
    if(confirm('Remover agendamento?')) { agenda.splice(index, 1); localStorage.setItem('bianchin_agenda', JSON.stringify(agenda)); renderAll(); }
  }

  // OS
  function renderOS() {
    const tbody = document.getElementById('tbody-os');
    if(tbody) {
      tbody.innerHTML = '';
      os.forEach((o, index) => {
        const cliName = clientes[o.clienteIdx] ? clientes[o.clienteIdx].nome : 'Desconhecido';
        const eqName = equipamentos[o.equipIdx] ? equipamentos[o.equipIdx].nome : 'Desconhecido';
        tbody.innerHTML += `
          <tr>
            <td>${o.numero}</td>
            <td>${cliName}</td>
            <td>${eqName}</td>
            <td>${o.hini} / ${o.hfim}</td>
            <td>${o.status}</td>
            <td>
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerOS(${index})">Remover</button>
            </td>
          </tr>
        `;
      });
    }
  }

  window.salvarOS = function() {
    const numero = document.getElementById('os-numero').value;
    const clienteIdx = document.getElementById('os-cliente').value;
    const equipIdx = document.getElementById('os-equip').value;
    const hini = document.getElementById('os-hini').value;
    const hfim = document.getElementById('os-hfim').value;
    const status = document.getElementById('os-status').value;

    if(!numero || clienteIdx === '' || equipIdx === '') return alert("Preencha Nº OS, Cliente e Equipamento!");

    os.push({ numero, clienteIdx, equipIdx, hini, hfim, status });
    localStorage.setItem('bianchin_os', JSON.stringify(os));
    renderAll();
    closeModal('modal-os');
    document.getElementById('os-numero').value = '';
    document.getElementById('os-hini').value = '';
    document.getElementById('os-hfim').value = '';
  }
  window.removerOS = function(index) {
    if(confirm('Remover OS?')) { os.splice(index, 1); localStorage.setItem('bianchin_os', JSON.stringify(os)); renderAll(); }
  }

  // FINANCEIRO & DASHBOARD
  let chartInstance = null;

  function renderFinanceiro() {
    const tbody = document.getElementById('tbody-fin');
    let totalReceitas = 0;
    let totalDespesas = 0;

    if(tbody) {
      tbody.innerHTML = '';
      financas.sort((a,b) => new Date(a.data) - new Date(b.data)).forEach((f, index) => {
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
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; background: var(--danger-color); color: white; border: none;" onclick="removerFin(${index})">Remover</button>
            </td>
          </tr>
        `;
      });
    }

    // Update Relatorios
    if(document.getElementById('rel-receitas')) {
      document.getElementById('rel-receitas').textContent = formatMoney(totalReceitas);
      document.getElementById('rel-despesas').textContent = formatMoney(totalDespesas);
      document.getElementById('rel-saldo').textContent = formatMoney(totalReceitas - totalDespesas);
    }
  }

  window.salvarFin = function() {
    const desc = document.getElementById('fin-desc').value;
    const tipo = document.getElementById('fin-tipo').value;
    const valor = document.getElementById('fin-valor').value;
    const data = document.getElementById('fin-data').value;

    if(!desc || !valor || !data) return alert("Preencha todos os campos!");

    financas.push({ desc, tipo, valor: Number(valor), data });
    localStorage.setItem('bianchin_financas', JSON.stringify(financas));
    renderAll();
    closeModal('modal-fin');
    
    document.getElementById('fin-desc').value = '';
    document.getElementById('fin-valor').value = '';
  }
  window.removerFin = function(index) {
    if(confirm('Remover lançamento?')) { financas.splice(index, 1); localStorage.setItem('bianchin_financas', JSON.stringify(financas)); renderAll(); }
  }

  function renderDashboard() {
    // Calc Faturamento mensal (mês atual)
    const hj = new Date();
    const currentMonth = hj.getMonth();
    const currentYear = hj.getFullYear();
    
    let fatMes = 0;
    
    // Arrays for chart
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = new Array(12).fill(0);

    financas.forEach(f => {
      if(f.tipo === 'Receita') {
        const d = new Date(f.data);
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

    // Render Chart
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
            label: \`Receitas em \${currentYear}\`,
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

  // --- ORÇAMENTOS (WHATSAPP & PDF) ---
  window.obterDadosOrcamento = function() {
    const clienteIndex = document.getElementById('orc-cliente').value;
    if (clienteIndex === "") {
      alert("Por favor, selecione um cliente no Orçamento.");
      return null;
    }
    const cliente = clientes[clienteIndex];
    
    const checkboxes = document.querySelectorAll('#orc-equipamentos input[type="checkbox"]:checked');
    const equipsSelecionados = Array.from(checkboxes).map(cb => cb.value);
    
    if (equipsSelecionados.length === 0) {
      alert("Selecione ao menos um equipamento ou ferramenta.");
      return null;
    }

    const valor = document.getElementById('orc-valor').value;
    const cobranca = document.getElementById('orc-cobranca').value;
    const comb = document.getElementById('orc-combustivel').checked ? "Sim" : "Não";
    const op = document.getElementById('orc-operador').checked ? "Sim" : "Não";
    const obs = document.getElementById('orc-obs').value;

    return { cliente, equipsSelecionados, valor, cobranca, comb, op, obs };
  };

  window.enviarWhatsApp = function() {
    const dados = obterDadosOrcamento();
    if (!dados) return;

    let texto = \`*ORÇAMENTO - BIANCHIN ESCAVAÇÕES*\\n\\n\`;
    texto += \`*Cliente:* \${dados.cliente.nome}\\n\`;
    texto += \`*Itens Solicitados:* \\n- \${dados.equipsSelecionados.join('\\n- ')}\\n\\n\`;
    texto += \`*Valor Estimado:* \${formatMoney(dados.valor || 0)} (\${dados.cobranca})\\n\`;
    texto += \`*Combustível Incluso:* \${dados.comb}\\n\`;
    texto += \`*Operador Incluso:* \${dados.op}\\n\`;
    if (dados.obs) {
      texto += \`\\n*Observações:* \${dados.obs}\\n\`;
    }
    texto += \`\\nFicamos à disposição!\`;

    const whatsLimpo = dados.cliente.whats.replace(/\\D/g, '');
    const url = \`https://wa.me/55\${whatsLimpo}?text=\${encodeURIComponent(texto)}\`;
    window.open(url, '_blank');
  }

  window.gerarPDF = function() {
    const dados = obterDadosOrcamento();
    if (!dados) return;

    const divPDF = document.createElement('div');
    divPDF.style.padding = '40px';
    divPDF.style.fontFamily = 'Arial, Helvetica, sans-serif';
    divPDF.style.color = '#334155';
    divPDF.style.background = '#ffffff';

    let dataAtual = new Date().toLocaleDateString('pt-BR');

    divPDF.innerHTML = \`
      <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #2563eb; margin: 0; font-size: 28px; text-transform: uppercase;">Bianchin Escavações</h1>
          <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Orçamento de Locação</p>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">Data: <strong style="color:#334155;">\${dataAtual}</strong></p>
        </div>
      </div>

      <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; font-size: 18px;">Dados do Cliente</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Nome / Razão Social:</strong> \${dados.cliente.nome}</td>
            <td style="padding: 5px 0;"><strong>WhatsApp:</strong> \${dados.cliente.whats}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;" colspan="2"><strong>Localização / Endereço:</strong> \${dados.cliente.endereco || 'Não informado'}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 18px;">Itens do Orçamento</h3>
        <ul style="list-style-type: none; padding: 0; margin: 0;">
          \${dados.equipsSelecionados.map(eq => \`
            <li style="padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; display: flex; align-items: center;">
              <span style="color: #10b981; margin-right: 10px; font-size: 16px;">✔</span> \${eq}
            </li>
          \`).join('')}
        </ul>
      </div>

      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px;">Detalhes da Cobrança</h4>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Valor Estimado:</strong> <span style="font-size: 16px; color: #2563eb; font-weight: bold;">\${formatMoney(dados.valor || 0)}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Tipo de Cobrança:</strong> \${dados.cobranca}</p>
        </div>
        <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px;">Adicionais</h4>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Combustível Incluso:</strong> \${dados.comb === 'Sim' ? '<span style="color: #10b981;">Sim</span>' : '<span style="color: #ef4444;">Não</span>'}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Operador Incluso:</strong> \${dados.op === 'Sim' ? '<span style="color: #10b981;">Sim</span>' : '<span style="color: #ef4444;">Não</span>'}</p>
        </div>
      </div>

      \${dados.obs ? \`
      <div style="margin-bottom: 30px;">
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 18px;">Observações</h3>
        <p style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-style: italic; font-size: 14px; border-left: 4px solid #94a3b8; margin:0;">\${dados.obs}</p>
      </div>\` : ''}

      <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p style="margin: 5px 0;">Este orçamento é válido por 7 dias. A locação está sujeita à disponibilidade do equipamento.</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #0f172a;">Bianchin Escavações</strong> - Agradecemos a preferência!</p>
      </div>
    \`;

    var opt = {
      margin:       0.5,
      filename:     \`Orcamento_\${dados.cliente.nome.replace(/\\s+/g, '_')}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(divPDF).save();
  }

  // Final Init
  renderAll();
});
