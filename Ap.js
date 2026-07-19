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
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update title
      document.getElementById('header-title').textContent = item.textContent.trim();
      
      // Show correct section
      const targetView = item.getAttribute('data-view');
      viewSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetView) {
          section.classList.add('active');
        }
      });
      
      // Close sidebar on mobile
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

  // --- Mock Data Rendering ---
  
  // 1. Clientes
  const clientes = [
    { nome: 'João da Silva', contato: '(11) 99999-9999', cidade: 'São Paulo' },
    { nome: 'Construtora Alpha', contato: '(11) 98888-8888', cidade: 'Rio Claro' }
  ];
  
  const tbodyClientes = document.getElementById('tbody-clientes');
  if(tbodyClientes) {
    clientes.forEach(c => {
      tbodyClientes.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.contato}</td>
          <td>${c.cidade}</td>
          <td>
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;">Editar</button>
          </td>
        </tr>
      `;
    });
  }

  // 2. Equipamentos
  const equipamentos = [
    { nome: 'Mini Escavadeira CAT', horimetro: '1.200h', status: 'Operacional' },
    { nome: 'Caminhão Munck', horimetro: '4.500h', status: 'Manutenção' }
  ];
  const tbodyEquips = document.getElementById('tbody-equipamentos');
  if(tbodyEquips) {
    equipamentos.forEach(e => {
      const badgeClass = e.status === 'Operacional' ? 'badge-success' : 'badge-danger';
      tbodyEquips.innerHTML += `
        <tr>
          <td>${e.nome}</td>
          <td>${e.horimetro}</td>
          <td><span class="badge ${badgeClass}">${e.status}</span></td>
          <td>
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;">Ficha</button>
          </td>
        </tr>
      `;
    });
  }
  
  // 3. Financeiro Gráfico (Mock)
  // Requer importação do Chart.js no HTML
  const ctx = document.getElementById('chartFaturamento');
  if(ctx && window.Chart) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Faturamento (R$)',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }
});
