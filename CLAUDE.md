@AGENTS.md

# Sisteminha de Vistoria — regras do projeto

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
- MARCA: nome "Sisteminha de Vistoria"; logotipo = círculo azul com 4 quadradinhos (3 claros, 1 verde): componente `LogoProduto` e `app/icon.svg`. Cores da marca: azul #2563eb e verde #22b573 (`marca-azul`, `marca-verde`). O verde dos botões com texto branco é mais escuro (#13865a) para dar contraste.
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
Vistoria em 6 passos: Veículo e cliente → Fotos guiadas (6 obrigatórias: frente, traseira, 2 laterais, painel, placa; + 1 "Outra foto" opcional, categoria `extra`) → Riscos e amassados (mapa em 5 vistas)
→ Pneus e itens → Cliente confere e assina → Oficina assina e conclui (assinaturas em telas separadas). Ao concluir: vistoria travada (correções só por adendo), PDF com logo da oficina,
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
- Cores: SEMPRE as do Sisteminha (azul #2563eb). A coluna `empresas.cor_primaria` não é mais usada nas telas nem no PDF.
- Teste grátis: 7 dias (`plataforma.dias_teste`). Régua de cobrança (fim do teste = vencimento; vale para cada mensalidade), em `lib/cadastro.ts` `fasePagamento()`:
  3 dias antes → Pix aparece ao entrar (1x por dia, cookie vf_aviso_pix) com "Continuar para o sistema"; vencido até 5 dias (`plataforma.dias_carencia`) → Pix com "Mensalidade em atraso", ainda usa; mais de 5 dias → bloqueado (`exigirOficina()` manda para `/plano`, ações de vistoria recusam). Superadmin nunca é bloqueado.
- Login: e-mail + senha, sem nenhum e-mail enviado (conta criada já confirmada no servidor). Esqueci a senha → WhatsApp do suporte + link gerado no /admin.
- Termos e privacidade não são mais "provisórios".

## Decisões de 20/10/2026 (Frederico)
- Equipe (`/equipe`, menu Mais): dono/gerente CADASTRAM a pessoa direto (nome, e-mail, senha, papel; conta criada já confirmada, `cadastrarUsuario`). Atualizado em 22/10: plano Básico inclui o dono + 4 pessoas (`planos.limite_usuarios` = 5); cada usuário a mais soma `planos.preco_usuario_extra` (R$ 19,90). Convites por link continuam valendo para os já criados. Cálculo em `lib/cobranca.ts`; valor da oficina em `lib/mensalidade.ts` (usado no Pix do `/plano` e no "Marcar como pago").
- Vistoria começa escolhendo o veículo: CARRO, MOTOCICLETA ou CAMINHÃO (`vistorias.tipo_veiculo`, `veiculos.tipo`). Moto tem 2 pneus (dianteiro, traseiro). Desenhos de moto/caminhão em `lib/desenhos-carro.ts` (`desenhosDo(tipo)`), usados no mapa, no PDF e no guia das fotos.
