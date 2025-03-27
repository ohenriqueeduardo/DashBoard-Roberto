// Configurações globais
const API_ENDPOINT = 'https://api.profitpro.com.br/'; // Substitua pelo endpoint real
const API_KEY = 'SUA_CHAVE_DE_API_AQUI'; // Substitua pela sua chave de API
const EXCHANGES = ['IBRA', 'IGCX', 'IGCT', 'ITAG', 'MLCX', 'IBXL', 'ICO2'];
const UPDATE_INTERVAL = 60000; // 1 minuto em milissegundos

// Variáveis para armazenamento de dados
let priceHistory = [];
let chart;
let lastData = {};
let dayPeakHigh = -Infinity;
let dayPeakLow = Infinity;
let dayStartTime = new Date();
let dayMovementCount = 0;

// Inicializa o dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    createExchangeCards();
    fetchData();
    
    // Configura atualização automática
    setInterval(fetchData, UPDATE_INTERVAL);
});

// Inicializa o gráfico com Chart.js
function initializeChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Variação Total',
                data: [],
                borderColor: '#4bc0c0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Cria os cards para cada bolsa
function createExchangeCards() {
    const container = document.getElementById('exchangesContainer');
    
    EXCHANGES.forEach(exchange => {
        const card = document.createElement('div');
        card.className = 'exchange-card';
        card.id = `card-${exchange}`;
        card.innerHTML = `
            <div class="exchange-name">${exchange}</div>
            <div class="exchange-value" id="value-${exchange}">-</div>
            <div class="exchange-change" id="change-${exchange}">-</div>
        `;
        container.appendChild(card);
    });
}

// Busca dados da API
function fetchData() {
    // Simulação de dados - substitua por chamada real à API
    // Na implementação real, você faria uma chamada fetch/axios para a API da ProfitPro
    simulateApiCall().then(data => {
        processData(data);
        updateLastUpdateTime();
    }).catch(error => {
        console.error('Erro ao buscar dados:', error);
    });
}

// Processa os dados recebidos da API
function processData(data) {
    lastData = data;
    
    // Atualiza os cards das bolsas
    updateExchangeCards(data);
    
    // Calcula a variação total
    const totalVariation = calculateTotalVariation(data);
    
    // Adiciona ao histórico de preços
    addToPriceHistory(totalVariation);
    
    // Atualiza o gráfico
    updateChart();
    
    // Calcula o alinhamento total
    const alignment = calculateAlignment(data);
    updateAlignmentStatus(alignment);
    
    // Atualiza o resumo do dia
    updateDaySummary(totalVariation);
}

// Atualiza os cards das bolsas com os novos dados
function updateExchangeCards(data) {
    EXCHANGES.forEach(exchange => {
        const valueElement = document.getElementById(`value-${exchange}`);
        const changeElement = document.getElementById(`change-${exchange}`);
        
        if (data[exchange]) {
            const value = data[exchange].value;
            const change = data[exchange].change;
            
            valueElement.textContent = value.toFixed(2);
            changeElement.textContent = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
            
            // Aplica classes de cor baseado na variação
            changeElement.className = 'exchange-change';
            if (change > 0) {
                changeElement.classList.add('positive');
            } else if (change < 0) {
                changeElement.classList.add('negative');
            } else {
                changeElement.classList.add('neutral');
            }
        }
    });
}

// Calcula a variação total somando todas as bolsas
function calculateTotalVariation(data) {
    return EXCHANGES.reduce((sum, exchange) => {
        return sum + (data[exchange]?.change || 0);
    }, 0);
}

// Adiciona nova entrada ao histórico de preços
function addToPriceHistory(variation) {
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    priceHistory.push({
        time: timeLabel,
        value: variation
    });
    
    // Mantém apenas os últimos 60 pontos (1 hora de dados)
    if (priceHistory.length > 60) {
        priceHistory.shift();
    }
}

// Atualiza o gráfico com os dados mais recentes
function updateChart() {
    chart.data.labels = priceHistory.map(item => item.time);
    chart.data.datasets[0].data = priceHistory.map(item => item.value);
    chart.update();
}

// Calcula o alinhamento total das bolsas
function calculateAlignment(data) {
    // Neste exemplo, estamos usando a soma das variações como alinhamento
    // Você pode ajustar esta lógica conforme necessário
    return calculateTotalVariation(data);
}

// Atualiza o status de alinhamento na tabela
function updateAlignmentStatus(alignment) {
    const alignmentElement = document.getElementById('totalAlignment');
    const statusElement = document.getElementById('alignmentStatus');
    
    alignmentElement.textContent = alignment.toFixed(2);
    
    // Determina a classificação baseada nos valores fornecidos
    if (alignment > 50) {
        statusElement.textContent = 'MUITO FORTE';
        statusElement.className = 'very-strong';
    } else if (alignment > 30) {
        statusElement.textContent = 'FORTE';
        statusElement.className = 'strong';
    } else if (alignment > -10) {
        statusElement.textContent = 'INDECISÃO';
        statusElement.className = 'indecision';
    } else if (alignment > -50) {
        statusElement.textContent = 'BAIXO';
        statusElement.className = 'weak';
    } else {
        statusElement.textContent = 'MUITO BAIXO';
        statusElement.className = 'very-weak';
    }
}

// Atualiza o resumo do dia
function updateDaySummary(currentVariation) {
    // Atualiza os picos do dia
    if (currentVariation > dayPeakHigh) {
        dayPeakHigh = currentVariation;
        document.getElementById('peakHigh').textContent = dayPeakHigh.toFixed(2);
    }
    
    if (currentVariation < dayPeakLow) {
        dayPeakLow = currentVariation;
        document.getElementById('peakLow').textContent = dayPeakLow.toFixed(2);
    }
    
    // Conta como mais uma movimentação
    dayMovementCount++;
    
    // Determina o status do mercado
    const movementElement = document.getElementById('marketMovement');
    const diff = dayPeakHigh - dayPeakLow;
    
    if (diff > 50) {
        movementElement.innerHTML = '<p class="positive">Dia <strong>MUITO MOVIMENTADO</strong></p>';
    } else if (diff > 30) {
        movementElement.innerHTML = '<p class="positive">Dia <strong>movimentado</strong></p>';
    } else if (diff > -30) {
        movementElement.innerHTML = '<p class="neutral">Dia <strong>normal</strong></p>';
    } else {
        movementElement.innerHTML = '<p class="negative">Dia <strong>pouco movimentado</strong></p>';
    }
    
    // Atualiza o resumo do dia
    const now = new Date();
    
    document.getElementById('daySummary').innerHTML = `
        <p>Movimentações registradas: ${dayMovementCount}</p>
        <p>Amplitude do dia: ${diff.toFixed(2)}</p>
    `;
}

// Atualiza o horário da última atualização
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = `Última atualização: ${timeString}`;
}

// Função de simulação da API - substitua pela chamada real
function simulateApiCall() {
    return new Promise((resolve) => {
        const data = {};
        
        EXCHANGES.forEach(exchange => {
            // Gera valores aleatórios para simulação
            const lastValue = lastData[exchange]?.value || 1000 + Math.random() * 500;
            const change = (Math.random()) * 4; // Variação entre -2% e +2%
            const newValue = lastValue * (1 + change / 100);
            
            data[exchange] = {
                value: newValue,
                change: change
            };
        });
        
        // Simula um delay de rede
        setTimeout(() => resolve(data), 500);
    });
}

// Implementação real com API da ProfitPro (exemplo)
/*
async function fetchRealData() {
    try {
        const response = await fetch(`${API_ENDPOINT}/market-data`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Erro na API');
        
        const data = await response.json();
        return processApiData(data); // Você precisará adaptar os dados da API para o formato esperado
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return null;
    }
}

function processApiData(apiData) {
    // Converte os dados da API para o formato que seu dashboard espera
    const processedData = {};
    
    EXCHANGES.forEach(exchange => {
        processedData[exchange] = {
            value: apiData[exchange].currentValue,
            change: apiData[exchange].percentageChange
        };
    });
    
    return processedData;
}
*/