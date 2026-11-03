-- Permite ao script de sincronização rodar VACUUM/ANALYZE depois de cada carga mensal.
grant maintain on all tables in schema cnpj to cnpj_sync;
