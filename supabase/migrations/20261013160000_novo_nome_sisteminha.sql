-- =====================================================================
-- Novo nome: Sisteminha de Vistoria (antes: VistoriaFácil)
-- Código de autenticidade passa a ser SV-XXXX-XXXX. Cor padrão: azul da marca.
-- =====================================================================

update public.plataforma set nome_produto = 'Sisteminha de Vistoria' where id = 1;
alter table public.plataforma alter column nome_produto set default 'Sisteminha de Vistoria';
alter table public.empresas alter column cor_primaria set default '#2563eb';

create or replace function public.numerar_vistoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text;
begin
  update public.empresas
     set ultimo_numero_vistoria = ultimo_numero_vistoria + 1
   where id = new.empresa_id
  returning ultimo_numero_vistoria into new.numero;

  loop
    v_codigo := 'SV-' || public.gerar_codigo(4) || '-' || public.gerar_codigo(4);
    exit when not exists (select 1 from public.vistorias where codigo_autenticidade = v_codigo);
  end loop;
  new.codigo_autenticidade := v_codigo;
  return new;
end;
$$;
