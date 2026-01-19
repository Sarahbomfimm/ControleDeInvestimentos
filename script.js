// Import Firebase SDKs diretamente via CDN (sem npm/build)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyjkV2j3wAKUs1hmIbPKJG2oTCJCWX1-4",
    authDomain: "controle-investimentos-hotel.firebaseapp.com",
    projectId: "controle-investimentos-hotel",
    storageBucket: "controle-investimentos-hotel.firebasestorage.app",
    messagingSenderId: "56780264305",
    appId: "1:56780264305:web:b41813d31088ed31da1cd0",
    measurementId: "G-SS7GWRPWZT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Auth
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);
const INVESTIMENTOS_DOC = doc(db, 'investimentos', '2026');
let dadosCache = null;
let autenticado = false;
let usuarioAtual = null;


// Dados estruturados do sistema
const CATEGORIAS = {
    "AQUISIÇÃO DE EQUIPAMENTOS": {
        total: 68863.36,
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

// Criar estrutura inicial a partir de CATEGORIAS
function criarEstruturaInicial() {
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

    return estrutura;
}

// Inicialização dos dados no Firestore
async function inicializarDados() {
    try {
        const snap = await getDoc(INVESTIMENTOS_DOC);
        if (snap.exists()) {
            dadosCache = snap.data();
        } else {
            const estrutura = criarEstruturaInicial();
            await setDoc(INVESTIMENTOS_DOC, estrutura);
            dadosCache = estrutura;
        }
    } catch (err) {
        console.error('Erro ao inicializar dados no Firestore:', err);
        if (!dadosCache) {
            dadosCache = criarEstruturaInicial();
        }
    }
}

// Carregar dados (a partir do cache em memória)
function carregarDados() {
    return dadosCache || {};
}

// Salvar dados (atualiza cache e envia para o Firestore)
function salvarDados(dados) {
    dadosCache = dados;
    setDoc(INVESTIMENTOS_DOC, dados).catch(err => {
        console.error('Erro ao salvar dados no Firestore:', err);
    });
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

// Cálculo de gasto total por categoria
function calcularGastoCategoria(dados, categoria) {
    if (!dados[categoria]) return 0;
    let total = 0;
    for (const item of Object.values(dados[categoria])) {
        if (!item || !Array.isArray(item.meses)) continue;
        total += item.meses.reduce((a, b) => a + b, 0);
    }
    return total;
}

// Cálculo de gastos mensais por categoria (soma de todos os itens)
function calcularGastosMensaisCategoria(dados, categoria) {
    const mesesCat = Array(12).fill(0);
    if (!dados[categoria]) return mesesCat;

    for (const item of Object.values(dados[categoria])) {
        if (!item || !Array.isArray(item.meses)) continue;
        item.meses.forEach((valor, idx) => {
            mesesCat[idx] += valor;
        });
    }
    return mesesCat;
}

// Recalcular distribuição mensal de um item com base nas compras
function recalcularMesesItem(info) {
    if (!info) return;
    const meses = Array(12).fill(0);

    if (Array.isArray(info.compras)) {
        for (const compra of info.compras) {
            const parcelas = compra.parcelas || 1;
            const valor = compra.valor || 0;
            const valorParcela = valor / parcelas;
            compra.valorParcela = valorParcela;

            let mesInicio = compra.mesInicio;
            if (mesInicio === undefined || mesInicio === null) {
                if (compra.data) {
                    mesInicio = new Date(compra.data + 'T00:00:00').getMonth();
                } else {
                    mesInicio = 0;
                }
                compra.mesInicio = mesInicio;
            }

            for (let i = 0; i < parcelas; i++) {
                const mesIndex = (mesInicio + i) % 12;
                meses[mesIndex] += valorParcela;
            }
        }
    }

    info.meses = meses;
}

// Toasts modernos
function getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast({ title, message, type = 'info', timeout = 4000 }) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
    }, timeout);

    setTimeout(() => {
        if (toast.parentNode === container) {
            container.removeChild(toast);
        }
    }, timeout + 250);
}

function toastSuccess(title, message) {
    showToast({ title, message, type: 'success' });
}

function toastWarning(title, message) {
    showToast({ title, message, type: 'warning' });
}

function toastError(title, message) {
    showToast({ title, message, type: 'error' });
}

// Atualizar avatar e painel do usuário logado
function atualizarUsuarioUI(user) {
    const avatarBtn = document.getElementById('userAvatar');
    const panelBackdrop = document.getElementById('userPanelBackdrop');
    const panelAvatar = document.getElementById('userPanelAvatar');
    const panelName = document.getElementById('userPanelName');
    const panelEmail = document.getElementById('userPanelEmail');

    if (!avatarBtn || !panelBackdrop || !panelAvatar || !panelName || !panelEmail) return;

    if (user) {
        usuarioAtual = user;
        const email = user.email || '';
        const displayName = user.displayName && user.displayName.trim() ? user.displayName : null;
        const nomeBase = displayName || (email ? email.split('@')[0] : 'Usuário');
        const iniciais = nomeBase
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0].toUpperCase())
            .join('');

        avatarBtn.textContent = iniciais || 'U';
        avatarBtn.style.display = 'flex';

        panelAvatar.textContent = iniciais || 'U';
        panelName.textContent = nomeBase;
        panelEmail.textContent = email;
    } else {
        usuarioAtual = null;
        avatarBtn.style.display = 'none';
        avatarBtn.textContent = '';
        panelAvatar.textContent = '';
        panelName.textContent = '';
        panelEmail.textContent = '';
        if (panelBackdrop) {
            panelBackdrop.style.display = 'none';
        }
    }
}

// Aplicar compra em uma estrutura de dados existente (sem salvar)
function aplicarCompraEmDados(dados, categoria, produto, valor, parcelas, dataCompra, quantidade = 1, observacao = '') {
    if (!dados[categoria]) {
        return { ok: false, tipo: 'categoriaInvalida' };
    }

    // Item de destino dentro da categoria
    let itemDestino = produto;
    let nomeProduto = produto;

    // Categorias "genéricas" com um único item igual ao nome da categoria
    const cfgCategoria = CATEGORIAS[categoria];
    if (cfgCategoria && cfgCategoria.itens) {
        const chavesItens = Object.keys(cfgCategoria.itens);
        if (chavesItens.length === 1 && chavesItens[0] === categoria) {
            // Ex.: VIAGENS, Cursos e Treinamento, FARDAMENTO, Diversos
            itemDestino = categoria;
            nomeProduto = produto; // guarda o nome digitado na compra
        }
    }

    // Caso específico legado para SOFIA (COMPRAS DIVERSAS)
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

    // Verificar limite da categoria (não permitir exceder)
    const orcamentoCategoria = CATEGORIAS[categoria]?.total ?? null;

    if (orcamentoCategoria !== null) {
        const gastoAtual = calcularGastoCategoria(dados, categoria);
        const disponivel = orcamentoCategoria - gastoAtual;

        // Ajuste de tolerância para evitar problemas de casas decimais (ex.: 17198.399999 vs 17198.40)
        const diff = valor - disponivel;
        if (diff > 0.01) {
            return { ok: false, tipo: 'limiteCategoria', disponivel: disponivel };
        }
    }

    // Registrar a compra com o nome do produto
    const compra = {
        valor: valor,
        parcelas: parcelas,
        valorParcela: valorParcela,
        data: dataCompra,
        mesInicio: mesInicio,
        item: nomeProduto,
        quantidade: quantidade || 1,
        observacao: observacao || ''
    };

    dados[categoria][itemDestino].compras.push(compra);

    // Distribuir o valor pelas parcelas
    for (let i = 0; i < parcelas; i++) {
        const mesIndex = (mesInicio + i) % 12;
        dados[categoria][itemDestino].meses[mesIndex] += valorParcela;
    }

    return { ok: true, categoria, itemDestino };
}

// Adicionar compra (nova)
function adicionarCompra(categoria, produto, valor, parcelas, dataCompra, quantidade, observacao) {
    const dados = carregarDados();

    const resultado = aplicarCompraEmDados(dados, categoria, produto, valor, parcelas, dataCompra, quantidade || 1, observacao || '');

    if (!resultado.ok) {
        if (resultado.tipo === 'categoriaInvalida') {
            toastError('Categoria inválida', 'Selecione uma categoria válida antes de registrar a compra.');
        } else if (resultado.tipo === 'limiteCategoria') {
            const disponivel = Math.max(resultado.disponivel, 0);
            toastWarning(
                'Limite da categoria atingido',
                `Esta compra não foi registrada porque ultrapassa o orçamento disponível da categoria. ` +
                `Valor disponível: ${formatarMoeda(disponivel)}. Valor da compra: ${formatarMoeda(valor)}.`
            );
        }
        return false;
    }

    salvarDados(dados);
    return true;
}

// Utilitário para gerar um id a partir do nome da categoria
function slugCategoria(nome) {
    return nome
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Renderizar resumo geral
function renderizarResumoGeral() {
    const dados = carregarDados();
    const resumoContainer = document.getElementById('resumoCards');
    resumoContainer.innerHTML = '';

    const resumos = [];
    let totalInvestidoGeral = 0;

    for (const [categoria, dados_categoria] of Object.entries(CATEGORIAS)) {
        const orcamento = dados_categoria.total;
        let gastoTotal = 0;

        if (dados[categoria]) {
            for (const item of Object.values(dados[categoria])) {
                gastoTotal += item.meses.reduce((a, b) => a + b, 0);
            }
        }

        totalInvestidoGeral += gastoTotal;

        const disponivel = orcamento !== null ? orcamento - gastoTotal : null;
        const percentual = orcamento !== null && orcamento > 0 ? (gastoTotal / orcamento) * 100 : 0;

        resumos.push({ categoria, orcamento, gastoTotal, disponivel, percentual });
    }

    const totalBox = document.createElement('div');
    totalBox.className = 'resumo-total-geral';
    totalBox.innerHTML = `
        <span>Total de investimentos já realizados em 2026</span>
        <strong>${formatarMoeda(totalInvestidoGeral)}</strong>
    `;
    resumoContainer.appendChild(totalBox);

    for (const resumo of resumos) {
        const { categoria, orcamento, gastoTotal, disponivel, percentual } = resumo;

        const card = document.createElement('div');
        card.className = 'resumo-card';

        const sectionId = 'categoria-' + slugCategoria(categoria);
        card.dataset.targetId = sectionId;

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

        card.addEventListener('click', () => {
            const alvo = document.getElementById(sectionId);
            if (alvo) {
                alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

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
        section.id = 'categoria-' + slugCategoria(categoria);

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
                <button class="btn-ghost btn-compact" onclick="abrirItensCategoria('${categoria.replace(/'/g, "\\'")}')">
                    Ver itens
                </button>
                <button class="btn-ghost btn-compact" onclick="abrirMesesCategoria('${categoria.replace(/'/g, "\\'")}')">
                    Ver gastos por mês
                </button>
                <button class="btn-ghost btn-compact" onclick="gerarCSVHistoricoCategoria('${categoria.replace(/'/g, "\\'")}')">
                    Exportar histórico
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
                        ${dadosItem.compras.map((compra, index) => `
                            <div class="compra-item">
                                <div class="compra-main">
                                    ${new Date(compra.data + 'T00:00:00').toLocaleDateString('pt-BR')} - 
                                    ${formatarMoeda(compra.valor)} em ${compra.parcelas}x de ${formatarMoeda(compra.valorParcela)} - ${compra.item || item}
                                    ${compra.quantidade ? ` • ${compra.quantidade} un.` : ''}
                                    ${compra.observacao ? `<br><em style="font-size: 0.9em; color: #666;">Obs: ${compra.observacao}</em>` : ''}
                                </div>
                                <div class="compra-actions">
                                    <button class="btn-ghost btn-compact" onclick="editarCompra('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}', ${index})">Editar</button>
                                    <button class="btn-ghost btn-compact btn-delete" onclick="excluirCompra('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}', ${index})">Excluir</button>
                                </div>
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
window.abrirHistorico = function (categoria, item) {
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
                    ${compra.quantidade ? ` • ${compra.quantidade} un.` : ''}
                    ${compra.observacao ? `<br><em style="font-size: 0.9em; color: #666;">Obs: ${compra.observacao}</em>` : ''}
                </div>
            `;
        }).join('');
    }

    modalHistorico.style.display = 'block';
}

// Editar compra individual
window.editarCompra = function (categoria, item, index) {
    const dados = carregarDados();
    const info = dados[categoria]?.[item];

    if (!info || !Array.isArray(info.compras) || !info.compras[index]) {
        toastError('Não foi possível editar', 'Compra não encontrada para este item.');
        return;
    }

    const compra = info.compras[index];

    window._editContext = {
        categoriaOrig: categoria,
        itemOrig: item,
        index,
        compraOrig: { ...compra }
    };

    const selectCategoria = document.getElementById('categoria');
    const inputProduto = document.getElementById('produto');
    const inputValor = document.getElementById('valorCompra');
    const inputQuantidade = document.getElementById('quantidade');
    const inputParcelas = document.getElementById('parcelas');
    const inputData = document.getElementById('dataCompra');
    const inputObservacao = document.getElementById('observacao');
    const btnSubmit = document.querySelector('#formNovaCompra button[type="submit"]');

    const modalItens = document.getElementById('modalItens');
    if (modalItens) fecharModal(modalItens);
    abrirModal(modal);
    preencherCategorias();

    selectCategoria.value = categoria;
    preencherProdutos(categoria);

    inputProduto.value = compra.item || item;
    inputValor.value = 'R$ ' + (compra.valor || 0).toFixed(2).replace('.', ',');
    if (inputQuantidade) inputQuantidade.value = compra.quantidade || 1;
    inputParcelas.value = compra.parcelas || 1;
    inputData.value = compra.data || new Date().toISOString().split('T')[0];
    if (inputObservacao) inputObservacao.value = compra.observacao || '';

    if (btnSubmit) {
        btnSubmit.textContent = 'SALVAR ALTERAÇÕES';
    }
};

// Excluir compra individual
window.excluirCompra = function (categoria, item, index) {
    const dados = carregarDados();
    const info = dados[categoria]?.[item];

    if (!info || !Array.isArray(info.compras) || !info.compras[index]) {
        toastError('Não foi possível excluir', 'Compra não encontrada para este item.');
        return;
    }

    info.compras.splice(index, 1);
    recalcularMesesItem(info);
    salvarDados(dados);
    toastSuccess('Compra excluída', 'A compra foi removida com sucesso.');
    atualizarInterface();
};

// Salvar edição de compra utilizando o formulário de Nova Compra
function salvarEdicaoCompra(contexto, novaCategoria, novoProduto, valor, parcelas, dataCompra, quantidade, observacao) {
    const dados = carregarDados();
    const { categoriaOrig, itemOrig, index } = contexto;

    const infoOrig = dados[categoriaOrig]?.[itemOrig];
    if (!infoOrig || !Array.isArray(infoOrig.compras) || !infoOrig.compras[index]) {
        toastError('Não foi possível editar', 'Compra original não encontrada.');
        return false;
    }

    const backup = JSON.stringify(dados);

    // Remove compra antiga
    infoOrig.compras.splice(index, 1);
    recalcularMesesItem(infoOrig);

    const resultado = aplicarCompraEmDados(dados, novaCategoria, novoProduto, valor, parcelas, dataCompra, quantidade || 1, observacao || '');

    if (!resultado.ok) {
        const dadosRestaurados = JSON.parse(backup);
        salvarDados(dadosRestaurados);

        if (resultado.tipo === 'categoriaInvalida') {
            toastError('Categoria inválida', 'Selecione uma categoria válida para salvar a edição.');
        } else if (resultado.tipo === 'limiteCategoria') {
            const disponivel = Math.max(resultado.disponivel, 0);
            toastWarning(
                'Limite da categoria atingido',
                `A edição não foi aplicada porque ultrapassa o orçamento disponível da categoria. ` +
                `Valor disponível: ${formatarMoeda(disponivel)}. Valor da compra: ${formatarMoeda(valor)}.`
            );
        }
        return false;
    }

    salvarDados(dados);
    toastSuccess('Compra atualizada', 'Os dados da compra foram atualizados com sucesso.');
    return true;
}

// Abrir modal com itens da categoria
window.abrirItensCategoria = function (categoria) {
    const dados = carregarDados();
    const modalItens = document.getElementById('modalItens');
    const tituloItens = document.getElementById('tituloItens');
    const itensContainer = document.getElementById('itensContainer');

    tituloItens.textContent = `Itens - ${categoria}`;
    itensContainer.innerHTML = renderizarItens(categoria, dados);

    modalItens.style.display = 'block';
}

// Abrir modal com gastos mensais da categoria
window.abrirMesesCategoria = function (categoria) {
    const dados = carregarDados();
    const mesesCategoria = calcularGastosMensaisCategoria(dados, categoria);

    const modal = document.getElementById('modalMesesCategoria');
    const titulo = document.getElementById('tituloMesesCategoria');
    const lista = document.getElementById('listaMesesCategoria');

    if (!modal || !titulo || !lista) return;

    titulo.textContent = `Gastos por mês - ${categoria}`;

    lista.innerHTML = MESES.map((nomeMes, idx) => `
        <div class="lista-meses-categoria-item">
            <label>${nomeMes}</label>
            <div class="valor">${formatarMoeda(mesesCategoria[idx])}</div>
        </div>
    `).join('');

    modal.style.display = 'block';
}

// Utilitário para escapar texto em CSV
function csvEsc(texto) {
    if (texto === null || texto === undefined) return '""';
    const s = String(texto).replace(/"/g, '""');
    return `"${s}"`;
}

// Gerar e baixar CSV com todo o histórico de compras
function gerarCSVHistorico() {
    const dados = carregarDados();
    const linhas = [];

    linhas.push('Categoria;Item;Nome da Compra;Data da Compra;Mês da Compra;Valor Total;Parcelas;Valor da Parcela;Quantidade');

    let temCompras = false;

    for (const [categoria, itens] of Object.entries(dados)) {
        for (const [itemNome, info] of Object.entries(itens)) {
            if (!Array.isArray(info.compras)) continue;

            for (const compra of info.compras) {
                temCompras = true;

                const nomeCompra = compra.item || itemNome;
                const data = compra.data || '';
                const dataObj = compra.data ? new Date(compra.data + 'T00:00:00') : null;
                const mesCompra = dataObj ? MESES[dataObj.getMonth()] : '';
                const valorTotal = (compra.valor !== null && compra.valor !== undefined)
                    ? compra.valor.toFixed(2).replace('.', ',')
                    : '';
                const valorParcela = (compra.valorParcela !== null && compra.valorParcela !== undefined)
                    ? compra.valorParcela.toFixed(2).replace('.', ',')
                    : '';
                const quantidade = compra.quantidade ?? 1;

                const linha = [
                    csvEsc(categoria),
                    csvEsc(itemNome),
                    csvEsc(nomeCompra),
                    csvEsc(data),
                    csvEsc(mesCompra),
                    valorTotal,
                    compra.parcelas ?? '',
                    valorParcela,
                    quantidade
                ].join(';');

                linhas.push(linha);
            }
        }
    }

    if (!temCompras) {
        toastWarning('Nada para exportar', 'Nenhuma compra registrada para gerar o histórico completo.');
        return;
    }

    const csv = linhas.join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'historico_compras_2026.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Gerar e baixar CSV apenas de uma categoria
function gerarCSVHistoricoCategoria(categoriaAlvo) {
    const dados = carregarDados();
    const itens = dados[categoriaAlvo];

    if (!itens) {
        toastWarning('Categoria vazia', 'Esta categoria ainda não possui dados para exportar.');
        return;
    }

    const linhas = [];
    linhas.push('Categoria;Item;Nome da Compra;Data da Compra;Mês da Compra;Valor Total;Parcelas;Valor da Parcela;Quantidade');

    let temCompras = false;

    for (const [itemNome, info] of Object.entries(itens)) {
        if (!Array.isArray(info.compras)) continue;

        for (const compra of info.compras) {
            temCompras = true;

            const nomeCompra = compra.item || itemNome;
            const data = compra.data || '';
            const dataObj = compra.data ? new Date(compra.data + 'T00:00:00') : null;
            const mesCompra = dataObj ? MESES[dataObj.getMonth()] : '';
            const valorTotal = (compra.valor !== null && compra.valor !== undefined)
                ? compra.valor.toFixed(2).replace('.', ',')
                : '';
            const valorParcela = (compra.valorParcela !== null && compra.valorParcela !== undefined)
                ? compra.valorParcela.toFixed(2).replace('.', ',')
                : '';
            const quantidade = compra.quantidade ?? 1;

            const linha = [
                csvEsc(categoriaAlvo),
                csvEsc(itemNome),
                csvEsc(nomeCompra),
                csvEsc(data),
                csvEsc(mesCompra),
                valorTotal,
                compra.parcelas ?? '',
                valorParcela,
                quantidade
            ].join(';');

            linhas.push(linha);
        }
    }

    if (!temCompras) {
        toastWarning('Nada para exportar', 'Nenhuma compra registrada nesta categoria para gerar o histórico.');
        return;
    }

    const csv = linhas.join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_${categoriaAlvo.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Expor exportação por categoria no escopo global (usada em onclick do HTML)
window.gerarCSVHistoricoCategoria = gerarCSVHistoricoCategoria;

// Modal
const modal = document.getElementById('modalNovaCompra');
const modalHistorico = document.getElementById('modalHistorico');
const btn = document.getElementById('novaCompraBtn');
const btnBaixarHistorico = document.getElementById('baixarHistoricoBtn');

function abrirModal(ref) {
    ref.style.display = 'block';
}

function fecharModal(ref) {
    ref.style.display = 'none';
}

btn.onclick = function () {
    window._editContext = null;
    abrirModal(modal);
    preencherCategorias();

    const form = document.getElementById('formNovaCompra');
    if (form) {
        form.reset();
    }

    const btnSubmit = document.querySelector('#formNovaCompra button[type="submit"]');
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('dataCompra');
    if (btnSubmit) btnSubmit.textContent = 'FINALIZAR';
    if (inputData) inputData.value = hoje;
}

if (btnBaixarHistorico) {
    btnBaixarHistorico.onclick = gerarCSVHistorico;
}

document.querySelectorAll('.modal .close').forEach(close => {
    close.addEventListener('click', () => {
        fecharModal(close.closest('.modal'));
    });
});

window.addEventListener('click', function (event) {
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

document.getElementById('categoria').addEventListener('change', function () {
    const categoria = this.value;
    document.getElementById('produto').value = '';
    preencherProdutos(categoria);
});

// Formatar campo de valor
document.getElementById('valorCompra').addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2);
    e.target.value = 'R$ ' + valor.replace('.', ',');
});

// Enviar formulário
document.getElementById('formNovaCompra').addEventListener('submit', function (e) {
    e.preventDefault();

    const categoria = document.getElementById('categoria').value;
    const produto = document.getElementById('produto').value.trim();
    const valorStr = document.getElementById('valorCompra').value;
    const quantidade = parseInt(document.getElementById('quantidade').value) || 1;
    const parcelas = parseInt(document.getElementById('parcelas').value);
    const dataCompra = document.getElementById('dataCompra').value;
    const observacao = document.getElementById('observacao').value.trim();

    const valor = parseMoeda(valorStr);

    if (window._editContext) {
        if (salvarEdicaoCompra(window._editContext, categoria, produto, valor, parcelas, dataCompra, quantidade, observacao)) {
            window._editContext = null;
            fecharModal(modal);
            document.getElementById('formNovaCompra').reset();
            const btnSubmit = document.querySelector('#formNovaCompra button[type="submit"]');
            if (btnSubmit) btnSubmit.textContent = 'FINALIZAR';
            atualizarInterface();
        }
    } else {
        if (adicionarCompra(categoria, produto, valor, parcelas, dataCompra, quantidade, observacao)) {
            toastSuccess('Compra registrada', 'A compra foi registrada com sucesso.');
            fecharModal(modal);
            document.getElementById('formNovaCompra').reset();
            atualizarInterface();
        }
    }
});

// Atualizar interface completa
function atualizarInterface() {
    renderizarResumoGeral();
    renderizarCategorias();
}

// Abrir/fechar painel do usuário
function inicializarPainelUsuario() {
    const avatarBtn = document.getElementById('userAvatar');
    const backdrop = document.getElementById('userPanelBackdrop');
    const btnLogout = document.getElementById('btnLogout');

    if (!avatarBtn || !backdrop || !btnLogout) return;

    avatarBtn.addEventListener('click', () => {
        if (!usuarioAtual) return;
        backdrop.style.display = 'block';
    });

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            backdrop.style.display = 'none';
        }
    });

    btnLogout.addEventListener('click', async () => {
        try {
            await signOut(auth);
            atualizarUsuarioUI(null);
            toastSuccess('Sessão encerrada', 'Você saiu da conta com segurança.');
            location.reload();
        } catch (err) {
            console.error('Erro ao sair:', err);
            toastError('Erro ao sair', 'Não foi possível encerrar a sessão.');
        }
    });
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', async function () {
    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');

    inicializarPainelUsuario();

    if (loginForm && loginOverlay) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const senha = document.getElementById('loginSenha').value.trim();

            if (!email || !senha) {
                toastWarning('Dados incompletos', 'Informe e-mail e senha para entrar.');
                return;
            }
            try {
                const cred = await signInWithEmailAndPassword(auth, email, senha);
                autenticado = true;
                loginOverlay.style.display = 'none';

                // Mostrar animação de loading
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.classList.add('active');
                }

                await inicializarDados();
                atualizarInterface();

                const hoje = new Date().toISOString().split('T')[0];
                const dataInput = document.getElementById('dataCompra');
                if (dataInput) dataInput.value = hoje;

                atualizarUsuarioUI(cred.user);

                // Ocultar animação de loading após 1.5 segundos
                setTimeout(() => {
                    if (loadingScreen) {
                        loadingScreen.classList.add('fade-out');
                        setTimeout(() => {
                            loadingScreen.classList.remove('active', 'fade-out');
                        }, 500);
                    }
                    toastSuccess('Bem-vindo', `Login realizado com sucesso para ${cred.user.email}.`);
                }, 1500);
            } catch (err) {
                console.error('Erro de login:', err);
                let msg = 'Não foi possível realizar o login.';
                if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                    msg = 'E-mail ou senha inválidos.';
                } else if (err.code === 'auth/too-many-requests') {
                    msg = 'Muitas tentativas. Tente novamente mais tarde.';
                }
                toastError('Erro ao entrar', msg);
            }
        });
    } else {
        // Fallback: se o overlay não existir por algum motivo, segue como antes
        await inicializarDados();
        atualizarInterface();

        const hoje = new Date().toISOString().split('T')[0];
        const dataInput = document.getElementById('dataCompra');
        if (dataInput) dataInput.value = hoje;
        atualizarUsuarioUI(null);
    }
});