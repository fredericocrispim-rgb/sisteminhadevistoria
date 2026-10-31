-- Dados da empresa fornecedora para os Termos de Uso e a Política de Privacidade (decisão do Frederico, 31/10/2026).
-- Ficam na tabela plataforma (nunca fixos no código). Nova versão dos documentos: 2.
alter table public.plataforma
  add column if not exists empresa_razao_social text,
  add column if not exists empresa_cnpj text,
  add column if not exists empresa_endereco text,
  add column if not exists empresa_email text;

update public.plataforma
   set empresa_razao_social = coalesce(empresa_razao_social, 'TUKA SOLUÇÕES EMPRESARIAIS LTDA'),
       empresa_cnpj = coalesce(empresa_cnpj, '36.365.410/0001-83'),
       empresa_endereco = coalesce(empresa_endereco, 'Goiânia/GO'),
       empresa_email = coalesce(empresa_email, 'tukasolucoes@gmail.com'),
       versao_termos_atual = '2',
       versao_privacidade_atual = '2',
       atualizado_em = now()
 where id = 1;
