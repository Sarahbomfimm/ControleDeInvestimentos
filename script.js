// Dados estruturados do sistema
const CATEGORIAS = {
    "AQUISIÇÃO DE EQUIPAMENTOS": {
        total: 153863.36,
        itens: {
            "Fogão de 6 bocas": 2385.00,
            "Utensílios de Cozinha": 8000.00,
            "Piso Estrado": 1220.60,
            "Estante Leve Aço": 3387.76,
            "Multi Split 42k Btus": 46470.00,
            "Melhoria na Rede Wi-FI": 5500.00,
            "Cadeira de Escritória Ergonômica": 1900.00
        }
    },
    "OBRAS E REFORMAS": {
        total: 445041.12,
        itens: {
            "Troca de Piso 48 apto Express": 85440.00,
            "Transformar mais 1 Coluna em TWIN Express": 14400.00,
            "Recuperação dos Móveis dos Aptos Express": 17000.00,
            "Pintura Interna (Corredores) Express": 38220.00,
            "Pintura Interna (Aptos) Express": 45600.00,
            "Recuperação da Faixa Lateral (Plotagem/Pintura)": 12000.00,
            "Reforma Geral 9º Andar": 189113.12,
            "Reforma dos Banheiros da Recepção PP": 36000.00,
            "Reforma dos quartos Slim": 7268.00
        }
    },
    "MARKETING": {
        total: 159100.00,
        itens: {
            "Tráfego Pago Meta": 21600.00,
            "Tráfego Pago Google": 12000.00,
            "Influencer": 8000.00,
            "Disparo de Mensagem": 16500.00,
            "Tráfego Pago Meta Express": 9600.00,
            "Tráfego Pago Google Express": 4800.00,
            "Influencer Express": 1000.00,
            "Disparo de Mensagem Express": 8000.00,
            "Campanha Habituês e Grupo": 15000.00,
            "Kit Boas Vindas nos Quartos": 10000.00,
            "JANEIRO (Água Saborizada + Frutas no Lobby)": 400.00,
            "FEVEREIRO (Decoração Recepção, Colares de Flores, DJ na Cobertura)": 2000.00,
            "MARÇO(Dia da Mulher - Voucher c/ desconto Salão, Bombons)": 700.00,
            "ABRIL(Páscoa )": 1500.00,
            "JUNHO(Trio pé de Serra no Café e em dias estratégicos no Lobby)": 5000.00,
            "OUTUBRO(Dia das Crianças - Kit P/ Todas as Crianças durante o Mês)": 5000.00,
            "Nova Sinalização do Hotel/Restaurante": 18000.00,
            "Social Media": 10000.00,
            "Placas e Sinalização em Geral": 10000.00
        }
    },
    "ENDOMARKETING": {
        total: 31725.00,
        itens: {
            "Dia da Mulher (Presente)": 675.00,
            "Dia do Trabalhador (Presente + Almoço)": 4500.00,
            "Dia das Mães (Presente + Almoço)": 1350.00,
            "Festa de São João": 6000.00,
            "Dia dos Pais (Presente + Almoço)": 1800.00,
            "Dia das Crianças (Presente p/ filhos funcionários)": 1200.00,
            "Confraternização de Final de Ano": 16200.00
        }
    },
    "VIAGENS": {
        total: 173100.00,
        itens: {
            "VIAGENS": 173100.00
        }
    },
    "SOFTWARE": {
        total: 8000.00,
        itens: {
            "Sistema de Monitoramento (Bombas, Cisternas e GMG)": 8000.00
        }
    },
    "Cursos e Treinamento": {
        total: 10000.00,
        itens: {
            "Cursos e Treinamento": 10000.00
        }
    },
    "FARDAMENTO": {
        total: 62462.00,
        itens: {
            "FARDAMENTO": 62462.00
        }
    },
    "CAMA, MESA E BANHO": {
        total: 97525.88,
        itens: {
            "TOALHA DE BANHO": 15305.40,
            "TOALHA DE PISO": 2782.08,
            "TOALHA DE ROSTO": 6540.60,
            "COLCHÃO SOLTEIRO 0,90 X 2,00": 69897.80,
            "Copos": 1220.00,
            "Pratos": 1780.00
        }
    },
    "Diversos": {
        total: null, // indefinido
        itens: {
            "Diversos": null
        }
    },
    "SOFIA (COMPRAS DIVERSAS)": {
        total: 85000.00,
        itens: {
            "SOFIA (COMPRAS DIVERSAS)": 85000.00
        }
    }
};

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Inicialização do localStorage
function inicializarDados() {
    if (!localStorage.getItem('investimentos')) {
        const estrutura = {};
        
        for (const [categoria, dados] of Object.entries(CATEGORIAS)) {
            estrutura[categoria] = {};
            
            for (const [item, limite] of Object.entries(dados.itens)) {
                estrutura[categoria][item] = {
                    limite: limite,
                    meses: Array(12).fill(0),
                    compras: []
                };
            }
        }
        
        localStorage.setItem('investimentos', JSON.stringify(estrutura));
    }
}

// Carregar dados
function carregarDados() {
    return JSON.parse(localStorage.getItem('investimentos')) || {};
}

// Salvar dados
function salvarDados(dados) {
    localStorage.setItem('investimentos', JSON.stringify(dados));
}

// Formatar valor para moeda
function formatarMoeda(valor) {
    if (valor === null || valor === undefined) {
        return 'Indefinido';
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Parse de valor monetário
function parseMoeda(valor) {
    if (typeof valor === 'number') return valor;
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Adicionar compra
function adicionarCompra(categoria, produto, valor, parcelas, dataCompra) {
    const dados = carregarDados();
    
    if (!dados[categoria]) {
        alert('Categoria inválida!');
        return false;
    }

    // Para SOFIA (COMPRAS DIVERSAS), sempre adiciona ao item fixo mas guarda o nome original
    let itemDestino = produto;
    let nomeProduto = produto;
    
    if (categoria === 'SOFIA (COMPRAS DIVERSAS)') {
        itemDestino = 'SOFIA (COMPRAS DIVERSAS)';
        nomeProduto = produto; // Mantém o nome digitado pelo usuário
    }

    // Se o item não existir, cria com limite indefinido (ou padrão se houver)
    if (!dados[categoria][itemDestino]) {
        const limitePadrao = CATEGORIAS[categoria]?.itens?.[itemDestino] ?? null;
        dados[categoria][itemDestino] = {
            limite: limitePadrao,
            meses: Array(12).fill(0),
            compras: []
        };
    }
    
    const data = new Date(dataCompra + 'T00:00:00');
    const mesInicio = data.getMonth();
    const valorParcela = valor / parcelas;
    
    // Registrar a compra com o nome do produto
    const compra = {
        valor: valor,
        parcelas: parcelas,
        valorParcela: valorParcela,
        data: dataCompra,
        mesInicio: mesInicio,
        item: nomeProduto
    };
    
    dados[categoria][itemDestino].compras.push(compra);
    
    // Distribuir o valor pelas parcelas
    for (let i = 0; i < parcelas; i++) {
        const mesIndex = (mesInicio + i) % 12;
        dados[categoria][itemDestino].meses[mesIndex] += valorParcela;
    }
    
    salvarDados(dados);
    return true;
}

// Renderizar resumo geral
function renderizarResumoGeral() {
    const dados = carregarDados();
    const resumoContainer = document.getElementById('resumoCards');
    resumoContainer.innerHTML = '';
    
    for (const [categoria, dados_categoria] of Object.entries(CATEGORIAS)) {
        const orcamento = dados_categoria.total;
        let gastoTotal = 0;
        
        if (dados[categoria]) {
            for (const item of Object.values(dados[categoria])) {
                gastoTotal += item.meses.reduce((a, b) => a + b, 0);
            }
        }
        
        const disponivel = orcamento !== null ? orcamento - gastoTotal : null;
        const percentual = orcamento !== null ? (gastoTotal / orcamento) * 100 : 0;
        
        const card = document.createElement('div');
        card.className = 'resumo-card';
        
        let progressClass = '';
        if (percentual > 90) progressClass = 'danger';
        else if (percentual > 70) progressClass = 'warning';
        
        card.innerHTML = `
            <h3>${categoria}</h3>
            <div class="valores">
                <div class="valor-item">
                    <label>Orçado</label>
                    <div class="valor orcado">${formatarMoeda(orcamento)}</div>
                </div>
                <div class="valor-item">
                    <label>Gasto</label>
                    <div class="valor gasto">${formatarMoeda(gastoTotal)}</div>
                </div>
                <div class="valor-item">
                    <label>Disponível</label>
                    <div class="valor disponivel">${formatarMoeda(disponivel)}</div>
                </div>
            </div>
            ${orcamento !== null ? `
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentual, 100)}%"></div>
                </div>
            ` : ''}
        `;
        
        resumoContainer.appendChild(card);
    }
}

// Renderizar categorias e itens
function renderizarCategorias() {
    const dados = carregarDados();
    const container = document.getElementById('categoriasContainer');
    container.innerHTML = '';
    
    for (const [categoria, dados_categoria] of Object.entries(CATEGORIAS)) {
        const section = document.createElement('div');
        section.className = 'categoria-section';
        
        // Calcular totais da categoria
        let gastoCategoria = 0;
        if (dados[categoria]) {
            for (const item of Object.values(dados[categoria])) {
                gastoCategoria += item.meses.reduce((a, b) => a + b, 0);
            }
        }
        
        const orcamentoCategoria = dados_categoria.total;
        const disponivelCategoria = orcamentoCategoria !== null ? orcamentoCategoria - gastoCategoria : null;
        
        section.innerHTML = `
            <div class="categoria-header">
                <h2>${categoria}</h2>
            </div>
            <div class="categoria-totais">
                <div class="total-item">
                    <label>Orçamento Total</label>
                    <div class="valor orcado">${formatarMoeda(orcamentoCategoria)}</div>
                </div>
                <div class="total-item">
                    <label>Total Gasto</label>
                    <div class="valor gasto">${formatarMoeda(gastoCategoria)}</div>
                </div>
                <div class="total-item">
                    <label>Disponível</label>
                    <div class="valor disponivel">${formatarMoeda(disponivelCategoria)}</div>
                </div>
            </div>
            <div class="categoria-actions">
                <button class="btn-ghost" onclick="abrirItensCategoria('${categoria.replace(/'/g, "\\'")}')">
                    📋 Acessar Itens
                </button>
            </div>
        `;
        
        container.appendChild(section);
    }
}

// Renderizar itens de uma categoria
function renderizarItens(categoria, dados) {
    if (!dados[categoria]) return '';
    
    let html = '';
    
    for (const [item, dadosItem] of Object.entries(dados[categoria])) {
        const gastoTotal = dadosItem.meses.reduce((a, b) => a + b, 0);
        const limite = dadosItem.limite;
        const disponivel = limite !== null ? limite - gastoTotal : null;
        const percentual = limite !== null ? (gastoTotal / limite) * 100 : 0;
        
        let progressClass = '';
        if (percentual > 90) progressClass = 'danger';
        else if (percentual > 70) progressClass = 'warning';
        
        html += `
            <div class="item-card">
                <div class="item-header">
                    <h3>${item}</h3>
                    <div class="item-actions">
                        <button class="btn-ghost" onclick="abrirHistorico('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}')">Ver histórico</button>
                    </div>
                </div>
                <div class="item-status">
                    <div class="status-item">
                        <label>Limite</label>
                        <div class="valor orcado">${formatarMoeda(limite)}</div>
                    </div>
                    <div class="status-item">
                        <label>Gasto</label>
                        <div class="valor gasto">${formatarMoeda(gastoTotal)}</div>
                    </div>
                    <div class="status-item">
                        <label>Disponível</label>
                        <div class="valor disponivel">${formatarMoeda(disponivel)}</div>
                    </div>
                </div>
                ${limite !== null ? `
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentual, 100)}%"></div>
                    </div>
                ` : ''}
                <div class="meses-grid">
                    ${dadosItem.meses.map((valor, index) => `
                        <div class="mes-item ${valor > 0 ? 'com-gasto' : ''}">
                            <label>${MESES[index]}</label>
                            <div class="valor">${formatarMoeda(valor)}</div>
                        </div>
                    `).join('')}
                </div>
                ${dadosItem.compras.length > 0 ? `
                    <div class="compras-historico">
                        <h4>Histórico de Compras:</h4>
                        ${dadosItem.compras.map(compra => `
                            <div class="compra-item">
                                ${new Date(compra.data + 'T00:00:00').toLocaleDateString('pt-BR')} - 
                                ${formatarMoeda(compra.valor)} em ${compra.parcelas}x de ${formatarMoeda(compra.valorParcela)} - ${compra.item || item}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return html;
}

// Abrir histórico em modal dedicado
window.abrirHistorico = function(categoria, item) {
    console.log('Abrindo histórico para:', categoria, item);
    
    const dados = carregarDados();
    const historicoLista = document.getElementById('historicoLista');
    const historicoInfo = document.getElementById('historicoInfo');
    const modalHistorico = document.getElementById('modalHistorico');

    if (!historicoLista || !historicoInfo || !modalHistorico) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    historicoInfo.innerHTML = `<strong>${categoria}</strong> • ${item}`;

    const compras = dados[categoria]?.[item]?.compras || [];

    if (compras.length === 0) {
        historicoLista.innerHTML = '<div class="historico-item">Sem compras registradas para este item.</div>';
    } else {
        const ordenadas = [...compras].sort((a, b) => new Date(b.data) - new Date(a.data));
        historicoLista.innerHTML = ordenadas.map(compra => {
            const dataFmt = new Date(compra.data + 'T00:00:00').toLocaleDateString('pt-BR');
            return `
                <div class="historico-item">
                    ${dataFmt} - ${formatarMoeda(compra.valor)} em ${compra.parcelas}x de ${formatarMoeda(compra.valorParcela)} - ${compra.item || item}
                </div>
            `;
        }).join('');
    }

    modalHistorico.style.display = 'block';
}

// Abrir modal com itens da categoria
window.abrirItensCategoria = function(categoria) {
    const dados = carregarDados();
    const modalItens = document.getElementById('modalItens');
    const tituloItens = document.getElementById('tituloItens');
    const itensContainer = document.getElementById('itensContainer');
    
    tituloItens.textContent = `Itens - ${categoria}`;
    itensContainer.innerHTML = renderizarItens(categoria, dados);
    
    modalItens.style.display = 'block';
}

// Modal
const modal = document.getElementById('modalNovaCompra');
const modalHistorico = document.getElementById('modalHistorico');
const btn = document.getElementById('novaCompraBtn');

function abrirModal(ref) {
    ref.style.display = 'block';
}

function fecharModal(ref) {
    ref.style.display = 'none';
}

btn.onclick = function() {
    abrirModal(modal);
    preencherCategorias();
}

document.querySelectorAll('.modal .close').forEach(close => {
    close.addEventListener('click', () => {
        fecharModal(close.closest('.modal'));
    });
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        fecharModal(event.target);
    }
});

// Preencher select de categorias
function preencherCategorias() {
    const select = document.getElementById('categoria');
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    for (const categoria of Object.keys(CATEGORIAS)) {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        select.appendChild(option);
    }
}

// Preencher datalist de produtos
function preencherProdutos(categoria) {
    const datalist = document.getElementById('produtosOptions');
    datalist.innerHTML = '';

    if (!categoria) return;

    const dados = carregarDados();
    const itensExistentes = new Set();

    if (CATEGORIAS[categoria]) {
        Object.keys(CATEGORIAS[categoria].itens).forEach(item => itensExistentes.add(item));
    }

    if (dados[categoria]) {
        Object.keys(dados[categoria]).forEach(item => itensExistentes.add(item));
    }

    Array.from(itensExistentes).forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        datalist.appendChild(opt);
    });
}

document.getElementById('categoria').addEventListener('change', function() {
    const categoria = this.value;
    document.getElementById('produto').value = '';
    preencherProdutos(categoria);
});

// Formatar campo de valor
document.getElementById('valorCompra').addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2);
    e.target.value = 'R$ ' + valor.replace('.', ',');
});

// Enviar formulário
document.getElementById('formNovaCompra').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const categoria = document.getElementById('categoria').value;
    const produto = document.getElementById('produto').value.trim();
    const valorStr = document.getElementById('valorCompra').value;
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const dataCompra = document.getElementById('dataCompra').value;
    
    const valor = parseMoeda(valorStr);
    
    if (adicionarCompra(categoria, produto, valor, parcelas, dataCompra)) {
        alert('Compra registrada com sucesso!');
        fecharModal(modal);
        document.getElementById('formNovaCompra').reset();
        atualizarInterface();
    }
});

// Atualizar interface completa
function atualizarInterface() {
    renderizarResumoGeral();
    renderizarCategorias();
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    inicializarDados();
    atualizarInterface();
    
    // Definir data de hoje como padrão
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataCompra').value = hoje;
});
