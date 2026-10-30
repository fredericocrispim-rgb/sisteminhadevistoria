-- Nome novo do produto (30/10/2026): "Sisteminha de Vistoria" passa a ser "Vistoria Rápida".
-- Aparece no PDF do termo ("Vistoria digital por ...") e na descrição do Pix.
alter table public.plataforma alter column nome_produto set default 'Vistoria Rápida';
update public.plataforma set nome_produto = 'Vistoria Rápida';
