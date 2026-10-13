@AGENTS.md

# VistoriaFácil — regras do projeto

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

## Padrão visual (Prompt 02)
- Componentes em `components/vf/` (importe de `@/components/vf`). Veja todos em `/estilo`. Não crie botões/campos soltos: reutilize ou estenda estes.
- Cores (classes Tailwind): `oficina` (cor da oficina, padrão azul-escuro), `acao` (verde, ação principal),
  `perigo` (vermelho: SÓ erro/avaria), `atencao` (amarelo). Tokens em `app/globals.css`.
- Modo sol: classe `.sol` no `<html>` (alto contraste), ligado por `BotaoModoSol`.
- Fonte de sistema, base 17 px. Mobile-first; testar sempre em 360 px de largura.
- Formatação/validação de placa, telefone e km em `lib/formatos.ts` (com testes).

## Vocabulário (Anexo B)
Chegada do veículo / Entrega do veículo (internamente ENTRADA/SAIDA), Vistoria, Fotos, Riscos e amassados,
Pneus e itens, Conferir e assinar, Enviar para o cliente, Termo de vistoria (PDF), Veículos no pátio,
Equipe, Minha oficina, Meu plano, Ajuda. Evite: check-in, upload, dashboard, sincronizando, submeter.

## Requisitos gerais
- Multiempresa (cada oficina com usuários e dados isolados) e várias unidades por empresa.
- Usuários: ADMINISTRADOR DA PLATAFORMA (Frederico Crispim) em `/admin`; usuários das oficinas (dono, gerente, vistoriador); público sem login (link seguro).
- Dados do fornecedor (Frederico) ficam na tabela `plataforma`, nunca fixos no código.
- Cobrança por assinatura via Asaas, SEMPRE pela camada `lib/pagamentos`.
- Mobile-first com câmera; também funciona no computador.
- Tudo em português do Brasil; datas dd/mm/aaaa; fuso America/Sao_Paulo; valores em R$.
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui (base-ui) + Supabase (região São Paulo). Zod e React Hook Form. Vitest.
- Segurança: RLS em todas as tabelas; chaves só em variáveis de ambiente (`.env.local`, nunca no git); nada secreto no navegador.

## Resumo do produto
Vistoria em 5 passos: Veículo e cliente → Fotos guiadas (8 obrigatórias) → Riscos e amassados (mapa em 5 vistas)
→ Pneus e itens → Conferir e assinar. Ao concluir: vistoria travada (correções só por adendo), PDF com logo da oficina,
código de autenticidade + SHA-256 + QR Code, envio por WhatsApp e e-mail, link público e página /verificar.
Negócio: assinatura mensal (Asaas); cada documento divulga, com discrição, o produto e o fornecedor.

## Antes de dizer que terminou
Rode `npm run build`, `npm run lint` e `npm test` sem erros e confira a tela em largura de 360 px.
Depois, faça o commit da etapa (mensagem em português).

## Comandos
- `npm run dev` → http://localhost:3000
- `npm run build` / `npm run lint` / `npm test`
