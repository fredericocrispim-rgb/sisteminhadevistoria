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

## Padrão visual (Prompt 02, revisado: moderno e enxuto)
Quem usa são mecânicos, muitos com pouca instrução: QUANTO MAIS SIMPLES, MELHOR.
- Pouco texto: frases de 2 a 6 palavras. Nada de explicação longa na tela. Ícone grande + palavra.
- Fundo branco, blocos em cinza claro (`bg-superficie`), sem bordas desnecessárias, cantos bem arredondados (rounded-2xl/3xl).
- Botão principal 64 px (`min-h-toque-grande`), demais toques no mínimo 56 px (`min-h-toque`). Fonte base 18 px; títulos grandes e grossos (font-extrabold).
- Componentes em `components/vf/` (importe de `@/components/vf`). Veja as telas de exemplo em `/estilo`. Não crie botões/campos soltos.
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
- Mobile-first com câmera; também funciona no computador.
- Tudo em português do Brasil; datas dd/mm/aaaa; fuso America/Sao_Paulo; valores em R$.
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui (base-ui) + Supabase (região São Paulo). Zod e React Hook Form. Vitest.
- Segurança: RLS em todas as tabelas; chaves só em variáveis de ambiente (`.env.local`, nunca no git); nada secreto no navegador.

## Resumo do produto
Vistoria em 5 passos: Veículo e cliente → Fotos guiadas (8 obrigatórias) → Riscos e amassados (mapa em 5 vistas)
→ Pneus e itens → Conferir e assinar. Ao concluir: vistoria travada (correções só por adendo), PDF com logo da oficina,
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
- Vistoria concluída é travada por gatilho no banco; fotos/pneus/itens/avarias também. Correção só por `vistoria_adendos`.
- Fotos: bucket privado `vistorias/{empresa_id}/{vistoria_id}/...`; logos: bucket público `marcas/{empresa_id}/...`.
