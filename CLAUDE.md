@AGENTS.md

# Vistoria Rápida (vistoriarapida.digital) — regras do projeto

SaaS de vistoria digital de veículos que substitui a ficha de papel (FOR 044) usada por oficinas,
funilarias, autocentros, guinchos e associações na CHEGADA e na ENTREGA do veículo.
Dono: Frederico Crispim (administrador da plataforma). **Ele não é programador**: explique cada
decisão em linguagem simples, um passo de cada vez, e diga exatamente o que ele precisa fazer
quando depender dele. Guia completo: `Guia_Claude_Code_SaaS_Vistoria_v3.pdf` (30 prompts, fases A–H).

## Quem usa
Pessoas leigas (recepcionista, mecânico, motorista de guincho), com pressa, no pátio, ao sol, mão suja,
celular simples e internet fraca. O app deve ser EXTREMAMENTE simples na tela e rigoroso por baixo
(o documento pode servir de prova para dono do carro, seguradora e juiz).

## As 15 regras de ouro (valem para TODAS as telas, sem exceção)
1. Uma tarefa por tela; um único botão principal, grande, verde, fixo embaixo, ao alcance do polegar (`BotaoPrincipal fixo`).
2. Botões com no mínimo 56 px de altura (`min-h-toque`), texto 17–18 px, contraste alto, legível ao sol.
3. Ícone sempre acompanhado de palavra; verbos claros ("Tirar foto", "Próximo", "Enviar para o cliente").
4. Linguagem do pátio, sem termos técnicos. TODO texto da interface vem de `lib/textos.ts`.
5. Digitar o mínimo: botões grandes de escolha (`SeletorGrande`), listas com busca, preenchimento automático, ditado por voz.
6. Teclado certo para cada campo (maiúsculas na placa, numérico no km, telefone no telefone, e-mail no e-mail).
7. Salvar automaticamente a cada toque; funcionar sem internet; nunca perder o que foi feito.
8. Barra de etapas ("Passo 2 de 5 – Fotos") e botão Voltar sempre visíveis (`BarraEtapas`).
9. Erros dizem o que fazer, no próprio campo, e levam até o problema. Nunca mensagens técnicas.
10. Confirmação só para o irreversível (concluir, excluir: `ConfirmacaoImportante`); o resto com "Desfazer" (`avisarComDesfazer`).
11. Mostrar como fazer: silhuetas, exemplos e botão "Ajuda" com dica curta em cada etapa (`AjudaRapida`).
12. Rápido: abrir em menos de 3 s no 4G; iniciar vistoria em 2 toques; vistoria completa em ~3 minutos.
13. Visual profissional e consistente, sem emojis, com a logo e a cor da oficina.
14. Cada papel vê só o que precisa (vistoriador só faz vistoria; configurações/cobrança/relatórios para dono/gerente).
15. Acessível: rótulos para leitor de tela, foco visível, contraste AA, áreas de toque grandes. Nenhuma tela está pronta antes de um leigo conseguir usá-la sozinho.

## Padrão visual (Prompt 02, revisado: moderno e enxuto)
Quem usa são mecânicos, muitos com pouca instrução: QUANTO MAIS SIMPLES, MELHOR.
- Pouco texto: frases de 2 a 6 palavras. Nada de explicação longa na tela. Ícone grande + palavra.
- Fundo branco, blocos em cinza claro (`bg-superficie`), sem bordas desnecessárias, cantos bem arredondados (rounded-2xl/3xl).
- Botão principal 64 px (`min-h-toque-grande`), demais toques no mínimo 56 px (`min-h-toque`). Fonte base 18 px; títulos grandes e grossos (font-extrabold).
- Componentes em `components/vf/` (importe de `@/components/vf`). Veja as telas de exemplo em `/estilo`. Não crie botões/campos soltos.
- MARCA (renomeada em 30/10/2026): nome "Vistoria Rápida" + ".digital" em verde abaixo + bandeira do Brasil em SVG (`BandeiraBrasil`) ao lado do nome; logotipo = círculo azul com 4 quadradinhos (3 claros, 1 verde): componente `LogoProduto` e `app/icon.svg`. Cores da marca: azul #2563eb e verde #22b573 (`marca-azul`, `marca-verde`). O verde dos botões com texto branco é mais escuro (#13865a) para dar contraste.
- Cores: `oficina` (cor da oficina, padrão azul), `acao` (verde), `perigo` (vermelho: SÓ erro/avaria), `atencao` (amarelo); versões `-clara` para fundos. Tokens em `app/globals.css`.
- Modo sol: classe `.sol` no `<html>`, ligado por `BotaoModoSol`.
- Mobile-first; testar sempre em 360 px. Formatação de placa/telefone/km em `lib/formatos.ts`; Pix em `lib/pix.ts` (com testes).

## Vocabulário (Anexo B)
CHEGOU CARRO / ENTREGAR CARRO (internamente ENTRADA/SAIDA), Vistoria, Fotos, Riscos e amassados,
Pneus e itens, Assinar, Enviar para o cliente, Termo de vistoria (PDF), Veículos no pátio,
Equipe, Minha oficina, Meu plano, Ajuda. Evite: check-in, upload, dashboard, sincronizando, submeter.

## Requisitos gerais
- Multiempresa (cada oficina com usuários e dados isolados) e várias unidades por empresa.
- Usuários: ADMINISTRADOR DA PLATAFORMA (Frederico Crispim) em `/admin`; usuários das oficinas (dono, gerente, vistoriador); público sem login (link seguro).
- Dados do fornecedor (Frederico) ficam na tabela `plataforma`, nunca fixos no código.
- COBRANÇA — FASE DE VALIDAÇÃO (decisão do Frederico, 13/10/2026): SÓ PIX, SEM ASAAS e sem intermediário.
  A oficina paga a mensalidade lendo o QR Code / Pix copia e cola gerado por `lib/pix.ts` com a chave Pix do Frederico
  (guardada na tabela `plataforma`, nunca no código). Frederico confirma o pagamento à mão no `/admin`, e o sistema
  libera/bloqueia o acesso. Nada de webhook, cartão ou boleto agora. Quando o produto estiver validado, a cobrança
  automática (Asaas ou outro) entra pela camada `lib/pagamentos`: mantenha os campos de pagamento genéricos
  (ex.: `provedor`, `id_externo`), sem nomes de um provedor específico. Ignore as partes do guia sobre Asaas até lá.
  Pix real: chave CNPJ 36365410000183, TUKA SOLUCOES, GOIANIA (gravado na tabela `plataforma`). O código gerado por `lib/pix.ts`
  é idêntico ao do banco Inter (teste em `lib/pix.test.ts`). Tela da oficina: `/plano`. Confirmação manual: botão
  "Marcar como pago" no `/admin` (registra fatura paga e soma 30 dias). Fluxo do MVP: oficina testa grátis, Frederico
  entra em contato pelo WhatsApp (botão no `/admin`) e confere o Pix no extrato.
- Mobile-first com câmera; também funciona no computador.
- Tudo em português do Brasil; datas dd/mm/aaaa; fuso America/Sao_Paulo; valores em R$.
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui (base-ui) + Supabase (região São Paulo). Zod e React Hook Form. Vitest.
- Segurança: RLS em todas as tabelas; chaves só em variáveis de ambiente (`.env.local`, nunca no git); nada secreto no navegador.

## Resumo do produto
Vistoria em 7 passos: Veículo e cliente → Fotos guiadas (6 obrigatórias: frente, traseira, 2 laterais, painel, motor com capô aberto (até 30/10/2026 era a placa); + 1 "Outra foto" opcional, categoria `extra`) → Riscos e amassados (mapa em 5 vistas)
→ Pneus → Itens do carro e observações (telas separadas desde 31/10/2026) → Cliente confere e assina → Oficina assina e conclui (assinaturas em telas separadas). Ao concluir: vistoria travada (correções só por adendo), PDF com logo da oficina,
código de autenticidade + SHA-256 + QR Code, envio por WhatsApp e e-mail, link público e página /verificar.
Negócio: mensalidade paga por Pix (fase de validação); cada documento divulga, com discrição, o produto e o fornecedor.

## Antes de dizer que terminou
Rode `npm run build`, `npm run lint` e `npm test` sem erros e confira a tela em largura de 360 px.
Depois, faça o commit da etapa (mensagem em português).

## Comandos
- `npm run dev` → http://localhost:3000
- `npm run build` / `npm run lint` / `npm test`
- `npm run banco:testar` → confere as chaves do `.env.local` e se o banco existe
- `npm run banco:entrar` / `banco:conectar` / `banco:aplicar` → login na CLI do Supabase, ligar ao projeto e aplicar as migrações de `supabase/migrations`

## Banco de dados (Prompt 03)
- Migrações em `supabase/migrations/` (nunca alterar o banco à mão). Testar primeiro no projeto "vistoria-teste".
- Clientes: `lib/supabase/cliente.ts` (navegador), `servidor.ts` (servidor com login), `admin.ts` (chave secreta, só servidor).
- Chaves novas do Supabase: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sb_publishable_) e `SUPABASE_SECRET_KEY` (sb_secret_).
- Vistoria concluída é travada por gatilho no banco; fotos/pneus/itens/avarias também. Correção só por `vistoria_adendos`. Código de autenticidade: SV-XXXX-XXXX.
- Fotos: bucket privado `vistorias/{empresa_id}/{vistoria_id}/...`; logos: bucket público `marcas/{empresa_id}/...`.

## Decisões de 13/10/2026 (Frederico)
- Cadastro em 2 passos: (1) seu nome, seu WhatsApp, nome da oficina e aceite; (2) logo ("Logo da empresa"). Sem CNPJ/endereço, sem cor, sem equipe.
- Cores: SEMPRE as do Vistoria Rápida (azul #2563eb). A coluna `empresas.cor_primaria` não é mais usada nas telas nem no PDF.
- (Até 30/10/2026 havia teste grátis de 7 dias; veja abaixo.) Régua de cobrança (fim do teste = vencimento; vale para cada mensalidade), em `lib/cadastro.ts` `fasePagamento()`:
  3 dias antes → Pix aparece ao entrar (1x por dia, cookie vf_aviso_pix) com "Continuar para o sistema"; vencido até 5 dias (`plataforma.dias_carencia`) → Pix com "Mensalidade em atraso", ainda usa; mais de 5 dias → bloqueado (`exigirOficina()` manda para `/plano`, ações de vistoria recusam). Superadmin nunca é bloqueado.
- Login: e-mail + senha, sem nenhum e-mail enviado (conta criada já confirmada no servidor). Esqueci a senha → WhatsApp do suporte + link gerado no /admin.
- Termos e privacidade não são mais "provisórios".

## Decisões de 30/10/2026 (Frederico)
- ACABOU o teste grátis de 7 dias. Quem se cadastra tem 1 dia para pagar (`plataforma.dias_teste` = 1; a coluna `fim_teste` e o status `teste` continuam, agora significando "prazo do 1º pagamento").
  Passou o prazo sem pagar → bloqueado na hora (sem os 5 dias de carência, que valem só para as mensalidades). O QR Code do Pix fica à mão: o fim do cadastro já abre `/plano`, e o Início mostra "Pagar pelo Pix" o tempo todo para o dono. Oficinas que já estavam no teste mantêm a data antiga.
- ASAAS (substitui o "SÓ PIX, SEM ASAAS" de 13/10): mensalidade recorrente por Pix ou cartão, liberada SÓ pelo webhook
  (`POST /api/webhooks/asaas`, token no cabeçalho asaas-access-token) ou pela consulta à API no servidor ("Já paguei").
  Código em `lib/pagamentos/` (config, asaas, webhook, servidor); telas `/assinar`, `/pagamento/[id]`, `/plano` (Minha assinatura).
  Sem `ASAAS_API_KEY`, tudo continua no Pix manual. Preço igual ao de hoje (plano + pessoa a mais), só mensal, 1 dia para pagar,
  5 dias de tolerância. Nunca coletar dados de cartão (o cliente paga na fatura do Asaas). Passo a passo: `docs/asaas-passo-a-passo.md`.

## Decisões de 20/10/2026 (Frederico)
- Equipe (`/equipe`, menu Mais): dono/gerente CADASTRAM a pessoa direto (nome, WhatsApp, e-mail, senha, papel; WhatsApp obrigatório, guardado em user_metadata.whatsapp; botão manda o acesso direto para o WhatsApp da pessoa; conta criada já confirmada, `cadastrarUsuario`). Atualizado em 22/10: plano Básico inclui o dono + 3 pessoas (`planos.limite_usuarios` = 4); cada usuário a mais soma `planos.preco_usuario_extra` (R$ 19,90). Cupom no cadastro (campo CUPOM, aparece quando passa do plano): código válido na tabela `cupons` (ex.: CORTESIA) grava `usuarios_empresa.cupom` e esse usuário não é cobrado (`lib/mensalidade.ts` conta só `cupom is null`).
- Papéis: dono = tudo (único que vê Meu plano/Pix e os avisos de cobrança); gerente = tudo menos plano/Pix; vistoriador = faz vistorias, vê o pátio e só as vistorias que ele fez. Convites por link continuam valendo para os já criados. Cálculo em `lib/cobranca.ts`; valor da oficina em `lib/mensalidade.ts` (usado no Pix do `/plano` e no "Marcar como pago").
- Vistoria começa escolhendo o veículo: CARRO, MOTOCICLETA ou CAMINHÃO (`vistorias.tipo_veiculo`, `veiculos.tipo`). Moto tem 2 pneus (dianteiro, traseiro). Desenhos de moto/caminhão em `lib/desenhos-carro.ts` (`desenhosDo(tipo)`), usados no mapa, no PDF e no guia das fotos.

## Site de divulgação e SEO (30/10/2026)
- Páginas públicas para o Google em `app/(site)` (cabeçalho com menu e rodapé em `components/site`): `/`, `/vistoria-digital-para-oficinas`, `/como-funciona`,
  `/vistoria-de-carro-pelo-celular`, `/laudo-de-vistoria-digital`, `/checklist-de-entrada-de-veiculo`, `/precos`, `/blog` e `/blog/[slug]`.
  Os textos longos dessas páginas ficam nas próprias páginas (exceção à regra do `lib/textos.ts`); perguntas frequentes em `lib/conteudo/perguntas.ts`
  (o mesmo texto vai para a página e para o FAQPage); artigos em `lib/conteudo/blog.tsx`; pauta em `docs/pauta-blog.md`.
- Cada página: um único H1, `metadadosPagina()` de `lib/site.ts` (título, descrição, canonical com https://www., prévia do WhatsApp com `public/og.jpg`).
- Fora do Google (noindex + robots.txt): login, cadastro, telas internas, admin, `/v/...` e `/verificar/CÓDIGO`. A busca `/verificar` fica no Google.
- `app/robots.ts`, `app/sitemap.ts` (atualize `ATUALIZADO` ao mudar textos) e `app/not-found.tsx`. Sem preço no site por enquanto (decisão do Frederico).

## Plano Pro com vídeo (31/10/2026, Frederico)
- Dois planos à venda: Básico (o de sempre) e Pro (= Básico + R$ 30) com vídeo de até 1 minuto por vistoria (`planos.video_segundos` = 60). "Rede" saiu da venda.
- O vídeo fica DESLIGADO (`plataforma.video_ligado`) até contratar o Supabase Pro (no plano grátis de 1 GB não cabe). Liga/desliga no `/admin`. Desligado, o Pro nem aparece em `/plano`.
- Gravado no próprio sistema já comprimido (~1 Mbps, MP4 ou WebM; `_passos/gravar-video.tsx`), opcional, no passo das Fotos. Tabela `vistoria_videos` (um por vistoria; inserir só com `pode_gravar_video()`); SHA-256 calculado no servidor ao concluir e impresso no PDF.
- Aparece no link do cliente (`/v/...`) e em `/verificar/CÓDIGO` (`components/vf/video-vistoria.tsx`, `lib/video.ts`).
- Guardado 1 ano (`plataforma.dias_guardar_video`): a rotina diária `/api/rotinas/apagar-videos` (Vercel Cron, precisa de `CRON_SECRET` na Vercel) apaga o arquivo e marca `apagado_em`.
- Troca Básico ⇄ Pro em `/plano` (só o dono): vale na hora; valor novo na próxima mensalidade (Asaas atualizado por `atualizarValorAsaas`).
