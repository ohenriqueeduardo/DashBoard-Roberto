// Configurações globais
const FINNHUB_API_KEY = "cvj86dhr01qpsvov0810cvj86dhr01qpsvov081g";
const EXCHANGES = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "META", name: "Meta" },
    { symbol: "BRK.B", name: "Berkshire" }
];
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
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return `Variação: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0',
                        callback: function(value) {
                            return value + '%';
                        }
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
        card.id = `card-${exchange.symbol}`;
        card.innerHTML = `
            <div class="exchange-name">${exchange.name}</div>
            <div class="exchange-value" id="value-${exchange.symbol}">-</div>
            <div class="exchange-change" id="change-${exchange.symbol}">-</div>
        `;
        container.appendChild(card);
    });
}

// Busca dados da API Finnhub
async function fetchData() {
    try {
        const data = {};
        
        // Busca dados para cada ativo
        for (const exchange of EXCHANGES) {
            const quote = await fetchFinnhubQuote(exchange.symbol);
            data[exchange.symbol] = quote;
        }
        
        processData(data);
        updateLastUpdateTime();
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        document.getElementById('lastUpdate').textContent = `Erro: ${error.message}`;
    }
}

// Busca cotação na API Finnhub
async function fetchFinnhubQuote(symbol) {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const quoteData = await response.json();
    
    // Calcula variação percentual
    const changePercent = ((quoteData.c - quoteData.pc) / quoteData.pc) * 100;
    
    return {
        symbol: symbol,
        currentPrice: quoteData.c,
        previousClose: quoteData.pc,
        change: quoteData.c - quoteData.pc,
        changePercent: changePercent,
        timestamp: new Date(quoteData.t * 1000)
    };
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
        const valueElement = document.getElementById(`value-${exchange.symbol}`);
        const changeElement = document.getElementById(`change-${exchange.symbol}`);
        
        if (data[exchange.symbol]) {
            const quote = data[exchange.symbol];
            
            valueElement.textContent = quote.currentPrice.toFixed(2);
            changeElement.textContent = quote.changePercent >= 0 
                ? `+${quote.changePercent.toFixed(2)}%` 
                : `${quote.changePercent.toFixed(2)}%`;
            
            // Aplica classes de cor baseado na variação
            changeElement.className = 'exchange-change';
            if (quote.changePercent > 0) {
                changeElement.classList.add('positive');
            } else if (quote.changePercent < 0) {
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
        return sum + (data[exchange.symbol]?.changePercent || 0);
    }, 0);
}

// Adiciona nova entrada ao histórico de preços
function addToPriceHistory(variation) {
    const now = new Date();
    
    priceHistory.push({
        time: now,
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
    return calculateTotalVariation(data);
}

// Atualiza o status de alinhamento na tabela
function updateAlignmentStatus(alignment) {
    const alignmentElement = document.getElementById('totalAlignment');
    const statusElement = document.getElementById('alignmentStatus');
    
    alignmentElement.textContent = alignment.toFixed(2) + '%';
    
    // Determina a classificação baseada nos valores fornecidos
    if (alignment > 200) {
        statusElement.textContent = 'MUITO FORTE';
        statusElement.className = 'very-strong';
    } else if (alignment > 180) {
        statusElement.textContent = 'FORTE';
        statusElement.className = 'strong';
    } else if (alignment > -150) {
        statusElement.textContent = 'INDECISÃO';
        statusElement.className = 'indecision';
    } else if (alignment > -200) {
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
        document.getElementById('peakHigh').textContent = dayPeakHigh.toFixed(2) + '%';
    }
    
    if (currentVariation < dayPeakLow) {
        dayPeakLow = currentVariation;
        document.getElementById('peakLow').textContent = dayPeakLow.toFixed(2) + '%';
    }
    
    // Conta como mais uma movimentação
    dayMovementCount++;
    
    // Determina o status do mercado
    const movementElement = document.getElementById('marketMovement');
    const diff = dayPeakHigh - dayPeakLow;
    
    if (diff > 300) {
        movementElement.innerHTML = '<p class="positive">Dia <strong>MUITO MOVIMENTADO</strong></p>';
    } else if (diff > 150) {
        movementElement.innerHTML = '<p class="positive">Dia <strong>movimentado</strong></p>';
    } else if (diff > -150) {
        movementElement.innerHTML = '<p class="neutral">Dia <strong>normal</strong></p>';
    } else {
        movementElement.innerHTML = '<p class="negative">Dia <strong>pouco movimentado</strong></p>';
    }
    
    // Atualiza o resumo do dia
    document.getElementById('daySummary').innerHTML = `
        <p>Movimentações registradas: ${dayMovementCount}</p>
        <p>Amplitude do dia: ${diff.toFixed(2)}%</p>
    `;
}

// Atualiza o horário da última atualização
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    document.getElementById('lastUpdate').textContent = `Última atualização: ${timeString}`;
}