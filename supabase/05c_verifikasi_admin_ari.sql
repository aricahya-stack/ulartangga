-- Pastikan hasilnya tepat satu baris dengan role admin.
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'ari@gmail.com';
