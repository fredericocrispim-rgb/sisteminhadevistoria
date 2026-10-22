-- Decisão do Frederico (22/10/2026): o plano Básico inclui o dono + 4 pessoas (5 usuários);
-- cada usuário a mais soma R$ 19,90 na mensalidade.
-- Aplicado direto pelo script (só muda valores); fica aqui para o histórico.
update public.planos
   set limite_usuarios = 5, preco_usuario_extra = 19.90
 where nome = 'Básico';
