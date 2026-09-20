# WUP.US — Portal de Solicitação e Acompanhamento

Projeto Integrador — I Unidade.
Integrantes: Henderson, Alan, Bruno, Davi.

## Como executar

Abra o arquivo `index.html` em um navegador atualizado. Não é preciso servidor,
instalação nem conexão com a internet — offline, apenas as fontes do Google são
substituídas pelas do sistema.

Com o Visual Studio Code, também é possível usar a extensão Live Server
(botão direito no `index.html` → "Open with Live Server").

## Estrutura

```
projeto/
├── index.html     estrutura e conteúdo
├── style.css      estilos e tokens de cor
├── script.js      catálogo, validação, cálculo, protocolo e consulta
├── README.md
└── img/           logo, favicon e ícones das categorias
```

## Como testar o fluxo completo

1. Em **Serviços**, filtre por categoria ou busque por "bateria".
2. Clique em **Solicitar este serviço** em qualquer card. O formulário abre com o
   equipamento e o serviço já preenchidos.
3. Preencha os dados. O painel **Estimativa**, ao lado, recalcula prazo e faixa de
   valor a cada alteração de serviço ou prioridade.
4. Envie. O protocolo aparece no modal de confirmação.
5. Em **Acompanhar serviço**, consulte o protocolo gerado. Dois protocolos de
   exemplo (`WUP-2026-0001` e `WUP-2026-0002`) já vêm cadastrados.

## Observações técnicas

- O andamento do serviço é **simulado**: a etapa atual é calculada pelo tempo
  decorrido desde a abertura, acelerado conforme a prioridade escolhida. O
  intervalo é a constante `MINUTOS_POR_ETAPA`, no topo do `script.js`. Reduza o
  valor para ver o protocolo avançar de etapa mais rápido durante a apresentação.
- As solicitações são guardadas no `localStorage` do navegador, sob as chaves
  `wupus:solicitacoes` e `wupus:contador`. O botão
  **Limpar dados deste navegador**, na seção de acompanhamento, restaura o estado
  inicial com os dois exemplos.
- Não há bibliotecas nem frameworks. Todo o código é autoral.
