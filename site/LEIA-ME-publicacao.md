# IFCE Challenge — landing page, formulários e publicação

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | A página inteira: HTML, CSS, JavaScript e o regulamento completo, num arquivo só |
| `Codigo.gs` | O código do Google Apps Script que recebe os formulários e grava na planilha |
| `img/logo-ifce.png` | A marca do IFCE, usada no bloco "Realização" e no rodapé |
| `regulamento-pokemon-tcg-ifce.md` | O regulamento em Markdown, fonte do texto embutido na página |

Todos os ícones, padrões e o selo do evento são desenhados em SVG/CSS dentro do `index.html`. As únicas coisas carregadas de fora são a fonte Open Sans (a tipografia oficial do manual da marca) e a miniatura do vídeo no YouTube.

---

## 1. Publicar a planilha e o Apps Script

1. Crie uma planilha no Google Sheets, ex.: **IFCE Challenge — Inscrições**.
2. Nela: **Extensões ▸ Apps Script**.
3. Apague o conteúdo de `Código.gs` e cole **todo** o arquivo `Codigo.gs`. Salve.
4. Na barra superior, selecione a função **`configurar`** e clique em **Executar**. Autorize quando o Google pedir. Isso grava o ID da planilha nas Propriedades do Script — nada fica escrito no código.
5. **Implantar ▸ Nova implantação ▸** (engrenagem) **App da Web**:
   - **Executar como:** Eu
   - **Quem pode acessar:** **Qualquer pessoa** ← obrigatório, senão o formulário não grava
6. Copie a **URL do app da Web** (termina em `/exec`).
7. No `index.html`, procure a primeira linha do `<script>` e cole a URL:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfy....../exec";
```

As abas **Inscrições** e **Dúvidas** nascem sozinhas no primeiro envio, com cabeçalho formatado.

> Alterou o `Codigo.gs` depois? Refaça a implantação em **Implantar ▸ Gerenciar implantações ▸ ✏️ ▸ Versão: Nova versão ▸ Implantar**. Isso mantém a mesma URL.

---

## 2. Publicar no GitHub Pages

1. Crie um repositório (ex.: `ifce-challenge`).
2. Suba **`index.html`** e a pasta **`img/`** na raiz do repositório. O `Codigo.gs`, o `.md` do regulamento e este arquivo podem ir junto — são só documentação.
3. **Settings ▸ Pages ▸ Source: Deploy from a branch ▸ Branch: `main` / `(root)` ▸ Save.**
4. Em um ou dois minutos a página fica no ar em `https://SEU-USUARIO.github.io/ifce-challenge/`.

Pontos de atenção:

- Todos os caminhos da página são **relativos** (`img/logo-ifce.png`), então funciona tanto na raiz quanto em subpasta de projeto. Não use caminhos iniciados por `/`.
- O GitHub Pages serve em **HTTPS**, que é o que o Apps Script exige. Um teste aberto direto do disco (`file://`) mostra o visual, mas o envio do formulário pode ser bloqueado pelo navegador.
- Se for usar domínio próprio, configure em **Settings ▸ Pages ▸ Custom domain** e mantenha **Enforce HTTPS** ligado.

### Teste depois de publicar

1. Abra a URL `/exec` do Apps Script no navegador: deve responder `{"ok":true,"servico":"IFCE Challenge — formularios"}`.
2. Faça uma inscrição de teste na página publicada e confira se a linha apareceu na planilha e se o e-mail de confirmação chegou.
3. Apague a linha de teste.

---

## 3. Segurança — o que já está resolvido

**Nada de senha no repositório.** O `Codigo.gs` não contém ID de planilha, e-mail nem token: esses valores ficam nas *Propriedades do Script*, dentro da sua conta Google. Você pode publicar o repositório sem medo.

**A URL do Apps Script não é uma chave.** Ela aparece no `index.html` porque o navegador precisa dela — não tem como esconder, e isso vale para qualquer solução desse tipo. Ela é apenas um endereço público que aceita POST, e as defesas ficam no servidor:

| Proteção | Como funciona |
|---|---|
| Campo-armadilha (*honeypot*) | Um campo invisível que só robô preenche. Se vier preenchido, o envio é descartado em silêncio. |
| Tempo mínimo de preenchimento | Envio em menos de 3 segundos após abrir a página é descartado. |
| Limite de tamanho | Corpo da requisição até 8 KB; cada campo é cortado em 300 caracteres (2000 nos campos longos). |
| Teto diário | No máximo 400 registros por dia, para conter envio automatizado em massa. |
| Validação no servidor | Campos obrigatórios, formato de e-mail e faixa de idade são conferidos de novo no Apps Script — nunca só no navegador. |
| Anti-fórmula na planilha | Texto começando com `=`, `+`, `-` ou `@` recebe um apóstrofo, para não virar fórmula ao abrir a planilha. |
| Sem vazamento de erro | As respostas de erro são genéricas; detalhes ficam só no log do Apps Script. |
| E-mail sem injeção | Todo dado do participante é escapado antes de entrar no HTML do e-mail de confirmação. |
| Aviso enxuto | O e-mail de aviso à organização não carrega dados pessoais — só diz que há registro novo. |

**Na página:** há uma política de segurança de conteúdo (CSP) que limita de onde a página pode carregar código, estilos, imagens e para onde pode enviar dados — só o Apps Script, o YouTube (sem cookies) e o Google Fonts. Nenhum script de terceiros, nenhum rastreador, nenhum cookie.

**Se a URL for abusada:** crie uma **nova implantação** no Apps Script (a antiga para de responder na hora) e atualize a constante `APPS_SCRIPT_URL` no `index.html`.

---

## 4. Proteção de dados pessoais (LGPD)

O formulário coleta nome, e-mail, telefone, data de nascimento e — para menores de 16 anos — nome e telefone do responsável. Sendo o IFCE um órgão público, vale seguir o básico:

- A página traz um **aviso de privacidade** e um **consentimento obrigatório** antes de concluir a inscrição, dizendo para que servem os dados e por quanto tempo ficam guardados.
- **Deixe a planilha restrita.** Em *Compartilhar*, mantenha o acesso apenas para as pessoas da organização. Nunca use "qualquer pessoa com o link".
- **Apague os dados depois do evento.** O `Codigo.gs` tem a função `limparDadosPosEvento` — rode pelo editor quando terminar, ou agende em *Acionadores*. O prazo anunciado na página é de 30 dias.
- **Não publique a planilha nem a classificação com dados pessoais.** Para divulgar resultados, use só o nome ou o nick.
- Se alguém pedir acesso, correção ou exclusão dos próprios dados, atenda — é direito garantido pela Lei nº 13.709/2018.

---

## 5. Trocar as imagens

A pasta `img/` guarda a marca. Hoje há um arquivo:

| Arquivo | Onde aparece |
|---|---|
| `img/logo-ifce.png` | Bloco "Realização", logo abaixo da dobra, e no rodapé |

Se o arquivo faltar, a página desenha sozinha um selo verde com "Instituto Federal do Ceará" no lugar — nada quebra.

A marca é sempre aplicada **sobre uma base branca**, como manda o Manual de Aplicação da Marca (página 19: em fundos coloridos ou instáveis, aplicar sobre base branca, respeitando a reserva de integridade). Por isso ela aparece dentro de uma placa clara, e não solta sobre o azul.

---

## 6. Mexer nas cores

Todas as cores estão em variáveis, no começo do `<style>` do `index.html`:

```css
--ifce:#46A151;    /* verde da marca, amostrado do PNG oficial */
--ifce-red:#CD3539;
--blue:#2F6BFF;    /* azul principal */
--cyan:#39D3FF;
--indigo:#6C4BFF;
--gold:#FFD24A;    /* botões e destaques */
--bg:#050817;      /* fundo */
```

Trocar esses seis valores repinta a página inteira.
