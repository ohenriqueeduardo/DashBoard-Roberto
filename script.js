// Configurações globais
const API_URL = 'https://api.profitpro.com.br'; // URL base da API (substituir pela real)
const API_KEY = 'SUA_CHAVE_DE_API_AQUI'; // Sua chave de API da ProfitPro
const EXCHANGES = ['IBRA', 'IGCX', 'IGCT', 'ITAG', 'MLCX', 'IBXL', 'ICO2']; // Bolsas a serem monitoradas
const UPDATE_INTERVAL = 60000; // 1 minuto em milissegundos

// Variáveis globais para armazenar dados
let chartData = {
    labels: [], // Armazena os horários das atualizações
    datasets: [{
        label: 'Variação Combinada',
        data: [], // Armazena os valores da variação combinada
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        borderWidth: 2,
        fill: true
    }]
};

let exchangesData = {}; // Armazena os dados de cada bolsa
let totalAlignment = 0; // Armazena o alinhamento total
let chart; // Variável para armazenar a instância do gráfico

// Inicialização do gráfico
function initializeChart() {
    const ctx = document.getElementById('variationChart').getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tempo',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Variação Combinada',
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Função para buscar dados da API
async function fetchData() {
    try {
        // Simulação de chamada à API (substituir pela chamada real)
        // Na prática, você faria uma requisição para cada bolsa ou uma única que retorne todas
        const mockData = {
            IBRA: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            IGCX: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            IGCT: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            ITAG: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            MLCX: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            IBXL: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 },
            ICO2: { value: Math.random() * 100 - 50, variation: Math.random() * 2 - 1 }
        };

        // Atualiza os dados das bolsas
        EXCHANGES.forEach(exchange => {
            exchangesData[exchange] = {
                value: mockData[exchange].value,
                variation: mockData[exchange].variation,
                lastUpdated: new Date()
            };
        });

        // Calcula o alinhamento total (soma dos valores)
        totalAlignment = EXCHANGES.reduce((sum, exchange) => sum + mockData[exchange].value, 0);

        return true;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return false;
    }
}

// Atualiza o gráfico com novos dados
function updateChart(timestamp) {
    // Adiciona novo ponto de dados
    chartData.labels.push(moment(timestamp).format('HH:mm:ss'));
    chartData.datasets[0].data.push(totalAlignment);

    // Mantém apenas os últimos 30 pontos para não sobrecarregar o gráfico
    if (chartData.labels.length > 30) {
        chartData.labels.shift();
        chartData.datasets[0].data.shift();
    }

    // Atualiza o gráfico
    chart.update();

    // Atualiza o horário da última atualização
    document.getElementById('lastUpdateChart').textContent = `Última atualização: ${moment(timestamp).format('HH:mm:ss')}`;
}

// Atualiza a tabela de alinhamento
function updateAlignmentTable(timestamp) {
    const tableBody = document.getElementById('alignmentTableBody');
    
    // Determina o status com base no valor total
    let status, interpretation, statusClass;
    
    if (totalAlignment > 200) {
        status = 'MUITO FORTE';
        interpretation = 'Tendência de alta muito forte';
        statusClass = 'very-strong';
    } else if (totalAlignment > 180) {
        status = 'FORTE';
        interpretation = 'Tendência de alta forte';
        statusClass = 'strong';
    } else if (totalAlignment > -150) {
        status = 'INDECISÃO';
        interpretation = 'Mercado em indecisão';
        statusClass = 'indecision';
    } else if (totalAlignment > -200) {
        status = 'BAIXO';
        interpretation = 'Tendência de baixa';
        statusClass = 'low';
    } else {
        status = 'MUITO BAIXO';
        interpretation = 'Tendência de baixa muito forte';
        statusClass = 'very-low';
    }

    // Atualiza a tabela
    tableBody.innerHTML = `
        <tr>
            <td class="${statusClass}">${status}</td>
            <td>${totalAlignment.toFixed(2)}</td>
            <td>${interpretation}</td>
        </tr>
    `;

    // Atualiza o horário da última atualização
    document.getElementById('lastUpdateAlignment').textContent = `Última atualização: ${moment(timestamp).format('HH:mm:ss')}`;
}

// Atualiza os cards das bolsas
function updateExchangeCards(timestamp) {
    const container = document.getElementById('exchangeContainer');
    container.innerHTML = '';

    // Cria um card para cada bolsa
    EXCHANGES.forEach(exchange => {
        const data = exchangesData[exchange];
        const variationClass = data.variation >= 0 ? 'positive' : 'negative';
        const variationSymbol = data.variation >= 0 ? '+' : '';

        container.innerHTML += `
            <div class="exchange-card">
                <div class="exchange-name">${exchange}</div>
                <div class="exchange-value ${variationClass}">
                    ${variationSymbol}${data.variation.toFixed(2)}%
                </div>
                <div>Valor: ${data.value.toFixed(2)}</div>
            </div>
        `;
    });

    // Atualiza o horário da última atualização
    document.getElementById('lastUpdateExchanges').textContent = `Última atualização: ${moment(timestamp).format('HH:mm:ss')}`;
}

// Função principal que executa todo o processo de atualização
async function updateDashboard() {
    const timestamp = new Date();
    const success = await fetchData();
    
    if (success) {
        updateChart(timestamp);
        updateAlignmentTable(timestamp);
        updateExchangeCards(timestamp);
    }
}

// Inicialização do dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa o gráfico
    chart = initializeChart();
    
    // Primeira atualização
    await updateDashboard();
    
    // Configura atualização periódica
    setInterval(async () => {
        await updateDashboard();
    }, UPDATE_INTERVAL);
});