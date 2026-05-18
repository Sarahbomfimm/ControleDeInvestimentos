// Import Firebase SDKs diretamente via CDN (sem npm/build)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
let anoAtual = "2026";
let dadosCache = null;
let autenticado = false;
let usuarioAtual = null;

// Dados estruturados do sistema
let CATEGORIAS = {
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

const CATEGORIAS_2026_BASE = JSON.parse(JSON.stringify(CATEGORIAS));

// Mapeamento de links das planilhas externas por categoria
const LINKS_PLANILHAS = {
    "MARKETING": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1272441978#gid=1272441978",
    "AQUISIÇÃO DE EQUIPAMENTOS": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=2009494167#gid=2009494167",
    "OBRAS E REFORMAS": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=436187973#gid=436187973",
    "ENDOMARKETING": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1259421395#gid=1259421395",
    "VIAGENS": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1358739941#gid=1358739941",
    "SOFTWARE": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1565258358#gid=1565258358",
    "Cursos e Treinamento": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1932966335#gid=1932966335",
    "FARDAMENTO": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=1380663968#gid=1380663968",
    "CAMA, MESA E BANHO": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=2091711132#gid=2091711132",
    "Diversos": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=424670382#gid=424670382",
    "SOFIA (COMPRAS DIVERSAS)": "https://docs.google.com/spreadsheets/d/1Eg2QYIwgkSgHAUyN-lNos8wTICQ3mFTK/edit?gid=424670382#gid=424670382"
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

function categoriaTemMovimentoNoAno(data, categoria) {
    if (!data || !data[categoria]) return false;
    for (const item of Object.values(data[categoria])) {
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item.compras) && item.compras.length > 0) return true;
        if (Array.isArray(item.meses) && item.meses.some(v => Number(v) > 0)) return true;
    }
    return false;
}

function filtrarCategoriasPorAno(data, ano) {
    const configBase = data?._config || {};
    if (ano === '2026') {
        return JSON.parse(JSON.stringify(configBase));
    }

    const categoriasCriadas = new Set(data?._categoriasCriadasNoAno || []);
    const filtradas = {};

    for (const [categoria, dadosCategoria] of Object.entries(configBase)) {
        const foiCriadaNoAno = categoriasCriadas.has(categoria) || dadosCategoria?.criadaNoAno === true;
        const temMovimento = categoriaTemMovimentoNoAno(data, categoria);

        if (foiCriadaNoAno || temMovimento) {
            const clone = JSON.parse(JSON.stringify(dadosCategoria));
            delete clone.criadaNoAno;
            filtradas[categoria] = clone;
        }
    }

    return filtradas;
}

// Inicialização dos dados no Firestore
async function inicializarDados() {
    try {
        const docRef = doc(db, 'investimentos', anoAtual);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            dadosCache = data;
            CATEGORIAS = filtrarCategoriasPorAno(data, anoAtual);
        } else {
            const estrutura = anoAtual === '2026' ? criarEstruturaInicial() : {};
            // Para 2026 mantém base completa, para outros anos começa vazio.
            estrutura._config = JSON.parse(JSON.stringify(CATEGORIAS_2026_BASE));
            if (anoAtual !== '2026') {
                estrutura._categoriasCriadasNoAno = [];
            }
            await setDoc(docRef, estrutura);
            dadosCache = estrutura;
            CATEGORIAS = filtrarCategoriasPorAno(estrutura, anoAtual);
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
    // Garante que a configuração atual das categorias seja salva junto com os dados
    dados._config = CATEGORIAS;
    
    console.log('=== SALVANDO NO FIRESTORE ===');
    console.log('Categorias sendo salvas em _config:', Object.keys(dados._config));
    
    const docRef = doc(db, 'investimentos', anoAtual);
    setDoc(docRef, dados).then(() => {
        console.log('✓ Dados salvos com sucesso no Firestore');
    }).catch(err => {
        console.error('✗ Erro ao salvar dados no Firestore:', err);
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

// Centraliza a criação de datas para evitar problemas de fuso horário local
function parseDataISO(dataStr) {
    if (!dataStr) return new Date();
    return new Date(dataStr + 'T00:00:00');
}

function getClasseDisponivel(valor) {
    if (valor === null || valor === undefined) return '';
    return valor < 0 ? 'negativo' : '';
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
                    mesInicio = parseDataISO(compra.data).getMonth();
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
    const sidebarUserName = document.getElementById('sidebarUserName');
    const panelAvatar = document.getElementById('userPanelAvatar');
    const panelName = document.getElementById('userPanelName');
    const panelEmail = document.getElementById('userPanelEmail');

    if (!avatarBtn) return;

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
        if (sidebarUserName) sidebarUserName.textContent = nomeBase;

        if (panelAvatar) panelAvatar.textContent = iniciais || 'U';
        if (panelName) panelName.textContent = nomeBase;
        if (panelEmail) panelEmail.textContent = email;
    } else {
        usuarioAtual = null;
        avatarBtn.style.display = 'none';
        avatarBtn.textContent = '';
        if (sidebarUserName) sidebarUserName.textContent = 'Usuário';
        if (panelAvatar) panelAvatar.textContent = '';
        if (panelName) panelName.textContent = '';
        if (panelEmail) panelEmail.textContent = '';
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

    const data = parseDataISO(dataCompra);
    const mesInicio = data.getMonth();
    const valorParcela = valor / parcelas;

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
    let totalPrevistoGeral = 0;

    for (const [categoria, dados_categoria] of Object.entries(CATEGORIAS)) {
        const orcamento = dados_categoria.total;
        let gastoTotal = 0;

        if (dados[categoria]) {
            for (const item of Object.values(dados[categoria])) {
                gastoTotal += item.meses.reduce((a, b) => a + b, 0);
            }
        }

        totalInvestidoGeral += gastoTotal;
        const categoriaNormalizada = categoria
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

        if (orcamento !== null && categoriaNormalizada !== 'diversos') {
            totalPrevistoGeral += orcamento;
        }

        const disponivel = orcamento !== null ? orcamento - gastoTotal : null;
        const percentual = orcamento !== null && orcamento > 0 ? (gastoTotal / orcamento) * 100 : 0;

        resumos.push({ categoria, orcamento, gastoTotal, disponivel, percentual });
    }

    const totalBox = document.createElement('div');
    totalBox.className = 'resumo-total-geral';
    totalBox.innerHTML = `
        <span>Total de investimentos já realizados em ${anoAtual}</span>
        <strong>${formatarMoeda(totalInvestidoGeral)}</strong>
        <div class="resumo-total-meta">
            <span>Previsto :</span>
            <strong>${formatarMoeda(totalPrevistoGeral)}</strong>
        </div>
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
                    <div class="valor disponivel ${getClasseDisponivel(disponivel)}">${formatarMoeda(disponivel)}</div>
                </div>
            </div>
            ${orcamento !== null ? `
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentual, 100)}%"></div>
                </div>
            ` : ''}
        `;

        // Clique único: abrir painel de insight da categoria
        card.addEventListener('click', () => {
            abrirInsightCategoria(categoria, sectionId);
        });

        // Clique duplo: Abrir Modal de Itens
        card.addEventListener('dblclick', () => {
            abrirItensCategoria(categoria);
        });

        resumoContainer.appendChild(card);
    }
}

function getClasseUso(percentual) {
    if (percentual >= 90) return 'danger';
    if (percentual >= 70) return 'warning';
    return 'healthy';
}

function getStatusUso(percentual) {
    if (percentual >= 100) return 'Orcamento estourado';
    if (percentual >= 90) return 'Limite critico';
    if (percentual >= 70) return 'Em atencao';
    return 'Saudavel';
}

function gerarResumoCategoria(categoria) {
    const dados = carregarDados();
    const dadosCategoria = CATEGORIAS[categoria] || {};
    const orcamento = dadosCategoria.total;
    const origemCategoria = dados[categoria] || {};
    const itens = [];
    const gastosMensais = Array(12).fill(0);
    let gastoTotal = 0;

    for (const [nomeItem, item] of Object.entries(origemCategoria)) {
        const meses = Array.isArray(item?.meses) ? item.meses : Array(12).fill(0);
        const gastoItem = meses.reduce((acc, v) => acc + (Number(v) || 0), 0);
        const limite = Number(item?.limite) || 0;

        for (let i = 0; i < 12; i++) {
            gastosMensais[i] += Number(meses[i]) || 0;
        }

        gastoTotal += gastoItem;
        itens.push({
            nome: nomeItem,
            gasto: gastoItem,
            limite,
            compras: Array.isArray(item?.compras) ? item.compras.length : 0
        });
    }

    itens.sort((a, b) => b.gasto - a.gasto);

    const disponivel = orcamento !== null && orcamento !== undefined ? orcamento - gastoTotal : null;
    const percentual = orcamento && orcamento > 0 ? (gastoTotal / orcamento) * 100 : 0;
    const usoClass = getClasseUso(percentual);

    return {
        orcamento,
        gastoTotal,
        disponivel,
        percentual,
        usoClass,
        status: getStatusUso(percentual),
        itensTop: itens.slice(0, 5),
        gastosMensais,
        totalItens: itens.length
    };
}

function obterOuCriarInsightModal() {
    let overlay = document.getElementById('insightCategoriaOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'insightCategoriaOverlay';
    overlay.className = 'insight-overlay';
    overlay.innerHTML = `
        <div class="insight-panel" role="dialog" aria-modal="true" aria-labelledby="insightTitle">
            <button type="button" class="insight-close" id="insightCloseBtn" aria-label="Fechar painel">✕</button>
            <div class="insight-hero">
                <div>
                    <p class="insight-eyebrow">Raio-X do investimento</p>
                    <h3 id="insightTitle" class="insight-title"></h3>
                    <div id="insightStatus" class="insight-status"></div>
                </div>
                <div class="insight-ring-wrap">
                    <svg class="insight-ring" viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="ring-bg" cx="60" cy="60" r="52"></circle>
                        <circle class="ring-progress" id="insightRingProgress" cx="60" cy="60" r="52"></circle>
                    </svg>
                    <div class="insight-ring-center" id="insightPercent"></div>
                </div>
            </div>

            <div class="insight-kpis">
                <article>
                    <span>Orcado</span>
                    <strong id="insightOrcado"></strong>
                </article>
                <article>
                    <span>Gasto</span>
                    <strong id="insightGasto"></strong>
                </article>
                <article>
                    <span>Disponivel</span>
                    <strong id="insightDisponivel"></strong>
                </article>
            </div>

            <div class="insight-grid">
                <section>
                    <h4>Itens com maior impacto</h4>
                    <div id="insightTopItens" class="insight-top-list"></div>
                </section>
                <section>
                    <h4>Ritmo mensal</h4>
                    <div id="insightMonthly" class="insight-monthly"></div>
                </section>
            </div>

            <div class="insight-actions">
                <button type="button" class="btn-secondary btn-compact" id="insightIrCategoriaBtn">Ir para detalhes da categoria</button>
                <button type="button" class="btn-primary" id="insightVerItensBtn">Abrir itens completos</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove('active');
    overlay.querySelector('#insightCloseBtn')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            close();
        }
    });

    return overlay;
}

function abrirInsightCategoria(categoria, sectionId) {
    const overlay = obterOuCriarInsightModal();
    const resumo = gerarResumoCategoria(categoria);
    const porcentagemVisivel = Math.min(Math.max(resumo.percentual, 0), 999);

    const title = overlay.querySelector('#insightTitle');
    const status = overlay.querySelector('#insightStatus');
    const percent = overlay.querySelector('#insightPercent');
    const orcado = overlay.querySelector('#insightOrcado');
    const gasto = overlay.querySelector('#insightGasto');
    const disponivel = overlay.querySelector('#insightDisponivel');
    const topItens = overlay.querySelector('#insightTopItens');
    const monthly = overlay.querySelector('#insightMonthly');
    const ring = overlay.querySelector('#insightRingProgress');
    const btnIrCategoria = overlay.querySelector('#insightIrCategoriaBtn');
    const btnVerItens = overlay.querySelector('#insightVerItensBtn');

    if (!title || !status || !percent || !orcado || !gasto || !disponivel || !topItens || !monthly || !ring || !btnIrCategoria || !btnVerItens) {
        return;
    }

    title.textContent = categoria;
    status.className = `insight-status ${resumo.usoClass}`;
    status.textContent = `${resumo.status} • ${resumo.totalItens} itens monitorados`;
    percent.textContent = `${porcentagemVisivel.toFixed(1)}%`;
    orcado.textContent = formatarMoeda(resumo.orcamento);
    gasto.textContent = formatarMoeda(resumo.gastoTotal);
    disponivel.textContent = formatarMoeda(resumo.disponivel);
    disponivel.classList.toggle('negativo', resumo.disponivel !== null && resumo.disponivel < 0);

    const raio = 52;
    const circ = 2 * Math.PI * raio;
    const progress = Math.min(resumo.percentual, 100);
    ring.style.strokeDasharray = `${circ}`;
    ring.style.strokeDashoffset = `${circ - (progress / 100) * circ}`;
    ring.classList.remove('healthy', 'warning', 'danger');
    ring.classList.add(resumo.usoClass);

    if (resumo.itensTop.length === 0) {
        topItens.innerHTML = '<p class="insight-empty">Sem movimentacoes nesta categoria.</p>';
    } else {
        topItens.innerHTML = resumo.itensTop.map((item, idx) => `
            <div class="insight-item-row">
                <div>
                    <strong>${idx + 1}. ${item.nome}</strong>
                    <span>${item.compras} compras registradas</span>
                </div>
                <em>${formatarMoeda(item.gasto)}</em>
            </div>
        `).join('');
    }

    const maxMensal = Math.max(...resumo.gastosMensais, 1);
    monthly.innerHTML = MESES.map((mes, idx) => {
        const valor = resumo.gastosMensais[idx] || 0;
        const altura = Math.max(8, (valor / maxMensal) * 86);
        return `
            <div class="insight-month-col" title="${mes}: ${formatarMoeda(valor)}">
                <div class="insight-month-bar ${resumo.usoClass}" style="height:${altura}px"></div>
                <span>${mes}</span>
            </div>
        `;
    }).join('');

    btnIrCategoria.onclick = () => {
        overlay.classList.remove('active');
        const alvo = document.getElementById(sectionId);
        if (alvo) {
            alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            alvo.classList.add('highlight-flash');
            setTimeout(() => alvo.classList.remove('highlight-flash'), 2000);
        }
    };

    btnVerItens.onclick = () => {
        overlay.classList.remove('active');
        abrirItensCategoria(categoria);
    };

    overlay.classList.add('active');
}

// Renderizar categorias filtradas
window.renderizarCategorias = function(filtro = '') {
    const dados = carregarDados();
    const container = document.getElementById('categoriasContainer');
    container.innerHTML = '';

    const filtroNorm = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const [categoria, dados_categoria] of Object.entries(CATEGORIAS)) {
        if (categoria === '_config') continue;

        const itensPlanejados = Object.keys(dados_categoria.itens || {}).join(' ').toLowerCase();
        const itensComprados = dados[categoria] ? Object.keys(dados[categoria]).join(' ').toLowerCase() : '';
        const stringBusca = (categoria + ' ' + itensPlanejados + ' ' + itensComprados).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (filtro && !stringBusca.includes(filtroNorm)) {
            continue;
        }

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
        const linkPlanilha = LINKS_PLANILHAS[categoria] || "#";

        section.innerHTML = `
            <div class="categoria-header">
                <h2>${categoria}</h2>
                ${linkPlanilha !== "#" ? `
                    <a href="${linkPlanilha}" target="_blank" class="btn-print-link" title="Abrir planilha da categoria">🖨️</a>
                ` : ''}
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
                    <div class="valor disponivel ${getClasseDisponivel(disponivelCategoria)}">${formatarMoeda(disponivelCategoria)}</div>
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
function obterEntradasItensCategoria(categoria, dados) {
    if (!dados[categoria]) return [];

    return Object.entries(dados[categoria]).map(([item, dadosItem]) => {
        const meses = Array.isArray(dadosItem.meses) ? dadosItem.meses : Array(12).fill(0);
        const compras = Array.isArray(dadosItem.compras) ? dadosItem.compras : [];
        const gastoTotal = meses.reduce((a, b) => a + b, 0);
        return { item, dadosItem, meses, compras, gastoTotal };
    }).sort((a, b) => b.gastoTotal - a.gastoTotal);
}

function renderizarDetalheItemCategoria(categoria, entrada) {
    if (!entrada) {
        return '<div class="compras-vazio">Nenhum item encontrado para esta categoria.</div>';
    }

    const { item, dadosItem, meses, compras, gastoTotal } = entrada;
    const limite = dadosItem.limite;
    const disponivel = limite !== null ? limite - gastoTotal : null;
    const percentual = limite !== null && Number(limite) > 0 ? (gastoTotal / limite) * 100 : 0;

    let progressClass = '';
    if (percentual > 90) progressClass = 'danger';
    else if (percentual > 70) progressClass = 'warning';

    const usoBadge = percentual > 90 ? 'badge-danger' : percentual > 70 ? 'badge-warning' : 'badge-ok';

    return `
        <div class="item-card item-card-focused">
            <div class="item-header">
                <div>
                    <h3>${item}</h3>
                    <p class="item-subline">${compras.length} compra(s) • ${percentual.toFixed(1)}% do limite utilizado</p>
                </div>
                <div class="item-actions">
                    <span class="item-badge ${usoBadge}">${percentual > 90 ? 'Critico' : percentual > 70 ? 'Atencao' : 'Controlado'}</span>
                    <button class="btn-ghost" onclick="abrirHistorico('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}')">Ver historico</button>
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
                    <div class="valor disponivel ${getClasseDisponivel(disponivel)}">${formatarMoeda(disponivel)}</div>
                </div>
            </div>

            ${limite !== null ? `
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentual, 100)}%"></div>
                </div>
            ` : ''}

            <div class="meses-grid">
                ${meses.map((valor, index) => `
                    <div class="mes-item ${valor > 0 ? 'com-gasto' : ''}">
                        <label>${MESES[index]}</label>
                        <div class="valor">${formatarMoeda(valor)}</div>
                    </div>
                `).join('')}
            </div>

            ${compras.length > 0 ? `
                <div class="compras-historico">
                    <h4>Historico de compras</h4>
                    <div class="compras-table-wrap">
                        <table class="compras-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Parcelas</th>
                                    <th>Qtd.</th>
                                    <th>Observacao</th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${compras.map((compra, index) => `
                                    <tr>
                                        <td>${parseDataISO(compra.data).toLocaleDateString('pt-BR')}</td>
                                        <td>${formatarMoeda(compra.valor)}</td>
                                        <td>${compra.parcelas}x de ${formatarMoeda(compra.valorParcela)}</td>
                                        <td>${compra.quantidade || 1}</td>
                                        <td>${compra.observacao || '-'}</td>
                                        <td>
                                            <div class="compra-actions">
                                                <button class="btn-ghost btn-compact" onclick="editarCompra('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}', ${index})">Editar</button>
                                                <button class="btn-ghost btn-compact btn-delete" onclick="excluirCompra('${categoria.replace(/'/g, "\\'")}', '${item.replace(/'/g, "\\'")}', ${index})">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : '<div class="compras-vazio">Sem compras registradas para este item.</div>'}
        </div>
    `;
}

function renderizarItens(categoria, dados) {
    const entradas = obterEntradasItensCategoria(categoria, dados);
    if (entradas.length === 0) {
        return '<div class="compras-vazio">Sem itens cadastrados para esta categoria.</div>';
    }

    const totalItens = entradas.length;
    const totalCompras = entradas.reduce((acc, e) => acc + e.compras.length, 0);
    const totalGasto = entradas.reduce((acc, e) => acc + e.gastoTotal, 0);

    return `
        <div class="itens-overview">
            <div class="overview-chip">
                <span>Itens</span>
                <strong>${totalItens}</strong>
            </div>
            <div class="overview-chip">
                <span>Compras registradas</span>
                <strong>${totalCompras}</strong>
            </div>
            <div class="overview-chip">
                <span>Total gasto</span>
                <strong>${formatarMoeda(totalGasto)}</strong>
            </div>
        </div>

        <div class="itens-selector-box">
            <label>Selecione o item para visualizar:</label>
            <div class="itens-selector-shell" id="itemMenuShell">
                <button type="button" id="itemMenuToggle" class="item-menu-toggle" aria-expanded="false">
                    <span id="itemMenuSelected">${entradas[0].item} • ${formatarMoeda(entradas[0].gastoTotal)}</span>
                    <span class="item-menu-caret">▾</span>
                </button>
                <div id="itemMenuList" class="item-menu-list">
                    ${entradas.map((entrada, idx) => `
                        <button type="button" class="item-menu-option ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                            <span>${entrada.item}</span>
                            <strong>${formatarMoeda(entrada.gastoTotal)}</strong>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <div id="itemDetailContainer">
            ${renderizarDetalheItemCategoria(categoria, entradas[0])}
        </div>
    `;
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
            const dataFmt = parseDataISO(compra.data).toLocaleDateString('pt-BR');
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
    const entradas = obterEntradasItensCategoria(categoria, dados);

    tituloItens.textContent = `Itens - ${categoria}`;
    itensContainer.innerHTML = renderizarItens(categoria, dados);

    const itemMenuShell = document.getElementById('itemMenuShell');
    const itemMenuToggle = document.getElementById('itemMenuToggle');
    const itemMenuSelected = document.getElementById('itemMenuSelected');
    const itemMenuList = document.getElementById('itemMenuList');
    const itemDetailContainer = document.getElementById('itemDetailContainer');

    if (itemMenuShell && itemMenuToggle && itemMenuSelected && itemMenuList && itemDetailContainer) {
        itemMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const aberto = itemMenuShell.classList.toggle('open');
            itemMenuToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
        });

        itemMenuList.addEventListener('click', (e) => {
            const option = e.target.closest('.item-menu-option');
            if (!option) return;

            const index = Number(option.dataset.index);
            const entrada = entradas[index];
            if (!entrada) return;

            itemMenuSelected.textContent = `${entrada.item} • ${formatarMoeda(entrada.gastoTotal)}`;
            itemDetailContainer.innerHTML = renderizarDetalheItemCategoria(categoria, entrada);

            itemMenuList.querySelectorAll('.item-menu-option').forEach(btn => btn.classList.remove('active'));
            option.classList.add('active');

            itemMenuShell.classList.remove('open');
            itemMenuToggle.setAttribute('aria-expanded', 'false');
        });

        if (window._itemMenuOutsideHandler) {
            document.removeEventListener('click', window._itemMenuOutsideHandler);
        }
        window._itemMenuOutsideHandler = (event) => {
            if (!itemMenuShell.contains(event.target)) {
                itemMenuShell.classList.remove('open');
                itemMenuToggle.setAttribute('aria-expanded', 'false');
            }
        };
        document.addEventListener('click', window._itemMenuOutsideHandler);
    }

    modalItens.style.display = 'block';
}

// --- SISTEMA DE CONFIGURAÇÃO DE CATEGORIAS ---

window.abrirConfiguracoes = function() {
    const modal = document.getElementById('modalConfiguracoes');
    const container = document.getElementById('configContainer');
    container.innerHTML = '';

    // Carrega as categorias do estado persistido (_config), não da memória
    const dados = carregarDados();
    const categoriasParaExibir = dados._config || CATEGORIAS;

    console.log('=== abrirConfiguracoes ===');
    console.log('Categorias a exibir:', Object.keys(categoriasParaExibir));

    for (const [catNome, catDados] of Object.entries(categoriasParaExibir)) {
        if (catNome === '_config') continue;
        
        const catBlock = document.createElement('div');
        catBlock.className = 'config-category-block';
        catBlock.dataset.id = catNome;
        catBlock.innerHTML = `
            <button class="btn-remove-block" title="Remover Categoria" onclick="this.parentElement.remove()">×</button>
            <div class="config-row">
                <div class="form-group">
                    <label>Nome da Categoria</label>
                    <input type="text" class="cfg-cat-name" data-orig="${catNome}" value="${catNome}" placeholder="Ex: Marketing">
                </div>
                <div class="form-group">
                    <label>Orçamento Total</label>
                    <input type="number" step="0.01" class="cfg-cat-total" value="${catDados.total || 0}">
                </div>
            </div>
            <div class="config-items-list" id="items-list-${slugCategoria(catNome)}">
                <label style="font-size: 0.8rem; color: var(--muted);">Subcategorias (Itens Planejados):</label>
                ${Object.entries(catDados.itens || {}).map(([itemName, itemVal]) => `
                    <div class="config-item-row">
                        <input type="text" class="cfg-item-name" data-orig="${itemName}" value="${itemName}" placeholder="Nome do item">
                        <input type="number" step="0.01" class="cfg-item-val" value="${itemVal || 0}" placeholder="Valor orçado">
                        <button class="btn-remove-block" style="position:static; width:24px; height:24px; font-size:0.9rem;" onclick="this.parentElement.remove()">×</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn-add-sub" onclick="window.adicionarItemUI('${slugCategoria(catNome)}')">+ Adicionar Subcategoria</button>
        `;
        container.appendChild(catBlock);
    }
    modal.style.display = 'block';
};

window.adicionarCategoriaUI = function() {
    const container = document.getElementById('configContainer');
    const tempId = 'nova-' + Date.now();
    const catBlock = document.createElement('div');
    catBlock.className = 'config-category-block';
    catBlock.innerHTML = `
        <button class="btn-remove-block" onclick="this.parentElement.remove()">×</button>
        <div class="config-row">
            <div class="form-group"><label>Nome da Categoria</label><input type="text" class="cfg-cat-name" value="" placeholder="Nova Categoria"></div>
            <div class="form-group"><label>Orçamento Total</label><input type="number" step="0.01" class="cfg-cat-total" value="0"></div>
        </div>
        <div class="config-items-list" id="items-list-${tempId}"><label style="font-size: 0.8rem; color: var(--muted);">Subcategorias:</label></div>
        <button class="btn-add-sub" onclick="window.adicionarItemUI('${tempId}')">+ Adicionar Subcategoria</button>
    `;
    container.appendChild(catBlock);
};

window.adicionarItemUI = function(containerId) {
    const list = document.getElementById('items-list-' + containerId);
    const div = document.createElement('div');
    div.className = 'config-item-row';
    div.innerHTML = `
        <input type="text" class="cfg-item-name" value="" placeholder="Nome do item">
        <input type="number" step="0.01" class="cfg-item-val" value="0">
        <button class="btn-remove-block" style="position:static; width:24px; height:24px; font-size:0.9rem;" onclick="this.parentElement.remove()">×</button>
    `;
    list.appendChild(div);
};

document.getElementById('btnAddCategory')?.addEventListener('click', () => {
    window.adicionarCategoriaUI();
});

document.getElementById('btnSalvarConfig')?.addEventListener('click', () => {
    const novosDados = carregarDados();
    const novaCATEGORIAS = {};

    console.log('=== ANTES DE SALVAR ===');
    console.log('CATEGORIAS original:', Object.keys(CATEGORIAS));
    console.log('Blocos encontrados:', document.querySelectorAll('.config-category-block').length);

    document.querySelectorAll('.config-category-block').forEach(block => {
        const inputCat = block.querySelector('.cfg-cat-name');
        const inputTotal = block.querySelector('.cfg-cat-total');
        const nomeOriginalCat = inputCat.dataset.orig;
        const nomeNovoCat = inputCat.value.trim();
        const novoTotal = parseFloat(inputTotal.value) || 0;

        if (!nomeNovoCat) return;

        novaCATEGORIAS[nomeNovoCat] = {
            total: novoTotal,
            itens: {}
        };

        // Se o nome da categoria mudou, precisamos migrar os dados no cache
        if (nomeOriginalCat && nomeNovoCat !== nomeOriginalCat && novosDados[nomeOriginalCat]) {
            novosDados[nomeNovoCat] = novosDados[nomeOriginalCat];
            delete novosDados[nomeOriginalCat];
        }

        if (!novosDados[nomeNovoCat]) novosDados[nomeNovoCat] = {};

        // Iterar sobre as linhas de itens para capturar nome e valor corretamente
        block.querySelectorAll('.config-item-row').forEach(itemRow => {
            const nameInput = itemRow.querySelector('.cfg-item-name');
            const valInput = itemRow.querySelector('.cfg-item-val');

            const nomeNovoItem = nameInput.value.trim();
            if (!nomeNovoItem) return;

            const nomeOriginalItem = nameInput.dataset.orig;
            const novoValorItem = parseFloat(valInput.value) || 0;

            novaCATEGORIAS[nomeNovoCat].itens[nomeNovoItem] = novoValorItem;

            // Migração de dados de compras se o item foi renomeado
            if (nomeOriginalItem && nomeNovoItem !== nomeOriginalItem && novosDados[nomeNovoCat][nomeOriginalItem]) {
                novosDados[nomeNovoCat][nomeNovoItem] = novosDados[nomeNovoCat][nomeOriginalItem];
                delete novosDados[nomeNovoCat][nomeOriginalItem];
            }

            // Atualiza o limite (valor orçado) no cache de dados
            if (novosDados[nomeNovoCat][nomeNovoItem]) {
                novosDados[nomeNovoCat][nomeNovoItem].limite = novoValorItem;
            } else {
                novosDados[nomeNovoCat][nomeNovoItem] = {
                    limite: novoValorItem,
                    meses: Array(12).fill(0),
                    compras: []
                };
            }
        });
    });

    console.log('novaCATEGORIAS (após iterar):', Object.keys(novaCATEGORIAS));
    console.log('Deletando do novosDados...');

    // Remover categorias que foram deletadas do novosDados
    for (const catNome of Object.keys(novosDados)) {
        if (catNome.startsWith('_')) continue; // Ignora campos especiais como _config
        if (!novaCATEGORIAS[catNome]) {
            console.log('  Deletando categoria:', catNome);
            delete novosDados[catNome];
        }
    }

    console.log('novosDados (após deletar):', Object.keys(novosDados).filter(k => !k.startsWith('_')));

    CATEGORIAS = novaCATEGORIAS;
    console.log('CATEGORIAS atualizado:', Object.keys(CATEGORIAS));
    
    salvarDados(novosDados);
    
    fecharModal(document.getElementById('modalConfiguracoes'));
    toastSuccess('Configurações Salvas', 'As categorias e itens foram atualizados com sucesso.');
    atualizarInterface();
});

document.getElementById('configBtn')?.addEventListener('click', () => {
    abrirConfiguracoes();
});

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

// Função auxiliar para extrair linhas de compras para o CSV
function extrairLinhasCompras(itens, categoriaNome) {
    const linhas = [];
    for (const [itemNome, info] of Object.entries(itens)) {
        if (!Array.isArray(info.compras)) continue;
        for (const compra of info.compras) {
            const nomeCompra = compra.item || itemNome;
            const data = compra.data || '';
            const dataObj = compra.data ? parseDataISO(compra.data) : null;
            const mesCompra = dataObj ? MESES[dataObj.getMonth()] : '';
            const valorTotal = (compra.valor || 0).toFixed(2).replace('.', ',');
            const valorParcela = (compra.valorParcela || 0).toFixed(2).replace('.', ',');
            const quantidade = compra.quantidade ?? 1;

            const linha = [
                csvEsc(categoriaNome),
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
    return linhas;
}

// Gerar e baixar CSV com todo o histórico de compras
function gerarCSVHistorico() {
    const dados = carregarDados();
    let todasAsLinhas = [];
    const cabecalho = 'Categoria;Item;Nome da Compra;Data da Compra;Mês da Compra;Valor Total;Parcelas;Valor da Parcela;Quantidade';

    for (const [categoria, itens] of Object.entries(dados)) {
        todasAsLinhas = todasAsLinhas.concat(extrairLinhasCompras(itens, categoria));
    }

    if (todasAsLinhas.length === 0) {
        toastWarning('Nada para exportar', 'Nenhuma compra registrada para gerar o histórico completo.');
        return;
    }

    downloadCSV('historico_compras_2026.csv', [cabecalho, ...todasAsLinhas].join('\n'));
}

// Gerar e baixar CSV apenas de uma categoria
function gerarCSVHistoricoCategoria(categoriaAlvo) {
    const dados = carregarDados();
    const itens = dados[categoriaAlvo];

    if (!itens) {
        toastWarning('Categoria vazia', 'Esta categoria ainda não possui dados para exportar.');
        return;
    }

    const cabecalho = 'Categoria;Item;Nome da Compra;Data da Compra;Mês da Compra;Valor Total;Parcelas;Valor da Parcela;Quantidade';
    const linhas = extrairLinhasCompras(itens, categoriaAlvo);

    if (linhas.length === 0) {
        toastWarning('Nada para exportar', 'Nenhuma compra registrada nesta categoria para gerar o histórico.');
        return;
    }

    downloadCSV(`historico_${categoriaAlvo.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_2026.csv`, [cabecalho, ...linhas].join('\n'));
}

function downloadCSV(filename, content) {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
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

// Controle da busca e botão limpar
const inputBusca = document.getElementById('searchMain');
const btnLimparBusca = document.getElementById('clearSearch');
const btnSearch = document.getElementById('btnSearch');

function executarBusca() {
    if (!inputBusca) return;
    const termo = inputBusca.value;
    renderizarCategorias(termo);
}

btnSearch?.addEventListener('click', executarBusca);

inputBusca?.addEventListener('input', (e) => {
    const termo = e.target.value;
    btnLimparBusca.classList.toggle('active', termo.length > 0);
});

btnLimparBusca?.addEventListener('click', () => {
    inputBusca.value = '';
    btnLimparBusca.classList.remove('active');
    renderizarCategorias('');
});

function atualizarEstadoSidebar(abrir) {
    document.body.classList.toggle('sidebar-open', abrir);
    document.body.classList.toggle('sidebar-collapsed', !abrir);

    const expandBtn = document.getElementById('sidebarExpandBtn');
    const collapseBtn = document.getElementById('sidebarToggleBtn');
    const grupoCategorias = document.getElementById('sidebarCategoriasGroup');
    const btnCategorias = document.getElementById('sidebarCategoriasBtn');

    if (expandBtn) {
        expandBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    }

    if (collapseBtn) {
        collapseBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    }

    if (!abrir && grupoCategorias && btnCategorias) {
        grupoCategorias.classList.remove('open');
        btnCategorias.setAttribute('aria-expanded', 'false');
    }
}

function irParaInicio() {
    atualizarEstadoSidebar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function alternarSubmenuCategorias() {
    const grupo = document.getElementById('sidebarCategoriasGroup');
    const botao = document.getElementById('sidebarCategoriasBtn');
    if (!grupo || !botao) return;

    const aberto = grupo.classList.toggle('open');
    botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
}

function verCategorias() {
    window.location.href = 'categorias.html';
}

function criarCategoria() {
    window.location.href = 'categorias.html';
}

function alternarSidebar() {
    const aberta = document.body.classList.contains('sidebar-open');
    atualizarEstadoSidebar(!aberta);
}

// Troca de Ano
document.getElementById('anoSelect')?.addEventListener('change', async (e) => {
    anoAtual = e.target.value;
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen?.classList.add('active');
    
    await inicializarDados();
    atualizarInterface();
    
    setTimeout(() => loadingScreen?.classList.remove('active'), 800);
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
}

// Abrir/fechar painel do usuário
function inicializarPainelUsuario() {
    const avatarBtn = document.getElementById('userAvatar');
    const btnSidebarLogout = document.getElementById('btnSidebarLogout');

    if (!avatarBtn || !btnSidebarLogout) return;

    const executarLogout = async () => {
        try {
            await signOut(auth);
            atualizarUsuarioUI(null);
            toastSuccess('Sessão encerrada', 'Você saiu da conta com segurança.');
            location.reload();
        } catch (err) {
            console.error('Erro ao sair:', err);
            toastError('Erro ao sair', 'Não foi possível encerrar a sessão.');
        }
    };

    avatarBtn.addEventListener('click', () => {
        // Avatar mantido apenas como identificação visual na barra lateral.
    });

    btnSidebarLogout?.addEventListener('click', executarLogout);
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', async function () {
    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');
    const btnSidebarInicio = document.getElementById('sidebarInicioBtn');
    const btnSidebarCategorias = document.getElementById('sidebarCategoriasBtn');
    const btnSidebarVerCategorias = document.getElementById('sidebarVerCategoriasBtn');
    const btnSidebarCriarCategoria = document.getElementById('sidebarCriarCategoriaBtn');
    const btnSidebarExpand = document.getElementById('sidebarExpandBtn');
    const btnSidebarToggle = document.getElementById('sidebarToggleBtn');

    btnSidebarInicio?.addEventListener('click', irParaInicio);
    btnSidebarCategorias?.addEventListener('click', alternarSubmenuCategorias);
    btnSidebarVerCategorias?.addEventListener('click', verCategorias);
    btnSidebarCriarCategoria?.addEventListener('click', criarCategoria);
    btnSidebarExpand?.addEventListener('click', alternarSidebar);
    btnSidebarToggle?.addEventListener('click', alternarSidebar);
    atualizarEstadoSidebar(false);

    // Render base cards immediately so the homepage is not visually empty.
    atualizarInterface();

    inicializarPainelUsuario();
    let sessaoInicialCarregada = false;

    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }

    if (loginForm && loginOverlay) {
        onAuthStateChanged(auth, async (user) => {
            if (sessaoInicialCarregada) return;
            sessaoInicialCarregada = true;

            if (!user) {
                loginOverlay.style.display = 'flex';
                atualizarUsuarioUI(null);
                return;
            }

            autenticado = true;
            loginOverlay.style.display = 'none';

            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('active');
            }

            await inicializarDados();
            atualizarInterface();

            const hoje = new Date().toISOString().split('T')[0];
            const dataInput = document.getElementById('dataCompra');
            if (dataInput) dataInput.value = hoje;

            atualizarUsuarioUI(user);

            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.classList.remove('active', 'fade-out');
                    }, 500);
                }
            }, 600);
        });

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