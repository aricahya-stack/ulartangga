-- Hanya mengubah peran akun ari@gmail.com; tidak membuat akun atau sandi.
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'ari@gmail.com')
returning id, role;
