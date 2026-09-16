/**
 * IFCE Challenge — Pokémon TCG
 * Backend dos formulários da landing page (Google Apps Script + Planilha Google).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SEGURANÇA — leia antes de publicar o repositório
 * ─────────────────────────────────────────────────────────────────────────────
 * Este arquivo foi escrito para poder ser versionado num repositório PÚBLICO
 * (GitHub Pages): ele NÃO contém ID de planilha, e-mail, token nem qualquer
 * outro dado sensível. Isso tudo fica nas PROPRIEDADES DO SCRIPT, que vivem na
 * conta do Google e nunca saem de lá.
 *
 * Configure uma única vez, no editor do Apps Script:
 *   selecione a função  configurar  na barra superior e clique em Executar.
 *   Ela cadastra a planilha ativa e, se você descomentar a linha, o e-mail de aviso.
 *   (Ou manualmente: Configurações do projeto > Propriedades do script.)
 *
 * A URL do App da Web (/exec) FICA VISÍVEL no index.html — isso é inerente ao
 * modelo e não é uma senha, apenas um endereço público que aceita POST. Por isso
 * a proteção real está aqui dentro: validação, limites de tamanho, campo-armadilha,
 * tempo mínimo de preenchimento e teto diário de registros. Se algum dia a URL for
 * abusada, crie uma NOVA implantação (a antiga deixa de responder) e atualize a
 * constante APPS_SCRIPT_URL no index.html.
 */

/* ═══════════════════════════ CONFIGURAÇÃO ═══════════════════════════ */

/** Roda ao abrir a planilha: cria o menu "IFCE Challenge" com os botões de administração. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IFCE Challenge')
    .addItem('Configurar planilha', 'configurarPeloMenu')
    .addSeparator()
    .addItem('Apagar todos os dados (pós-evento)', 'limparDadosPeloMenu')
    .addToUi();
}

/** Rode uma vez, pelo editor, com a planilha já criada. */
function configurar() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('PLANILHA_ID', SpreadsheetApp.getActiveSpreadsheet().getId());
  // Descomente e ajuste para receber um aviso a cada envio:
  // props.setProperty('EMAIL_ORGANIZACAO', 'organizacao@ifce.edu.br');
  Logger.log('Configurado. Planilha: ' + props.getProperty('PLANILHA_ID'));
}

/** Mesma configuração acima, mas chamada pelo botão do menu, com aviso visível na tela. */
function configurarPeloMenu() {
  configurar();
  var id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  SpreadsheetApp.getUi().alert('Planilha configurada!\nID registrado: ' + id);
}

var LIMITES = {
  campo: 300,          // caracteres por campo comum
  mensagem: 2000,      // caracteres dos campos longos
  corpo: 8000,         // bytes do corpo da requisição
  porDia: 400,         // teto de registros por dia (anti-flood)
  tempoMinimoMs: 3000  // preenchimento humano leva mais que isso
};

var ABAS = {
  inscricao: {
    nome: 'Inscrições',
    // Colunas novas entram sempre NO FIM das duas listas: as linhas já gravadas
    // continuam alinhadas com os cabeçalhos antigos.
    colunas: ['Carimbo de data/hora', 'Nome completo', 'E-mail', 'WhatsApp', 'Data de nascimento',
              'Idade no evento', 'Vínculo', 'Modalidades', 'Nick TCG Live', 'Experiência',
              'Responsável (nome)', 'Responsável (telefone)', 'Observações',
              'Aceitou o regulamento', 'Consentiu (LGPD)', 'Autoriza imagem',
              'Palestra (8h)', 'Trilha (9h15 – 11h30)'],
    campos: [null, 'nome', 'email', 'whatsapp', 'nascimento',
             'idade_no_evento', 'vinculo', 'modalidades', 'nick', 'experiencia',
             'responsavel_nome', 'responsavel_contato', 'observacoes',
             'aceite_regulamento', 'consentimento_lgpd', 'autoriza_imagem',
             'palestra', 'trilha'],
    obrigatorios: ['nome', 'email', 'whatsapp', 'nascimento', 'vinculo', 'trilha']
  },
  duvida: {
    nome: 'Dúvidas',
    colunas: ['Carimbo de data/hora', 'Nome', 'E-mail', 'Mensagem'],
    campos: [null, 'nome', 'email', 'mensagem'],
    obrigatorios: ['nome', 'email', 'mensagem']
  }
};

/* ═══════════════════════════ ENDPOINTS ═══════════════════════════ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(20000)) return json_({ ok: false, error: 'ocupado' });

    var bruto = (e && e.postData && e.postData.contents) || '';
    if (bruto.length > LIMITES.corpo) return json_({ ok: false, error: 'corpo grande demais' });

    var dados;
    try { dados = JSON.parse(bruto); } catch (err) { return json_({ ok: false, error: 'json invalido' }); }
    if (!dados || typeof dados !== 'object') return json_({ ok: false, error: 'payload invalido' });

    // Campo-armadilha: só um robô preenche um campo escondido.
    if (String(dados.apelido || '').length > 0) return json_({ ok: true });
    // Tempo mínimo entre abrir a página e enviar.
    if (Number(dados._ms) >= 0 && Number(dados._ms) < LIMITES.tempoMinimoMs) return json_({ ok: true });

    var tipo = String(dados.form || 'inscricao').toLowerCase();
    var cfg = ABAS[tipo];
    if (!cfg) return json_({ ok: false, error: 'formulario desconhecido' });

    var limpo = higienizar_(dados, cfg);
    var faltando = cfg.obrigatorios.filter(function (c) { return !limpo[c]; });
    if (faltando.length) return json_({ ok: false, error: 'campos obrigatorios ausentes' });
    if (!validarEmail_(limpo.email)) return json_({ ok: false, error: 'e-mail invalido' });
    // Modalidades e experiência só existem para quem escolheu a trilha do Pokémon TCG;
    // quem vai à oficina de robótica ou só à palestra manda esses campos vazios.
    if (tipo === 'inscricao' && ehTrilhaTCG_(limpo.trilha) && (!limpo.modalidades || !limpo.experiencia)) {
      return json_({ ok: false, error: 'campos obrigatorios ausentes' });
    }

    var aba = pegarAba_(cfg);
    if (excedeuTetoDiario_(aba)) return json_({ ok: false, error: 'limite diario atingido' });
    if (tipo === 'inscricao' && jaInscrito_(aba, limpo.email)) return json_({ ok: true, duplicado: true });

    aba.appendRow(cfg.campos.map(function (campo) {
      if (campo === null) return new Date();
      return limpo[campo] === undefined ? '' : limpo[campo];
    }));

    if (tipo === 'inscricao') enviarConfirmacao_(limpo);
    notificarOrganizacao_(tipo);

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'erro interno' });   // sem detalhes para fora
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Teste de vida. Não expõe dados nem contagens. */
function doGet() {
  return json_({ ok: true, servico: 'IFCE Challenge — formularios' });
}

/* ═══════════════════════════ VALIDAÇÃO ═══════════════════════════ */

/** Corta, limita e normaliza cada campo. Nada entra na planilha sem passar por aqui. */
function higienizar_(dados, cfg) {
  var out = {};
  cfg.campos.forEach(function (campo) {
    if (campo === null) return;
    var v = dados[campo];
    if (v === undefined || v === null) { out[campo] = ''; return; }
    if (typeof v === 'number' || typeof v === 'boolean') { out[campo] = v; return; }
    var lim = (campo === 'mensagem' || campo === 'observacoes') ? LIMITES.mensagem : LIMITES.campo;
    // remove caracteres de controle e corta no limite
    v = String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, lim);
    // impede que o texto seja interpretado como fórmula ao abrir a planilha
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    out[campo] = v;
  });
  if (out.email) out.email = String(out.email).toLowerCase();
  if (out.idade_no_evento !== undefined) {
    var idade = parseInt(out.idade_no_evento, 10);
    out.idade_no_evento = (idade >= 0 && idade <= 120) ? idade : '';
  }
  return out;
}

function validarEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || ''));
}

/** A trilha do TCG é a única que usa modalidades, nick e experiência. */
function ehTrilhaTCG_(trilha) {
  return String(trilha || '').toLowerCase().indexOf('tcg') !== -1;
}

/* ═══════════════════════════ PLANILHA ═══════════════════════════ */

function planilha_() {
  var id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function pegarAba_(cfg) {
  var ss = planilha_();
  var aba = ss.getSheetByName(cfg.nome);
  if (!aba) {
    aba = ss.insertSheet(cfg.nome);
    aba.appendRow(cfg.colunas);
    aba.getRange(1, 1, 1, cfg.colunas.length)
       .setFontWeight('bold').setBackground('#46A151').setFontColor('#FFFFFF');
    aba.setFrozenRows(1);
    aba.setColumnWidths(1, cfg.colunas.length, 160);
  } else {
    // A aba já existia de uma versão anterior do formulário: completa os cabeçalhos
    // que faltam no fim, senão as colunas novas chegam sem título na planilha.
    var largura = aba.getLastColumn();
    if (largura < cfg.colunas.length) {
      var novas = cfg.colunas.length - largura;
      aba.getRange(1, largura + 1, 1, novas)
         .setValues([cfg.colunas.slice(largura)])
         .setFontWeight('bold').setBackground('#46A151').setFontColor('#FFFFFF');
      aba.setColumnWidths(largura + 1, novas, 160);
    }
  }
  return aba;
}

/** Teto simples de registros no dia, para conter envio automatizado em massa. */
function excedeuTetoDiario_(aba) {
  var ultima = aba.getLastRow();
  if (ultima < 2) return false;
  var inicio = Math.max(2, ultima - LIMITES.porDia + 1);
  var datas = aba.getRange(inicio, 1, ultima - inicio + 1, 1).getValues();
  var hoje = new Date().toDateString();
  var doDia = datas.filter(function (d) {
    return d[0] instanceof Date && d[0].toDateString() === hoje;
  }).length;
  return doDia >= LIMITES.porDia;
}

function jaInscrito_(aba, email) {
  var ultima = aba.getLastRow();
  if (ultima < 2 || !email) return false;
  var col = aba.getRange(2, 3, ultima - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim().toLowerCase() === email) return true;
  }
  return false;
}

/* ═══════════════════════════ E-MAILS ═══════════════════════════ */

function enviarConfirmacao_(d) {
  if (!d.email) return;
  try {
    var menor = Number(d.idade_no_evento) < 16;
    var tcg = ehTrilhaTCG_(d.trilha);
    var local = tcg ? 'Laboratório de Informática 2'
              : (String(d.trilha || '').toLowerCase().indexOf('rob') !== -1 ? 'Laboratório de Informática 1' : '—');
    var corpo =
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#16202B">' +
      '<h2 style="color:#46A151;margin-bottom:.2em">Inscrição confirmada</h2>' +
      '<p>Olá, <b>' + escapar_(d.nome) + '</b>! Sua inscrição no <b>IFCE Challenge</b> foi registrada.</p>' +
      '<table style="border-collapse:collapse;margin:1em 0;font-size:14px">' +
        linha_('Data', 'Sábado, 19 de setembro de 2026') +
        linha_('Local', 'IFCE Campus Horizonte') +
        linha_('Palestra (8h – 9h)', d.palestra === 'Sim' ? 'Sim, vou assistir' : 'Não vou assistir') +
        linha_('Sua trilha (9h15 – 11h30)', escapar_(d.trilha) + (local === '—' ? '' : ' — ' + local)) +
        (tcg ? linha_('Atividades no TCG', escapar_(d.modalidades)) : '') +
      '</table>' +
      '<p>A entrada é gratuita e <b>não há premiação</b>: o evento é de integração e aprendizado.</p>' +
      '<p>O check-in das trilhas é feito no laboratório entre <b>9h15 e 9h25</b>. Quem chegar depois fica fora do ' +
      'pareamento da primeira rodada do torneio.</p>' +
      (menor
        ? '<p style="background:#FFF8E1;border-left:4px solid #FFD24A;padding:10px 14px">' +
          '<b>Atenção:</b> por ter menos de 16 anos, a participação só é possível acompanhado do responsável (' +
          escapar_(d.responsavel_nome) + '), que deve permanecer no campus durante todo o evento e assinar a ' +
          'autorização na recepção.</p>'
        : '') +
      '<p>Chegue com alguns minutos de antecedência. Se for jogar no TCG Live, <b>venha com a conta já criada</b> ' +
      'e saiba seu nick.</p>' +
      '<p style="color:#5A6676;font-size:12px">Organização do IFCE Challenge — IFCE Campus Horizonte.<br>' +
      'Seus dados são usados apenas para organizar este evento e são eliminados em até 30 dias após a realização.</p>' +
      '</div>';

    MailApp.sendEmail({
      to: d.email,
      subject: 'Inscrição confirmada — IFCE Challenge (19/09, a partir das 8h)',
      htmlBody: corpo
    });
  } catch (err) {
    console.warn('Falha ao enviar confirmação: ' + err);
  }
}

/** Aviso enxuto para a organização — sem despejar dados pessoais no e-mail. */
function notificarOrganizacao_(tipo) {
  var destino = PropertiesService.getScriptProperties().getProperty('EMAIL_ORGANIZACAO');
  if (!destino) return;
  try {
    MailApp.sendEmail(
      destino,
      tipo === 'duvida' ? 'Nova dúvida — IFCE Challenge' : 'Nova inscrição — IFCE Challenge',
      'Há um novo registro na planilha do evento.\n\n' +
      'Formulário: ' + tipo + '\n' +
      'Recebido em: ' + new Date().toLocaleString('pt-BR') + '\n\n' +
      'Abra a planilha para ver os detalhes.'
    );
  } catch (err) {
    console.warn('Falha ao notificar organização: ' + err);
  }
}

/* ═══════════════════════════ UTILITÁRIOS ═══════════════════════════ */

/** Apaga os dados pessoais depois do evento (LGPD). Rode manualmente ou agende. */
function limparDadosPosEvento() {
  Object.keys(ABAS).forEach(function (tipo) {
    var aba = planilha_().getSheetByName(ABAS[tipo].nome);
    if (aba && aba.getLastRow() > 1) {
      aba.deleteRows(2, aba.getLastRow() - 1);
    }
  });
  Logger.log('Dados pessoais removidos das abas do evento.');
}

/** Mesma limpeza acima, mas chamada pelo botão do menu, com confirmação antes de apagar. */
function limparDadosPeloMenu() {
  var ui = SpreadsheetApp.getUi();
  var resposta = ui.alert(
    'Apagar todos os dados?',
    'Isso vai APAGAR PERMANENTEMENTE todas as inscrições e dúvidas registradas até agora. ' +
    'Essa ação não pode ser desfeita. Use apenas depois que o evento já tiver acontecido.\n\n' +
    'Deseja continuar?',
    ui.ButtonSet.YES_NO
  );
  if (resposta !== ui.Button.YES) return;
  limparDadosPosEvento();
  ui.alert('Pronto. Todos os dados foram apagados.');
}

function linha_(rotulo, valor) {
  return '<tr><td style="padding:4px 12px 4px 0;color:#5A6676">' + rotulo +
         '</td><td style="padding:4px 0"><b>' + valor + '</b></td></tr>';
}

function escapar_(v) {
  return String(v == null ? '' : v).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
