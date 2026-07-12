# UmbraAds — Prompts para Claude Design

> Como usar: cole o **Prompt 0 (Contexto)** primeiro na conversa do Claude Design. Depois, cole um prompt de tela por vez, na ordem que quiser construir. Cada prompt de tela já assume que o contexto foi enviado.

---

## PROMPT 0 — CONTEXTO DO PROJETO (colar primeiro)

```
Você vai criar as telas de um SaaS chamado UmbraAds — plataforma brasileira de espionagem de anúncios do Facebook Ads (Meta Ad Library). O público é afiliado, gestor de tráfego, dropshipper e infoprodutor brasileiro. Guarde este contexto para todas as telas que eu pedir a seguir.

IDENTIDADE VISUAL (seguir à risca):
- Tema dark premium. Fundo principal: zinc-950 (#09090b). Cards e painéis: zinc-900 (#18181b) com borda zinc-800 (#27272a), hover de borda zinc-700 (#3f3f46).
- Cor primária da marca: amber-500 (#f59e0b) — usada em botões primários, ícones de destaque, logo e no "Scale Score". Hover: amber-400 (#fbbf24). Realce pontual: amber-300 (#fcd34d).
- Textos: títulos em zinc-100 (#f4f4f5), corpo em zinc-300 (#d4d4d8), apoio em zinc-400 (#a1a1aa), labels em zinc-500 (#71717a).
- Semânticas: emerald-500/400 (#10b981/#34d399) = anúncio ATIVO, sucesso, crescimento. red-500/400 (#ef4444/#f87171) = anúncio MORTO, queda, erro. violet-500/400 (#8b5cf6/#a78bfa) = badge especial "Validada 30d+".
- Tipografia: Inter. Métricas e números sempre em peso semibold com tabular-nums.
- Cantos arredondados médios (rounded-xl nos cards, rounded-lg nos botões), sombras sutis, sem gradientes chamativos — o luxo é a sobriedade + o dourado.
- Logo: texto "UmbraAds" com "Umbra" em zinc-100 e "Ads" em amber-500.

CONCEITO-CHAVE DO PRODUTO:
- "Scale Score": pontuação de 0 a 100+ que mede o quanto uma oferta está escalando (variações ativas + crescimento 7d + dias no ar). Faixas: 0–30 "Fraco" (zinc-500), 31–70 "Aquecendo" (amber-400), 71+ "ESCALANDO" (amber-500 com badge pulsante).
- Status de anúncio: dot verde emerald = ativo, dot vermelho = morto/pausado.
- Métricas exibidas nos cards de anúncio: dias ativo, nº de variações ativas, Scale Score, país, tipo de criativo (vídeo/imagem/carrossel).

TOM DE COPY (todas as telas):
- Português brasileiro, direto, agressivo e confiante. Fala com quem roda tráfego.
- Anti-achismo: bordões como "chega de testar no escuro", "modele o que já vende", "dados, não achismo", "pare de queimar verba em criativo que não escala".
- Frases curtas. Verbos de comando. Zero corporativês.

APP SHELL (para todas as telas internas, exceto Landing e Login):
- Sidebar fixa à esquerda (largura ~240px, fundo zinc-900, borda direita zinc-800) com: logo UmbraAds no topo, itens de navegação (Dashboard, Ofertas Escaladas, Monitorando, Rastreados & Alertas, Ajustes) com ícones, item ativo com fundo zinc-800 e texto/ícone amber-500. No rodapé da sidebar: card pequeno com o plano do usuário ("Plano Pro" badge amber) e botão de upgrade.
- Topbar fina: breadcrumb à esquerda, à direita um sino de notificações com contador amber e avatar do usuário.
- Conteúdo com padding generoso sobre fundo zinc-950.
```

---

## PROMPT 1 — LANDING PAGE

```
Crie a LANDING PAGE do UmbraAds (página de vendas completa, dark, longa). Seções na ordem:

1) NAVBAR: logo UmbraAds à esquerda; links "Recursos", "Como funciona", "Planos", "FAQ"; à direita botão ghost "Entrar" e botão amber "Começar agora".

2) HERO: badge pequeno no topo "Biblioteca de anúncios da Meta exposta" (borda amber, texto amber-300). Headline gigante: "Espione as ofertas que estão ESCALANDO no Facebook agora". Sub: "Chega de testar criativo no escuro. Veja o que já está vendendo, modele os vencedores e lance campanhas com dados — não com achismo." CTA primário amber "Quero ver as ofertas" + CTA secundário ghost "Ver recursos". Abaixo: "Garantia de 7 dias • Cancele quando quiser". Ao lado/abaixo do texto, um mockup do dashboard dentro de um frame de navegador com a barra de URL "app.umbraads.com.br".

3) BARRA DE PROVA (4 stats em linha, números grandes amber, label zinc-400): "2.300+ anúncios rastreados", "480+ ofertas escaladas", "Monitoramento 24/7", "Foco total no Brasil".

4) SEÇÃO DOR: título "Pare de pagar caro pra descobrir o que não funciona." Texto curto: enquanto você queima verba testando, tem gente só modelando o que já escala. Grid comparativo simples "Sem UmbraAds vs Com UmbraAds" (coluna esquerda com X vermelhos, direita com checks emerald).

5) DEMONSTRAÇÃO: título "O feed que os gestores não querem que você veja". Grid com 3 cards de anúncio de exemplo (thumb do criativo, nome da página, dot emerald "ativo", "42 dias no ar", "27 variações", Scale Score 84 em amber com badge ESCALANDO). O terceiro card levemente borrado com cadeado e texto "Desbloqueie o feed completo".

6) COMO FUNCIONA (3 passos numerados, número gigante amber):
01 "Descubra" — abra o feed de ofertas escaladas e filtre pelo seu nicho.
02 "Estude" — copy completa, variações, tempo no ar e histórico de escala de cada anúncio.
03 "Modele e lance" — adapte o vencedor pro seu produto e suba com chance real de escalar.

7) RECURSOS (grid 2x3 de cards zinc-900, ícone amber):
- "Ofertas escaladas em tempo real" — veja o que tá bombando e quantos criativos cada oferta roda.
- "Scale Score" — nossa pontuação exclusiva que separa oferta validada de fogo de palha.
- "Monitoramento contínuo" — marque uma oferta e a gente re-verifica todo dia por você.
- "Rastreie concorrentes" — alerta na hora que uma página subir criativo novo.
- "Busca avançada" — nicho, país, formato, tempo no ar, nº de variações.
- "Histórico de escala" — gráfico da evolução de anúncios ativos de cada página.

8) DEPOIMENTOS: título "Quem parou de chutar". 4 cards com citação curta, métrica de resultado em destaque amber (ex.: "CPA −31%", "R$ 120k/mês", "8h/semana economizadas", "3x ROAS"), avatar com iniciais, nome e função (gestor de tráfego, infoprodutora, agência, dropshipper). Usar nomes e números claramente ilustrativos.

9) PLANOS (3 cards, o do meio "Pro" em destaque com borda amber e badge "Popular"):
- Básico R$47/mês: 50 buscas/dia, 15 ofertas monitoradas, feed completo.
- Pro R$97/mês: buscas ilimitadas, 50 monitoradas, 15 rastreios com alertas, histórico 90 dias.
- Elite R$197/mês: tudo ilimitado, 50 rastreios, export CSV, histórico completo, acesso antecipado a novos recursos.
Rodapé da seção: "Pagamento via Pix, cartão ou boleto • Garantia incondicional de 7 dias".

10) FAQ (accordion, 6 perguntas): De onde vêm os dados? / Preciso saber rodar tráfego? / Funciona pro meu nicho? / Quantos anúncios entram por dia? / Posso cancelar quando quiser? / Tem garantia?

11) CTA FINAL: fundo zinc-900, título "Pronto pra parar de queimar verba?", sub "Entre pro lado dos que escalam com dados.", botão amber grande "Quero meu acesso".

12) FOOTER: logo, tagline "Inteligência de anúncios pra quem escala.", colunas Produto/Suporte/Legal, aviso "Dados públicos da Biblioteca de Anúncios da Meta" e copyright.
```

---

## PROMPT 2 — LOGIN

```
Crie a tela de LOGIN do UmbraAds. Fundo zinc-950 com um brilho amber muito sutil e difuso atrás do card central. Card zinc-900, borda zinc-800, rounded-xl, largura ~420px, centralizado vertical e horizontalmente.

Dentro do card: logo UmbraAds centralizado no topo; título "Bem-vindo de volta"; sub em zinc-400 "Entra aí e vai direto pro feed de ofertas."; campo E-mail e campo Senha (inputs fundo zinc-950, borda zinc-800, focus com borda amber-500); link "Esqueci minha senha" à direita em zinc-400; botão primário amber full-width "Entrar"; divisor "ou"; botão secundário full-width com borda zinc-700 "Continuar com Google" (ícone do Google); rodapé do card: "Ainda não tem conta?" + link amber "Criar conta grátis".

Abaixo do card, fora dele, texto pequeno zinc-500: "Ao entrar você concorda com os Termos de Uso e a Política de Privacidade."

Incluir também o estado alternativo de CADASTRO no mesmo layout (Nome, E-mail, Senha, botão "Criar minha conta") como segunda variação.
```

---

## PROMPT 3 — DASHBOARD

```
Crie a tela DASHBOARD do UmbraAds usando o app shell (sidebar + topbar) do contexto. Item ativo da sidebar: Dashboard.

Cabeçalho da página: "Fala, Cicero 👋" + sub zinc-400 "Isso é o que tá escalando enquanto você dormia."

1) LINHA DE STATS (4 cards zinc-900 lado a lado): "Ofertas escalando hoje: 37" (ícone chama amber, variação +12% emerald), "Novos anúncios de páginas rastreadas: 9" (ícone olho), "Alertas não lidos: 4" (ícone sino, número em amber), "No seu radar: 12 ofertas" (ícone alvo).

2) SEÇÃO "TOP ESCALANDO AGORA" (título + link "ver todas →" em amber): grid com 6 mini-cards de anúncio, cada um com thumbnail do criativo, nome da página, dot emerald, "31 dias no ar", "18 variações" e Scale Score grande no canto (ex.: 92, 87, 81...) com badge ESCALANDO nos acima de 70.

3) DUAS COLUNAS ABAIXO:
- Esquerda "Alertas recentes": lista de 5 itens, cada um com ícone por tipo (sino amber = criativo novo, seta emerald = explosão de variações, caveira/x red = oferta morta), texto tipo "Página 'Achadinhos da Bia' subiu 12 anúncios novos" e timestamp "há 2h". Itens não lidos com borda esquerda amber.
- Direita "Mudanças no seu radar": lista de 4 ofertas monitoradas que mudaram, com thumb pequena, nome, e a mudança destacada: "27 → 41 variações" em emerald ou "18 → 6 variações" em red, com o novo status (Validada emerald / Morta red / Observando amber).

Estado de exemplo preenchido com dados fictícios realistas de nichos BR (achadinhos, emagrecimento, renda extra, pet, beleza).
```

---

## PROMPT 4 — OFERTAS ESCALADAS (feed principal)

```
Crie a tela OFERTAS ESCALADAS do UmbraAds usando o app shell. Item ativo: Ofertas Escaladas.

Cabeçalho: título "Ofertas Escaladas" + sub zinc-400 "O que tá vendendo agora — modele antes que sature."

BARRA DE FILTROS (sticky, fundo zinc-900, borda zinc-800): campo de busca por palavra-chave com ícone de lupa; selects: Nicho, País (default "Brasil"), Formato (Vídeo/Imagem/Carrossel), Status (Ativo/Morto/Todos); slider "Dias no ar" (0–90+); input numérico "Mín. de variações"; select de ordenação "Scale Score ↓" (opções: Scale Score, Mais recente, Há mais tempo no ar). Chips de filtros ativos abaixo da barra, removíveis com X. Botão ghost "Limpar filtros".

GRID DE ANÚNCIOS (3 colunas desktop): 9 cards. Cada card zinc-900:
- Topo: thumbnail do criativo 16:9 com badge do formato no canto (▶ Vídeo / 🖼 Imagem / ⧉ Carrossel) e o Scale Score num selo amber no canto superior direito.
- Corpo: nome da página em zinc-100, dot de status + "Ativo há 38 dias" em zinc-400, linha de métricas: "24 variações" + seta de tendência (↑ emerald ou ↓ red) + país "BR".
- Primeira linha da copy do anúncio em zinc-400 truncada ("Você não vai acreditar no que essa fritadeira faz…").
- Rodapé: botão ghost "Ver detalhes" + dois ícones de ação rápida: olho (Monitorar) e sino (Rastrear página), com tooltip.
Variar os exemplos: Scale Scores 94, 88, 76 (badge ESCALANDO), 62, 55 (Aquecendo), 23 (Fraco), um card com dot red "Morto há 3 dias".

Rodapé: botão "Carregar mais" centralizado.

Incluir também uma faixa fina acima do grid para usuário do plano Básico: "12/50 buscas usadas hoje" com barra de progresso amber e link "Fazer upgrade".
```

---

## PROMPT 5 — DETALHE DO ANÚNCIO

```
Crie a tela DETALHE DO ANÚNCIO do UmbraAds usando o app shell. Breadcrumb: Ofertas Escaladas / Detalhe.

Layout em 2 colunas:

COLUNA ESQUERDA (~55%):
- Player/preview grande do criativo (vídeo com botão play centralizado sobre thumbnail).
- Abaixo, faixa "Variações ativas (24)": carrossel horizontal de thumbnails pequenas, a selecionada com borda amber.
- Abaixo, card "Evolução da página": gráfico de linha (área com preenchimento amber translúcido) mostrando nº de anúncios ativos da página nos últimos 60 dias, com anotação no pico.

COLUNA DIREITA (~45%):
- Cabeçalho: nome da página "Achadinhos da Bia" com avatar, dot emerald "Ativo há 38 dias", botão ghost pequeno "Ver todos da página →".
- CARD DE MÉTRICAS (destaque): Scale Score gigante "88" em amber com badge ESCALANDO pulsante; abaixo, 3 métricas menores: "24 variações ativas (↑ +9 esta semana em emerald)", "38 dias no ar", "País: BR".
- CARD COPY: título "Copy do anúncio" + botão "Copiar" (ao clicar vira check emerald "Copiado!"). Texto completo da copy fictícia estilo TikTok/Facebook agressivo, com emojis.
- CARD INFO: CTA do anúncio ("Saiba mais"), link da landing com botão de abrir em nova aba, idioma PT-BR, formato Vídeo, nicho "Casa & Cozinha", primeira veiculação "02/06/2026".
- AÇÕES (fixas no fim da coluna): botão primário amber full "👁 Monitorar esta oferta" + botão secundário "🔔 Rastrear esta página".

SEÇÃO INFERIOR (largura total): "Mais anúncios desta página" — grid com 4 cards compactos no mesmo padrão do feed.
```

---

## PROMPT 6 — MONITORANDO

```
Crie a tela MONITORANDO do UmbraAds usando o app shell. Item ativo: Monitorando.

Cabeçalho: "Monitorando" + sub zinc-400 "A gente re-verifica essas ofertas todo dia. Você só age quando mudar." À direita: contador de uso "12 de 50 ofertas" (plano Pro) com barra fina amber.

FILTROS: tabs/pills por status — Todas (12), Observando (7, amber), Validadas (3, emerald), Mortas (2, red) — e select de ordenação "Última mudança".

TABELA/LISTA (rows zinc-900 com hover zinc-800, separadas por borda zinc-800). Colunas:
- Criativo: thumb pequena + nome da página + primeira linha da copy truncada.
- Status: badge Observando (amber) / Validada 30d+ (emerald, com ícone de check) / Morta (red).
- Dias no ar: número tabular.
- Variações: número + tendência da semana ("41 ↑ +14" emerald / "6 ↓ −12" red).
- Scale Score: selo pequeno com a cor da faixa.
- Nota: texto curto do usuário em zinc-400 itálico ("testar ângulo do frete grátis") — editável ao clicar (ícone lápis).
- Ações: ícone de abrir detalhe + ícone de lixeira (remover, hover red).

Incluir 6–8 linhas de exemplo variadas, incluindo uma linha destacada com fundo levemente red/10 de oferta que MORREU ontem (para mostrar o alerta visual) e uma com fundo emerald/10 que acabou de virar Validada.

ESTADO VAZIO (segunda variação da tela): ilustração simples de radar, título "Seu radar tá vazio", texto "Marque ofertas no feed pra gente vigiar por você." e botão amber "Explorar ofertas escaladas".
```

---

## PROMPT 7 — RASTREADOS & ALERTAS

```
Crie a tela RASTREADOS & ALERTAS do UmbraAds usando o app shell. Item ativo: Rastreados & Alertas. Duas TABS no topo: "Rastreados" e "Alertas" (contador 4 em amber na tab Alertas).

TAB RASTREADOS:
- Card de adicionar no topo: input "Cole o link ou ID da página do Facebook… ou digite uma palavra-chave" + select tipo (Página/Palavra-chave) + botão amber "Rastrear". Abaixo, contador "5 de 15 rastreios" (plano Pro).
- Lista de rastreios: cada row com ícone (📄 página / 🔎 keyword), nome ("Achadinhos da Bia" ou "fritadeira elétrica"), meta info "Rastreando há 12 dias • 23 alertas gerados", toggle on/off amber e ícone de lixeira.
- 5 exemplos variados de nichos BR.

TAB ALERTAS (mostrar como segunda variação ou seção):
- Cabeçalho da lista: filtro por tipo (Todos / Criativo novo / Explosão / Oferta morta) + botão ghost "Marcar todos como lidos".
- Feed cronológico agrupado por dia ("Hoje", "Ontem", "Esta semana"). Cada alerta é um card fino: ícone por tipo (sino amber = novos criativos, foguete emerald = explosão de variações, caveira red = oferta morta), texto tipo "🔔 'Achadinhos da Bia' subiu 12 anúncios novos" / "🚀 Oferta 'Escova Alisadora 3 em 1' explodiu: 8 → 31 variações" / "💀 Oferta 'Curso Renda Zap' morreu após 51 dias", timestamp, e botão ghost "Ver anúncios →". Não lidos com borda esquerda amber e fundo zinc-900 um pouco mais claro.
- 7–8 alertas de exemplo.
```

---

## PROMPT 8 — AJUSTES

```
Crie a tela AJUSTES do UmbraAds usando o app shell. Item ativo: Ajustes.

Layout com navegação interna à esquerda (lista vertical: Conta, Plano & Uso, Preferências, Sessões) e conteúdo à direita. Mostrar a seção PLANO & USO como principal:

- Card do plano atual: badge "PRO" em amber, "R$97/mês • renova em 08/08/2026", botões "Fazer upgrade pro Elite" (amber) e "Gerenciar assinatura" (ghost).
- Card de uso com 3 barras de progresso: Buscas hoje "∞ ilimitado" (barra cheia amber com ícone infinito), Ofertas monitoradas "12/50", Rastreios "5/15". Labels zinc-400.
- Card comparativo compacto Pro vs Elite com 4 diferenças e CTA.

Seção CONTA (segunda variação): campos E-mail (readonly com botão alterar), Alterar senha (senha atual + nova), e zona de perigo no fim: card com borda red-500/40, título "Zona de perigo", botão outline red "Excluir minha conta".

Seção PREFERÊNCIAS (terceira variação): select "País padrão das buscas: Brasil", multi-select de chips "Nichos favoritos" (achadinhos, beleza, pet, renda extra, casa & cozinha — chips selecionados com fundo amber/15 e borda amber), toggle "Receber alertas por e-mail" com badge "Em breve" violet.
```

---

## Dica de uso no Claude Design

1. Cole o Prompt 0 e espere confirmar o contexto.
2. Construa na ordem: **4 (Ofertas) → 5 (Detalhe) → 3 (Dashboard)** — são as telas que definem a cara do produto; as outras herdam os componentes.
3. Landing por último: aproveite os cards de anúncio já criados como mockup do hero.
4. Se alguma tela sair fora da paleta, responda só: "Refaça seguindo o contexto: fundo zinc-950, cards zinc-900 borda zinc-800, primária amber-500 (#f59e0b)."
