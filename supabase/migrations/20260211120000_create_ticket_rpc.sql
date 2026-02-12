-- Create an atomic ticket creation function to avoid race conditions
-- when multiple channels (kiosk, WhatsApp) create tickets at the same time.

create or replace function public.create_ticket_for_service(
  p_service_id uuid,
  p_customer_phone text default null,
  p_created_via text default 'kiosk'
) returns tickets
language plpgsql
as $$
declare
  v_service record;
  v_prefix text;
  v_last_ticket text;
  v_last_number int := 0;
  v_new_number int;
  v_ticket_number text;
  v_ticket tickets%rowtype;
  v_last_number_text text;
begin
  select id, department_id, name, service_code
  into v_service
  from services
  where id = p_service_id;

  if not found then
    raise exception 'Service not found: %', p_service_id;
  end if;

  -- Serialize ticket generation per service to avoid duplicates.
  perform pg_advisory_xact_lock(hashtext(v_service.id::text));

  -- Prefer service_code for stable prefixes, fallback to service name.
  v_prefix := upper(substring(regexp_replace(coalesce(nullif(v_service.service_code, ''), v_service.name), '[^A-Za-z]', '', 'g') from 1 for 3));
  if v_prefix is null or length(v_prefix) = 0 then
    v_prefix := 'XXX';
  elsif length(v_prefix) < 3 then
    v_prefix := rpad(v_prefix, 3, 'X');
  end if;

  select ticket_number
  into v_last_ticket
  from tickets
  where service_id = v_service.id
    and ticket_number like v_prefix || '-%'
  order by created_at desc
  limit 1;

  if v_last_ticket is not null then
    v_last_number_text := substring(v_last_ticket from '(\d+)$');
    if v_last_number_text is not null then
      v_last_number := v_last_number_text::int;
    end if;
  end if;

  v_new_number := v_last_number + 1;
  v_ticket_number := v_prefix || '-' || lpad(v_new_number::text, 3, '0');

  insert into tickets (
    service_id,
    department_id,
    customer_phone,
    status,
    created_via,
    ticket_number
  ) values (
    v_service.id,
    v_service.department_id,
    p_customer_phone,
    'waiting',
    p_created_via,
    v_ticket_number
  )
  returning * into v_ticket;

  return v_ticket;
end;
$$;
