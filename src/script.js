// Configurações da API
const API_URL = 'https://api.exemplo.com/financeiro'; // Substitua pela sua API real
const UPDATE_INTERVAL = 30000; // 30 segundos

// Elementos do DOM
const elements = {
    currentTime: document.getElementById('current-time'),
    currentDate: document.getElementById('current-date'),
    lastUpdate: document.getElementById('last-update'),
    refreshBtn: document.getElementById('refresh-btn'),
    movimentacoesList: document.getElementById('movimentacoes-list'),
    searchInput: document.getElementById('search-input'),
    filterSelect: document.getElementById('filter-select'),
    maiorAlta: document.getElementById('maior-alta'),
    maiorBaixa: document.getElementById('maior-baixa'),
    volumeTotal: document.getElementById('volume-total'),
    previsoesContent: document.getElementById('previsoes-content'),
    noticiasContent: document.getElementById('noticias-content'),
    apiStatus: document.getElementById('api-status'),
    grafico: document.getElementById('grafico-tempo-real')
};

// Variáveis globais
let financialData = [];
let chartInstance = null;

// Função para atualizar data e hora
function updateDateTime() {
    const now = new Date();
    
    // Formata hora
    const time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Formata data
    const date = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    elements.currentTime.textContent = time;
    elements.currentDate.textContent = date;
}

// Função para formatar números
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Função para buscar dados da API
async function fetchData() {
    try {
        elements.apiStatus.textContent = "Conectando...";
        elements.apiStatus.className = "";
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        financialData = data;
        
        // Atualiza UI
        updateLastUpdateTime();
        renderMovimentacoes();
        renderDestaques();
        renderPrevisoes();
        renderNoticias();
        renderGrafico();
        
        elements.apiStatus.textContent = "Conectado";
        elements.apiStatus.classList.add("connected");
        
        return data;
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        elements.apiStatus.textContent = "Erro na conexão";
        elements.apiStatus.classList.add("disconnected");
        return null;
    }
}

// Função para atualizar o horário da última atualização
function updateLastUpdateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    elements.lastUpdate.textContent = `Última atualização: ${time}`;
}

// Função para renderizar a lista de movimentações
function renderMovimentacoes(filteredData = null) {
    const dataToRender = filteredData || financialData.movimentacoes || [];
    
    elements.movimentacoesList.innerHTML = dataToRender.map(item => `
        <li class="movimentacao-item">
            <span class="movimentacao-name">${item.nome}</span>
            <span class="movimentacao-value ${item.valor >= 0 ? 'positive' : 'negative'}">
                ${item.valor >= 0 ? '+' : ''}${formatNumber(item.valor)}%
            </span>
        </li>
    `).join('');
}

// Função para renderizar os destaques
function renderDestaques() {
    if (!financialData.movimentacoes || financialData.movimentacoes.length === 0) return;
    
    // Encontra maior alta e baixa
    const sorted = [...financialData.movimentacoes].sort((a, b) => b.valor - a.valor);
    const maiorAlta = sorted[0];
    const maiorBaixa = sorted[sorted.length - 1];
    
    // Calcula volume total (exemplo)
    const volumeTotal = sorted.reduce((sum, item) => sum + Math.abs(item.valor), 0);
    
    // Atualiza DOM
    elements.maiorAlta.querySelector('.highlight-value').textContent = `+${formatNumber(maiorAlta.valor)}%`;
    elements.maiorAlta.querySelector('.highlight-name').textContent = maiorAlta.nome;
    
    elements.maiorBaixa.querySelector('.highlight-value').textContent = `${formatNumber(maiorBaixa.valor)}%`;
    elements.maiorBaixa.querySelector('.highlight-name').textContent = maiorBaixa.nome;
    
    elements.volumeTotal.querySelector('.highlight-value').textContent = formatNumber(volumeTotal);
}

// Função para renderizar previsões
function renderPrevisoes() {
    if (!financialData.previsoes) return;
    
    elements.previsoesContent.innerHTML = `
        <p>${financialData.previsoes.resumo}</p>
        <ul class="previsoes-list">
            ${financialData.previsoes.itens.map(item => `
                <li>
                    <strong>${item.ativo}:</strong> ${item.previsao}
                </li>
            `).join('')}
        </ul>
    `;
}

// Função para renderizar notícias
function renderNoticias() {
    if (!financialData.noticias) return;
    
    elements.noticiasContent.innerHTML = financialData.noticias.map(noticia => `
        <div class="noticia-item">
            <h3>${noticia.titulo}</h3>
            <p>${noticia.resumo}</p>
            <small>${new Date(noticia.data).toLocaleDateString('pt-BR')}</small>
        </div>
    `).join('');
}

// Função para renderizar o gráfico
function renderGrafico() {
    if (!financialData.historico || financialData.historico.length === 0) return;
    
    // Destrói gráfico anterior se existir
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = elements.grafico.getContext('2d');
    
    // Prepara dados para o gráfico
    const labels = financialData.historico.map(item => item.hora);
    const data = financialData.historico.map(item => item.valor);
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Variação (%)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Variação: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

// Função para filtrar movimentações
function filterMovimentacoes() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const filterType = elements.filterSelect.value;
    
    let filtered = financialData.movimentacoes || [];
    
    // Aplica filtro de busca
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.nome.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplica filtro de tipo
    if (filterType === 'positive') {
        filtered = filtered.filter(item => item.valor >= 0);
    } else if (filterType === 'negative') {
        filtered = filtered.filter(item => item.valor < 0);
    }
    
    renderMovimentacoes(filtered);
}

// Event Listeners
elements.refreshBtn.addEventListener('click', fetchData);
elements.searchInput.addEventListener('input', filterMovimentacoes);
elements.filterSelect.addEventListener('change', filterMovimentacoes);

// Inicialização
function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    fetchData();
    setInterval(fetchData, UPDATE_INTERVAL);
}

// Inicia o dashboard
init();