-- Fim do teste grátis de 7 dias (decisão do Frederico, 30/10/2026).
-- Quem se cadastra tem só 1 dia para pagar a primeira mensalidade pelo Pix.
-- Depois desse dia o acesso é bloqueado na hora (sem os 5 dias de carência, que valem só para as mensalidades).
-- As oficinas que já estavam no teste mantêm a data que tinham.
update public.plataforma set dias_teste = 1 where id = 1;
alter table public.plataforma alter column dias_teste set default 1;
