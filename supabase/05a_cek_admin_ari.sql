-- Jalankan setelah akun ari@gmail.com dibuat di Authentication > Users.
-- Kolom id harus terisi; role awal biasanya student.
select u.email, p.id, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'ari@gmail.com';
