-- Add service_code to services for stable ticket prefixes

alter table services
  add column if not exists service_code varchar(20);
