# Plan de test manuel Supabase

Ce plan sert au premier test réel du mode Supabase. Il complète les requêtes de vérification dans `supabase/verify.sql`.

## Préparation

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql`.
3. Exécuter `supabase/seed.sql`.
4. Créer au moins deux utilisateurs dans Supabase Auth :
   - un compte super administrateur lié à Samy Belkacemi `role = 'super_admin'`
   - un compte admin lié à un professeur `role = 'admin'`
   - un compte professeur lié à un professeur `role = 'teacher'`
5. Renseigner `teachers.auth_user_id` pour chaque compte.
6. Exécuter `supabase/rls.sql`.
7. Exécuter `supabase/rpc.sql`.
8. Lancer quelques requêtes de `supabase/verify.sql`.
9. Créer `.env.local` avec `VITE_DATA_BACKEND=supabase`, `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
10. Lancer `npm run dev`.

## Test compte admin

Le compte admin doit pouvoir :

- se connecter
- voir le calendrier
- voir les cours issus du seed
- créer un cours
- modifier le titre, la date, l'heure, le lieu, le contenu et les notes d'un cours
- supprimer un cours de test
- modifier sa propre disponibilité
- modifier le contenu pédagogique
- voir les entrées dans les modifications récentes

Le compte admin ne doit pas pouvoir créer/supprimer des professeurs ni changer les rôles.

## Test compte super administrateur

Le compte super administrateur doit pouvoir :

- se connecter
- voir le calendrier
- créer, modifier et supprimer des cours
- ajouter un professeur depuis l'onglet `Professeurs`
- changer un professeur entre `professeur` et `admin`
- retirer un professeur

Le compte super administrateur ne doit pas pouvoir se retirer lui-même depuis l'app.

Vérifications SQL utiles :

```sql
select title, date, start_time, end_time, location
from public.sessions
order by created_at desc
limit 5;

select type, description, actor_teacher_id, created_at
from public.change_log_entries
order by created_at desc
limit 10;
```

## Test compte professeur

Le compte professeur doit pouvoir :

- se connecter
- voir le calendrier
- voir les cours issus du seed
- modifier sa propre disponibilité
- modifier le contenu pédagogique via la RPC
- voir les modifications récentes

Le compte professeur ne doit pas pouvoir :

- voir les contrôles admin de création/modification/suppression de cours
- créer un cours
- modifier le titre, la date, l'heure ou le lieu d'un cours
- supprimer un cours
- modifier la disponibilité d'un autre professeur
- insérer une entrée de journal avec un `actor_teacher_id` différent du sien

Vérifications SQL utiles après le test professeur :

```sql
select status, comment, teacher_id, session_id, updated_at
from public.availability
order by updated_at desc
limit 10;

select type, description, actor_teacher_id, metadata, created_at
from public.change_log_entries
where type in ('lesson_plan_added', 'lesson_plan_updated', 'availability_changed')
order by created_at desc
limit 10;
```

## Tests négatifs RLS à faire dans l'application

- Connecté comme professeur, vérifier que le bouton `Ajouter un cours` n'apparaît pas.
- Connecté comme professeur, vérifier que `Modifier ce cours` et `Supprimer ce cours` n'apparaissent pas.
- Connecté comme professeur, modifier le contenu du cours et vérifier qu'une modification récente est créée.
- Connecté comme professeur, modifier sa disponibilité et vérifier qu'une modification récente est créée.

## Tests négatifs RLS avancés

Ces tests se font plutôt avec un client Supabase authentifié en tant que professeur normal, pas dans l'éditeur SQL avec des privilèges élevés.

- Tenter un `insert` direct dans `sessions` : doit être refusé.
- Tenter un `update` direct de `sessions.title`, `date`, `start_time`, `end_time` ou `location` : doit être refusé.
- Tenter un `delete` direct dans `sessions` : doit être refusé.
- Tenter un `insert` dans `change_log_entries` avec un autre `actor_teacher_id` : doit être refusé.
- Appeler `update_session_lesson_content` : doit réussir pour un professeur lié.

## À noter pendant le test

Relever précisément :

- le compte utilisé
- l'action testée
- le message d'erreur affiché
- l'entrée créée dans `change_log_entries`, si applicable
- toute erreur console navigateur
- toute requête SQL de `verify.sql` qui donne un résultat inattendu
