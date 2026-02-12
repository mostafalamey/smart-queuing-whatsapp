-- Backfill service_code for existing services

update services
set service_code =
  case
    when upper(substring(regexp_replace(name, '[^A-Za-z]', '', 'g') from 1 for 3)) is null
      or length(upper(substring(regexp_replace(name, '[^A-Za-z]', '', 'g') from 1 for 3))) = 0
      then 'XXX'
    when length(upper(substring(regexp_replace(name, '[^A-Za-z]', '', 'g') from 1 for 3))) < 3
      then rpad(upper(substring(regexp_replace(name, '[^A-Za-z]', '', 'g') from 1 for 3)), 3, 'X')
    else upper(substring(regexp_replace(name, '[^A-Za-z]', '', 'g') from 1 for 3))
  end
where service_code is null or service_code = '';
