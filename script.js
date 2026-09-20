/* =============================================================
   WUP.US — Script principal
   1.  Configuração e dados
   2.  Armazenamento (localStorage)
   3.  Utilidades
   4.  Catálogo: filtro e busca
   5.  Formulário: validação
   6.  Formulário: estimativa ao vivo
   7.  Envio e modal
   8.  Consulta de protocolo
   9.  Tema, menu e navegação
   10. Inicialização
   ============================================================= */

/* ===== 1. Configuração e dados =============================== */

/* Em uma etapa real cada mudança de status viria do técnico.
   Aqui o andamento é simulado pelo tempo decorrido desde a abertura:
   a cada MINUTOS_POR_ETAPA a solicitação avança uma etapa.
   Reduza este valor para demonstrar o avanço mais rápido. */
const MINUTOS_POR_ETAPA = 2;

const ANO_PROTOCOLO = 2026;

const CHAVE_SOLICITACOES = "wupus:solicitacoes";
const CHAVE_CONTADOR = "wupus:contador";
const CHAVE_TEMA = "wupus:tema";

const CATEGORIAS = {
  "Smartphone e tablet": { icone: "img/icone-smartphone.svg", cor: "#0B4FA2" },
  "Notebook": { icone: "img/icone-notebook.svg", cor: "#1187D6" },
  "Desktop": { icone: "img/icone-desktop.svg", cor: "#38C6F4" },
  "Impressora e periféricos": { icone: "img/icone-impressora.svg", cor: "#6E7780" },
  "TV e eletrodomésticos": { icone: "img/icone-tv.svg", cor: "#2B3138" }
};

const SERVICOS = [
  {
    id: 1,
    nome: "Troca de tela",
    categoria: "Smartphone e tablet",
    descricao: "Substituição do display trincado ou com manchas, com teste de touch antes da entrega.",
    precoBase: 220,
    prazoBase: 2
  },
  {
    id: 2,
    nome: "Troca de bateria",
    categoria: "Smartphone e tablet",
    descricao: "Para aparelhos que desligam sozinhos, estufam ou não seguram carga.",
    precoBase: 140,
    prazoBase: 1
  },
  {
    id: 3,
    nome: "Reparo do conector de carga",
    categoria: "Smartphone e tablet",
    descricao: "Limpeza ou troca do conector quando o cabo só funciona em uma posição.",
    precoBase: 110,
    prazoBase: 2
  },
  {
    id: 4,
    nome: "Limpeza interna e pasta térmica",
    categoria: "Notebook",
    descricao: "Para superaquecimento, desligamento durante jogos e ventoinha barulhenta.",
    precoBase: 120,
    prazoBase: 1
  },
  {
    id: 5,
    nome: "Upgrade de SSD ou memória",
    categoria: "Notebook",
    descricao: "Instalação da peça e transferência do sistema sem perder seus arquivos.",
    precoBase: 90,
    prazoBase: 1
  },
  {
    id: 6,
    nome: "Troca de teclado ou dobradiça",
    categoria: "Notebook",
    descricao: "Teclas que falham, teclado molhado e tampa que não sustenta o ângulo.",
    precoBase: 180,
    prazoBase: 3
  },
  {
    id: 7,
    nome: "Formatação com backup",
    categoria: "Desktop",
    descricao: "Cópia dos seus arquivos, instalação limpa do sistema e drivers atualizados.",
    precoBase: 130,
    prazoBase: 2
  },
  {
    id: 8,
    nome: "Montagem e upgrade",
    categoria: "Desktop",
    descricao: "Montagem de máquina nova ou troca de placa, fonte e armazenamento.",
    precoBase: 160,
    prazoBase: 3
  },
  {
    id: 9,
    nome: "Reparo de fonte e curto",
    categoria: "Desktop",
    descricao: "Computador que não dá sinal de vida, reinicia sozinho ou cheira a queimado.",
    precoBase: 150,
    prazoBase: 3
  },
  {
    id: 10,
    nome: "Manutenção de cabeça de impressão",
    categoria: "Impressora e periféricos",
    descricao: "Impressão falhada, listrada ou entupida em impressoras jato de tinta.",
    precoBase: 100,
    prazoBase: 2
  },
  {
    id: 11,
    nome: "Reparo de fonte e cabeamento",
    categoria: "Impressora e periféricos",
    descricao: "Periférico que não liga, não é reconhecido ou perde conexão no meio do uso.",
    precoBase: 80,
    prazoBase: 2
  },
  {
    id: 12,
    nome: "Troca da placa de fonte",
    categoria: "TV e eletrodomésticos",
    descricao: "TV que não liga, pisca o led ou perde imagem depois de alguns minutos.",
    precoBase: 260,
    prazoBase: 4
  },
  {
    id: 13,
    nome: "Reparo de módulo e conectores",
    categoria: "TV e eletrodomésticos",
    descricao: "Painel de comando, placa de potência e conexões de micro-ondas, geladeira e som.",
    precoBase: 200,
    prazoBase: 4
  },
  {
    id: 14,
    nome: "Recuperação de dados",
    categoria: "Desktop",
    descricao: "Tentativa de resgate de arquivos em HD, SSD ou cartão. Vale para qualquer equipamento.",
    precoBase: 300,
    prazoBase: 5
  },
  {
    id: 15,
    nome: "Reparo de placa com micro soldagem",
    categoria: "Smartphone e tablet",
    descricao: "Defeitos em nível de componente, incluindo aparelhos que sofreram queda ou contato com água.",
    precoBase: 320,
    prazoBase: 5
  }
];

const ETAPAS = [
  "Recebido",
  "Em diagnóstico",
  "Orçamento enviado",
  "Em reparo",
  "Pronto para retirada"
];

const PRIORIDADES = {
  normal: { rotulo: "Normal", prazo: 1, taxa: 0 },
  alta: { rotulo: "Alta", prazo: 0.7, taxa: 0.1 },
  urgente: { rotulo: "Urgente", prazo: 0.4, taxa: 0.2 }
};

/* Estado da vitrine */
let categoriaAtiva = "todos";
let termoBusca = "";
let botaoQueAbriuModal = null;

/* ===== 2. Armazenamento ====================================== */

function lerSolicitacoes() {
  try {
    const bruto = localStorage.getItem(CHAVE_SOLICITACOES);
    return bruto ? JSON.parse(bruto) : [];
  } catch (erro) {
    return [];
  }
}

function gravarSolicitacoes(lista) {
  try {
    localStorage.setItem(CHAVE_SOLICITACOES, JSON.stringify(lista));
  } catch (erro) {
    /* Navegador com armazenamento bloqueado: a sessão continua funcionando
       normalmente, só não guarda os protocolos entre visitas. */
  }
}

function gerarProtocolo() {
  const atual = Number(localStorage.getItem(CHAVE_CONTADOR) || 0) + 1;
  localStorage.setItem(CHAVE_CONTADOR, String(atual));
  return `WUP-${ANO_PROTOCOLO}-${String(atual).padStart(4, "0")}`;
}

/* Grava dois exemplos na primeira visita, para que a consulta possa ser
   testada antes de o visitante abrir a própria solicitação. */
function semearExemplos() {
  if (localStorage.getItem(CHAVE_SOLICITACOES) !== null) return;

  const agora = Date.now();
  const minuto = 60 * 1000;

  const exemplos = [
    {
      protocolo: `WUP-${ANO_PROTOCOLO}-0001`,
      nome: "Cliente de demonstração",
      email: "exemplo@wupus.com.br",
      telefone: "(87) 99999-0001",
      equipamento: "Notebook",
      marcaModelo: "Acer Aspire A315",
      servicoId: 4,
      descricao: "Esquenta muito e desliga sozinho depois de meia hora ligado.",
      prioridade: "alta",
      entrega: "loja",
      criadoEm: agora - 6 * MINUTOS_POR_ETAPA * minuto,
      exemplo: true
    },
    {
      protocolo: `WUP-${ANO_PROTOCOLO}-0002`,
      nome: "Cliente de demonstração",
      email: "exemplo@wupus.com.br",
      telefone: "(87) 99999-0002",
      equipamento: "Smartphone e tablet",
      marcaModelo: "Samsung Galaxy A54",
      servicoId: 2,
      descricao: "A bateria não segura carga e o aparelho desliga com 40%.",
      prioridade: "normal",
      entrega: "coleta",
      criadoEm: agora - 1.2 * MINUTOS_POR_ETAPA * minuto,
      exemplo: true
    }
  ];

  exemplos.forEach(function (item) {
    const estimativa = calcularEstimativa(item.servicoId, item.prioridade);
    item.prazoEstimado = estimativa.prazo;
    item.orcamentoMin = estimativa.minimo;
    item.orcamentoMax = estimativa.maximo;
  });

  gravarSolicitacoes(exemplos);
  localStorage.setItem(CHAVE_CONTADOR, "2");
}

/* ===== 3. Utilidades ========================================= */

function buscarServico(id) {
  return SERVICOS.find(function (servico) {
    return servico.id === Number(id);
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(milissegundos) {
  return new Date(milissegundos).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long"
  });
}

function calcularEstimativa(servicoId, prioridade) {
  const servico = buscarServico(servicoId);
  const regra = PRIORIDADES[prioridade] || PRIORIDADES.normal;

  if (!servico) return null;

  const base = servico.precoBase * (1 + regra.taxa);

  return {
    prazo: Math.max(1, Math.round(servico.prazoBase * regra.prazo)),
    minimo: Math.round(base),
    maximo: Math.round(base * 1.6)
  };
}

/* A etapa atual vem do tempo decorrido, acelerado pela prioridade. */
function calcularEtapa(solicitacao) {
  const regra = PRIORIDADES[solicitacao.prioridade] || PRIORIDADES.normal;
  const minutosPassados = (Date.now() - solicitacao.criadoEm) / 60000;
  const avanco = Math.floor(minutosPassados / (MINUTOS_POR_ETAPA * regra.prazo));

  return Math.min(avanco, ETAPAS.length - 1);
}

/* ===== 4. Catálogo: filtro e busca =========================== */

function filtrarServicos() {
  const termo = termoBusca.trim().toLowerCase();

  return SERVICOS.filter(function (servico) {
    const combinaCategoria =
      categoriaAtiva === "todos" || servico.categoria === categoriaAtiva;

    const combinaTermo =
      termo === "" ||
      servico.nome.toLowerCase().includes(termo) ||
      servico.descricao.toLowerCase().includes(termo);

    return combinaCategoria && combinaTermo;
  });
}

function montarCartaoServico(servico) {
  const categoria = CATEGORIAS[servico.categoria];

  const item = document.createElement("li");
  item.className = "servico";
  item.style.setProperty("--faixa", categoria.cor);

  const topo = document.createElement("div");
  topo.className = "servico__topo";

  const icone = document.createElement("img");
  icone.className = "servico__icone";
  icone.src = categoria.icone;
  icone.alt = "";
  icone.width = 28;
  icone.height = 28;

  const bloco = document.createElement("div");

  const nome = document.createElement("h3");
  nome.className = "servico__nome";
  nome.textContent = servico.nome;

  const rotuloCategoria = document.createElement("span");
  rotuloCategoria.className = "servico__categoria";
  rotuloCategoria.textContent = servico.categoria;

  bloco.append(nome, rotuloCategoria);
  topo.append(icone, bloco);

  const descricao = document.createElement("p");
  descricao.className = "servico__descricao";
  descricao.textContent = servico.descricao;

  const base = document.createElement("div");
  base.className = "servico__base";

  const preco = document.createElement("span");
  preco.className = "servico__preco";
  preco.textContent = `A partir de ${formatarMoeda(servico.precoBase)}`;

  const prazo = document.createElement("span");
  prazo.className = "servico__prazo";
  prazo.textContent =
    servico.prazoBase === 1 ? "1 dia útil" : `${servico.prazoBase} dias úteis`;

  base.append(preco, prazo);

  const acao = document.createElement("button");
  acao.className = "servico__acao";
  acao.type = "button";
  acao.dataset.servicoId = servico.id;
  acao.textContent = "Solicitar este serviço";

  item.append(topo, descricao, base, acao);
  return item;
}

function renderizarServicos() {
  const lista = document.getElementById("lista-servicos");
  const vazio = document.getElementById("servicos-vazio");
  const contador = document.getElementById("contador-servicos");
  const encontrados = filtrarServicos();

  lista.textContent = "";
  encontrados.forEach(function (servico) {
    lista.append(montarCartaoServico(servico));
  });

  vazio.hidden = encontrados.length > 0;
  contador.textContent =
    encontrados.length === 1
      ? "1 serviço encontrado"
      : `${encontrados.length} serviços encontrados`;
}

function ativarFiltro(botao) {
  document.querySelectorAll(".filtro").forEach(function (outro) {
    const ativo = outro === botao;
    outro.classList.toggle("filtro--ativo", ativo);
    outro.setAttribute("aria-pressed", String(ativo));
  });

  categoriaAtiva = botao.dataset.categoria;
  renderizarServicos();
}

/* ===== 5. Formulário: validação ============================== */

const REGRAS = {
  nome: function (valor) {
    if (valor.trim() === "") return "Informe seu nome.";
    if (valor.trim().length < 3) return "O nome precisa ter ao menos 3 letras.";
    if (valor.trim().split(/\s+/).length < 2) return "Informe nome e sobrenome.";
    return "";
  },
  email: function (valor) {
    if (valor.trim() === "") return "Informe um e-mail para contato.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) {
      return "E-mail inválido. Confira se falta o @ ou o ponto final.";
    }
    return "";
  },
  telefone: function (valor) {
    const digitos = valor.replace(/\D/g, "");
    if (digitos === "") return "Informe um telefone com DDD.";
    if (digitos.length < 10) return "Telefone incompleto. Use DDD e número.";
    return "";
  },
  equipamento: function (valor) {
    return valor === "" ? "Escolha o tipo de equipamento." : "";
  },
  "marca-modelo": function (valor) {
    if (valor.trim() === "") return "Informe a marca e o modelo do aparelho.";
    if (valor.trim().length < 2) return "Descrição muito curta.";
    return "";
  },
  servico: function (valor) {
    return valor === "" ? "Escolha o serviço desejado." : "";
  },
  descricao: function (valor) {
    const limpo = valor.trim();
    if (limpo === "") return "Descreva o que está acontecendo com o aparelho.";
    if (limpo.length < 10) {
      return `Faltam ${10 - limpo.length} caracteres para o mínimo de 10.`;
    }
    return "";
  },
  termos: function (_valor, campo) {
    return campo.checked ? "" : "É preciso autorizar o contato para enviar.";
  }
};

function validarCampo(campo) {
  const regra = REGRAS[campo.id];
  if (!regra) return true;

  const mensagem = regra(campo.value, campo);
  const alvoErro = document.getElementById(`erro-${campo.id}`);

  if (alvoErro) alvoErro.textContent = mensagem;
  campo.setAttribute("aria-invalid", mensagem === "" ? "false" : "true");

  return mensagem === "";
}

function validarFormulario() {
  const ids = Object.keys(REGRAS);
  let primeiroInvalido = null;

  ids.forEach(function (id) {
    const campo = document.getElementById(id);
    const valido = validarCampo(campo);
    if (!valido && primeiroInvalido === null) primeiroInvalido = campo;
  });

  return primeiroInvalido;
}

function aplicarMascaraTelefone(campo) {
  const digitos = campo.value.replace(/\D/g, "").slice(0, 11);

  if (digitos.length === 0) {
    campo.value = "";
    return;
  }

  let formatado = `(${digitos.slice(0, 2)}`;
  if (digitos.length > 2) formatado += `) ${digitos.slice(2, digitos.length > 10 ? 7 : 6)}`;
  if (digitos.length > 6) formatado += `-${digitos.slice(digitos.length > 10 ? 7 : 6)}`;

  campo.value = formatado;
}

function atualizarContadorDescricao() {
  const campo = document.getElementById("descricao");
  const contador = document.getElementById("contador-descricao");
  const total = campo.value.length;

  contador.textContent = `${total} de 500 caracteres`;
  contador.classList.toggle("campo__contador--limite", total > 440 || total < 10);
}

/* ===== 6. Formulário: estimativa ao vivo ===================== */

function preencherServicosDoEquipamento(equipamento, servicoSelecionado) {
  const select = document.getElementById("servico");
  const disponiveis = SERVICOS.filter(function (servico) {
    return servico.categoria === equipamento;
  });

  select.textContent = "";

  const vazio = document.createElement("option");
  vazio.value = "";
  vazio.textContent = equipamento === ""
    ? "Escolha o tipo de equipamento primeiro"
    : "Selecione o serviço";
  select.append(vazio);

  disponiveis.forEach(function (servico) {
    const opcao = document.createElement("option");
    opcao.value = servico.id;
    opcao.textContent = `${servico.nome} — a partir de ${formatarMoeda(servico.precoBase)}`;
    select.append(opcao);
  });

  if (servicoSelecionado) select.value = String(servicoSelecionado);
}

function prioridadeSelecionada() {
  const marcado = document.querySelector('input[name="prioridade"]:checked');
  return marcado ? marcado.value : "normal";
}

function atualizarResumo() {
  const servicoId = document.getElementById("servico").value;
  const vazio = document.getElementById("resumo-vazio");
  const dados = document.getElementById("resumo-dados");
  const estimativa = calcularEstimativa(servicoId, prioridadeSelecionada());

  if (!estimativa) {
    vazio.hidden = false;
    dados.hidden = true;
    return;
  }

  const servico = buscarServico(servicoId);
  const prioridade = PRIORIDADES[prioridadeSelecionada()];

  document.getElementById("resumo-servico").textContent = servico.nome;
  document.getElementById("resumo-prioridade").textContent = prioridade.rotulo;
  document.getElementById("resumo-prazo").textContent =
    estimativa.prazo === 1 ? "1 dia útil" : `${estimativa.prazo} dias úteis`;
  document.getElementById("resumo-orcamento").textContent =
    `${formatarMoeda(estimativa.minimo)} a ${formatarMoeda(estimativa.maximo)}`;

  vazio.hidden = true;
  dados.hidden = false;
}

/* Vem do botão "Solicitar este serviço" no catálogo. */
function escolherServicoNoFormulario(servicoId) {
  const servico = buscarServico(servicoId);
  if (!servico) return;

  const equipamento = document.getElementById("equipamento");
  equipamento.value = servico.categoria;
  preencherServicosDoEquipamento(servico.categoria, servico.id);
  atualizarResumo();
  validarCampo(equipamento);
  validarCampo(document.getElementById("servico"));

  document.getElementById("solicitar").scrollIntoView({ behavior: "smooth" });

  const nome = document.getElementById("nome");
  const alvo = nome.value.trim() === "" ? nome : document.getElementById("descricao");
  window.setTimeout(function () {
    alvo.focus({ preventScroll: true });
  }, 400);
}

/* ===== 7. Envio e modal ====================================== */

function montarLinhaResumoModal(termo, definicao) {
  const linha = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");

  dt.textContent = termo;
  dd.textContent = definicao;
  linha.append(dt, dd);

  return linha;
}

function abrirModal(solicitacao) {
  const modal = document.getElementById("modal");
  const servico = buscarServico(solicitacao.servicoId);
  const resumo = document.getElementById("modal-resumo");

  document.getElementById("modal-protocolo").textContent = solicitacao.protocolo;

  resumo.textContent = "";
  resumo.append(
    montarLinhaResumoModal("Equipamento", solicitacao.marcaModelo),
    montarLinhaResumoModal("Serviço", servico.nome),
    montarLinhaResumoModal("Prioridade", PRIORIDADES[solicitacao.prioridade].rotulo),
    montarLinhaResumoModal(
      "Prazo estimado",
      solicitacao.prazoEstimado === 1 ? "1 dia útil" : `${solicitacao.prazoEstimado} dias úteis`
    ),
    montarLinhaResumoModal(
      "Faixa de orçamento",
      `${formatarMoeda(solicitacao.orcamentoMin)} a ${formatarMoeda(solicitacao.orcamentoMax)}`
    )
  );

  modal.showModal();
  document.getElementById("btn-copiar").focus();
}

/* O foco volta para quem abriu o modal pelo evento "close", que também
   dispara quando o visitante fecha com a tecla Esc. */
function fecharModal() {
  document.getElementById("modal").close();
}

function devolverFoco() {
  if (botaoQueAbriuModal) botaoQueAbriuModal.focus();
}

function enviarSolicitacao(evento) {
  evento.preventDefault();

  const status = document.getElementById("status-form");
  const invalido = validarFormulario();

  if (invalido) {
    status.textContent = "Alguns campos precisam de ajuste. Veja as mensagens em destaque.";
    invalido.focus();
    return;
  }

  status.textContent = "";

  const servicoId = Number(document.getElementById("servico").value);
  const prioridade = prioridadeSelecionada();
  const estimativa = calcularEstimativa(servicoId, prioridade);

  const solicitacao = {
    protocolo: gerarProtocolo(),
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value,
    equipamento: document.getElementById("equipamento").value,
    marcaModelo: document.getElementById("marca-modelo").value.trim(),
    servicoId: servicoId,
    descricao: document.getElementById("descricao").value.trim(),
    prioridade: prioridade,
    entrega: document.querySelector('input[name="entrega"]:checked').value,
    criadoEm: Date.now(),
    prazoEstimado: estimativa.prazo,
    orcamentoMin: estimativa.minimo,
    orcamentoMax: estimativa.maximo
  };

  const lista = lerSolicitacoes();
  lista.push(solicitacao);
  gravarSolicitacoes(lista);

  botaoQueAbriuModal = evento.submitter;
  abrirModal(solicitacao);

  evento.target.reset();
  preencherServicosDoEquipamento("", null);
  atualizarResumo();
  atualizarContadorDescricao();
  renderizarMeusProtocolos();

  document.querySelectorAll('[aria-invalid="true"]').forEach(function (campo) {
    campo.setAttribute("aria-invalid", "false");
  });
}

function copiarProtocolo() {
  const botao = document.getElementById("btn-copiar");
  const texto = document.getElementById("modal-protocolo").textContent;

  navigator.clipboard.writeText(texto).then(function () {
    botao.textContent = "Copiado";
    window.setTimeout(function () {
      botao.textContent = "Copiar protocolo";
    }, 2000);
  }).catch(function () {
    botao.textContent = "Copie manualmente o número acima";
  });
}

/* ===== 8. Consulta de protocolo ============================== */

function montarLinhaTempo(etapaAtual) {
  const lista = document.createElement("ol");
  lista.className = "linha-tempo";

  ETAPAS.forEach(function (nome, indice) {
    const item = document.createElement("li");
    item.className = "linha-tempo__etapa";
    item.textContent = nome;

    if (indice < etapaAtual) item.classList.add("linha-tempo__etapa--concluida");
    if (indice === etapaAtual) {
      item.classList.add("linha-tempo__etapa--atual");
      item.setAttribute("aria-current", "step");
    }

    lista.append(item);
  });

  return lista;
}

function montarResultado(solicitacao) {
  const servico = buscarServico(solicitacao.servicoId);
  const etapa = calcularEtapa(solicitacao);
  const prioridade = PRIORIDADES[solicitacao.prioridade];

  const caixa = document.createElement("article");
  caixa.className = "resultado";

  const topo = document.createElement("div");
  topo.className = "resultado__topo";

  const protocolo = document.createElement("p");
  protocolo.className = "resultado__protocolo";
  protocolo.textContent = solicitacao.protocolo;

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta etiqueta--${solicitacao.prioridade}`;
  etiqueta.textContent = `Prioridade ${prioridade.rotulo.toLowerCase()}`;

  topo.append(protocolo, etiqueta);

  const dados = document.createElement("dl");
  dados.className = "resultado__dados";

  const pares = [
    ["Equipamento", solicitacao.marcaModelo],
    ["Serviço", servico.nome],
    ["Aberta em", formatarData(solicitacao.criadoEm)],
    ["Situação", ETAPAS[etapa]],
    [
      "Prazo estimado",
      solicitacao.prazoEstimado === 1 ? "1 dia útil" : `${solicitacao.prazoEstimado} dias úteis`
    ],
    [
      "Faixa de orçamento",
      `${formatarMoeda(solicitacao.orcamentoMin)} a ${formatarMoeda(solicitacao.orcamentoMax)}`
    ]
  ];

  pares.forEach(function (par) {
    const grupo = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = par[0];
    dd.textContent = par[1];
    grupo.append(dt, dd);
    dados.append(grupo);
  });

  const descricao = document.createElement("p");
  descricao.className = "resultado__descricao";
  descricao.textContent = solicitacao.descricao;

  const nota = document.createElement("p");
  nota.className = "resultado__nota";
  nota.textContent =
    "Andamento simulado para esta versão do sistema: as etapas avançam com o tempo desde a abertura.";

  caixa.append(topo, dados, descricao, montarLinhaTempo(etapa), nota);
  return caixa;
}

function montarErroConsulta(texto) {
  const caixa = document.createElement("p");
  caixa.className = "resultado resultado--erro";
  caixa.textContent = texto;
  return caixa;
}

function consultarProtocolo(valor) {
  const area = document.getElementById("resultado-consulta");
  const procurado = valor.trim().toUpperCase();
  const erro = document.getElementById("erro-protocolo");
  const campo = document.getElementById("protocolo-consulta");

  area.textContent = "";

  if (procurado === "") {
    erro.textContent = "Digite o número do protocolo.";
    campo.setAttribute("aria-invalid", "true");
    return;
  }

  erro.textContent = "";
  campo.setAttribute("aria-invalid", "false");

  const encontrada = lerSolicitacoes().find(function (item) {
    return item.protocolo === procurado;
  });

  if (!encontrada) {
    area.append(
      montarErroConsulta(
        `Nenhuma solicitação encontrada para ${procurado}. Confira o formato: WUP-${ANO_PROTOCOLO}-0001.`
      )
    );
    return;
  }

  area.append(montarResultado(encontrada));
}

function renderizarMeusProtocolos() {
  const lista = document.getElementById("lista-protocolos");
  const botaoLimpar = document.getElementById("btn-limpar");
  const solicitacoes = lerSolicitacoes();

  lista.textContent = "";

  if (solicitacoes.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "minhas__vazio";
    vazio.textContent = "Nenhuma solicitação aberta neste navegador ainda.";
    lista.append(vazio);
    botaoLimpar.hidden = true;
    return;
  }

  botaoLimpar.hidden = false;

  solicitacoes.slice().reverse().forEach(function (solicitacao) {
    const servico = buscarServico(solicitacao.servicoId);

    const item = document.createElement("li");
    item.className = "minhas__item";

    const botao = document.createElement("button");
    botao.className = "minhas__protocolo";
    botao.type = "button";
    botao.dataset.protocolo = solicitacao.protocolo;
    botao.textContent = solicitacao.protocolo;

    const detalhe = document.createElement("span");
    detalhe.className = "minhas__equipamento";
    detalhe.textContent = `${solicitacao.marcaModelo} — ${servico.nome}`;

    const situacao = document.createElement("span");
    situacao.className = "etiqueta etiqueta--normal";
    situacao.textContent = ETAPAS[calcularEtapa(solicitacao)];

    item.append(botao, detalhe, situacao);
    lista.append(item);
  });
}

function limparDados() {
  const confirmado = window.confirm(
    "Isso apaga os protocolos guardados neste navegador, incluindo os exemplos. Continuar?"
  );

  if (!confirmado) return;

  localStorage.removeItem(CHAVE_SOLICITACOES);
  localStorage.removeItem(CHAVE_CONTADOR);
  semearExemplos();
  renderizarMeusProtocolos();
  document.getElementById("resultado-consulta").textContent = "";
}

/* ===== 9. Tema, menu e navegação ============================= */

function aplicarTema(tema) {
  const botao = document.getElementById("btn-tema");
  const logo = document.getElementById("logo-cabecalho");
  const escuro = tema === "escuro";

  document.documentElement.dataset.tema = tema;
  botao.setAttribute("aria-pressed", String(escuro));
  botao.querySelector(".botao-tema__texto").textContent = escuro ? "Tema claro" : "Tema escuro";

  /* A logo tem duas versões porque as letras escuras sumiriam no fundo escuro. */
  logo.src = escuro ? "img/logo-wupus-escuro.svg" : "img/logo-wupus.svg";

  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch (erro) {
    /* Sem armazenamento a escolha vale só para esta visita. */
  }
}

function iniciarTema() {
  let salvo = null;

  try {
    salvo = localStorage.getItem(CHAVE_TEMA);
  } catch (erro) {
    salvo = null;
  }

  if (salvo) {
    aplicarTema(salvo);
    return;
  }

  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTema(prefereEscuro ? "escuro" : "claro");
}

function alternarMenu(forcarFechado) {
  const navegacao = document.getElementById("navegacao");
  const botao = document.getElementById("btn-menu");
  const aberto = forcarFechado ? false : !navegacao.classList.contains("navegacao--aberta");

  navegacao.classList.toggle("navegacao--aberta", aberto);
  botao.setAttribute("aria-expanded", String(aberto));
}

function iniciarScrollSpy() {
  const secoes = document.querySelectorAll("main section[id]");
  const links = document.querySelectorAll(".navegacao__link");

  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;

      links.forEach(function (link) {
        const alvo = link.getAttribute("href").slice(1);
        link.classList.toggle("navegacao__link--ativo", alvo === entrada.target.id);
      });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  secoes.forEach(function (secao) {
    observador.observe(secao);
  });
}

/* O cabeçalho é fixo no topo, então a rolagem por âncora precisa descontar a
   altura dele. Medir evita que o valor saia do lugar quando o menu quebra em
   duas linhas ou a fonte carrega com outra métrica. */
function medirCabecalho() {
  const altura = document.getElementById("cabecalho").offsetHeight;
  document.documentElement.style.setProperty("--altura-cabecalho", `${altura}px`);
}

function iniciarSombraCabecalho() {
  const cabecalho = document.getElementById("cabecalho");

  window.addEventListener("scroll", function () {
    cabecalho.classList.toggle("cabecalho--fixo", window.scrollY > 8);
  }, { passive: true });
}

/* ===== 10. Inicialização ===================================== */

function registrarEventos() {
  /* Catálogo */
  document.getElementById("busca-servicos").addEventListener("input", function (evento) {
    termoBusca = evento.target.value;
    renderizarServicos();
  });

  document.getElementById("filtros").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".filtro");
    if (botao) ativarFiltro(botao);
  });

  document.getElementById("lista-servicos").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".servico__acao");
    if (botao) escolherServicoNoFormulario(botao.dataset.servicoId);
  });

  /* Formulário */
  const formulario = document.getElementById("form-solicitacao");

  formulario.addEventListener("submit", enviarSolicitacao);

  formulario.addEventListener("blur", function (evento) {
    if (REGRAS[evento.target.id]) validarCampo(evento.target);
  }, true);

  document.getElementById("telefone").addEventListener("input", function (evento) {
    aplicarMascaraTelefone(evento.target);
  });

  document.getElementById("descricao").addEventListener("input", atualizarContadorDescricao);

  document.getElementById("equipamento").addEventListener("change", function (evento) {
    preencherServicosDoEquipamento(evento.target.value, null);
    atualizarResumo();
  });

  document.getElementById("servico").addEventListener("change", function (evento) {
    validarCampo(evento.target);
    atualizarResumo();
  });

  document.querySelectorAll('input[name="prioridade"]').forEach(function (radio) {
    radio.addEventListener("change", atualizarResumo);
  });

  document.getElementById("btn-limpar-form").addEventListener("click", function () {
    window.setTimeout(function () {
      preencherServicosDoEquipamento("", null);
      atualizarResumo();
      atualizarContadorDescricao();
      document.getElementById("status-form").textContent = "";
      document.querySelectorAll(".campo__erro").forEach(function (alvo) {
        alvo.textContent = "";
      });
    }, 0);
  });

  /* Modal */
  document.getElementById("btn-copiar").addEventListener("click", copiarProtocolo);
  document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);

  document.getElementById("btn-ir-consulta").addEventListener("click", function () {
    const protocolo = document.getElementById("modal-protocolo").textContent;

    /* Aqui o visitante segue para outra seção, então o foco não volta
       para o botão de envio. */
    botaoQueAbriuModal = null;
    fecharModal();
    document.getElementById("protocolo-consulta").value = protocolo;
    consultarProtocolo(protocolo);
    document.getElementById("consulta").scrollIntoView({ behavior: "smooth" });
  });

  const modal = document.getElementById("modal");

  modal.addEventListener("click", function (evento) {
    if (evento.target.id === "modal") fecharModal();
  });

  modal.addEventListener("close", devolverFoco);

  /* Consulta */
  document.getElementById("form-consulta").addEventListener("submit", function (evento) {
    evento.preventDefault();
    consultarProtocolo(document.getElementById("protocolo-consulta").value);
  });

  document.getElementById("lista-protocolos").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".minhas__protocolo");
    if (!botao) return;

    document.getElementById("protocolo-consulta").value = botao.dataset.protocolo;
    consultarProtocolo(botao.dataset.protocolo);
  });

  document.getElementById("btn-limpar").addEventListener("click", limparDados);

  /* Tema e menu */
  document.getElementById("btn-tema").addEventListener("click", function () {
    const atual = document.documentElement.dataset.tema;
    aplicarTema(atual === "escuro" ? "claro" : "escuro");
  });

  document.getElementById("btn-menu").addEventListener("click", function () {
    alternarMenu(false);
  });

  document.getElementById("navegacao").addEventListener("click", function (evento) {
    if (evento.target.matches(".navegacao__link")) alternarMenu(true);
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") alternarMenu(true);
  });
}

function iniciar() {
  iniciarTema();
  medirCabecalho();
  semearExemplos();
  renderizarServicos();
  preencherServicosDoEquipamento("", null);
  atualizarResumo();
  atualizarContadorDescricao();
  renderizarMeusProtocolos();
  registrarEventos();
  iniciarScrollSpy();
  iniciarSombraCabecalho();

  window.addEventListener("resize", medirCabecalho);

  /* As fontes externas podem mudar a altura do cabeçalho ao carregar. */
  if (document.fonts) document.fonts.ready.then(medirCabecalho);
}

document.addEventListener("DOMContentLoaded", iniciar);
