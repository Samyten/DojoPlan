# Planning du dojo

Application React + Vite + TypeScript pour organiser les cours entre professeurs de karaté.

## Fonctionnalités incluses

- Calendrier mensuel des cours.
- Cours récurrents générés pour la saison active en mode local.
- Jours fériés et vacances scolaires Zone C / Perpignan visibles dans le calendrier.
- Sélection d'une date puis d'un cours lorsqu'il y a plusieurs cours le même jour.
- Détail du cours avec contenu, notes et disponibilités des professeurs.
- Modification de sa propre disponibilité.
- Disponibilités en série dans un panneau replié par défaut.
- Modification de la disponibilité d'un autre professeur réservée aux admins et super admins.
- Modification du contenu du cours en mode local et en mode Supabase via RPC sécurisée.
- Fil de modifications récentes.
- Forum persistant partagé entre tous les professeurs, avec auteur et horodatage.
- Sélecteur d'utilisateur local pour travailler sans Supabase.
- Connexion Supabase Auth en mode Supabase.
- Création, modification et suppression de cours réservées aux admins.
- Gestion des professeurs réservée au super administrateur.
- Repository local basé sur localStorage et repository Supabase derrière la même API.

## Planning régulier du dojo

Les cours récurrents suivent le planning réel :

- Lundi :
  - `Enfants 10 à 14 ans`, 18h00 - 19h15
  - `Adultes`, 19h15 - 20h30
  - `Karaté Contact`, 20h30 - 21h30
- Mercredi :
  - `Enfants de 5 à 9 ans`, 17h15 - 18h30
- Jeudi :
  - `Enfants 10 à 14 ans`, 18h00 - 19h15
  - `Adultes`, 19h15 - 20h30
  - `Karaté Contact`, 20h30 - 21h30

La génération automatique ne crée pas de cours réguliers pendant les vacances scolaires de Perpignan / Zone C, les jours fériés français configurés, ni le pont de l'Ascension. Les admins peuvent quand même ajouter manuellement un cours exceptionnel sur une date de vacances ; le calendrier garde alors le marqueur de vacances et affiche aussi le cours.

Saison active : 2026-2027.

- Rentrée scolaire Zone C : 1 septembre 2026.
- Début de saison dojo : 7 septembre 2026.
- Premier cours régulier généré : lundi 7 septembre 2026.
- Derniers cours réguliers générés : jeudi 1 juillet 2027.
- Aucun cours régulier n'est généré à partir des vacances d'été du 3 juillet 2027.

## Disponibilités

- Un professeur peut modifier uniquement sa propre disponibilité.
- Un admin ou super admin peut modifier la disponibilité d'un autre professeur, depuis un panneau replié dans le détail du cours.
- Le panneau `Renseigner plusieurs disponibilités` est replié par défaut et permet d'appliquer un statut à plusieurs cours filtrés par période, jour et type de cours.
- Les disponibilités en série ne ciblent que les cours réguliers du planning principal. Les cours exceptionnels créés manuellement ne sont pas proposés dans le filtre et ne doivent pas être modifiés en série.
- Par défaut, les disponibilités déjà renseignées ne sont pas remplacées. La case `Remplacer également les disponibilités déjà renseignées` doit être cochée pour écraser des réponses existantes.
- Les opérations en série créent une seule entrée résumée dans les modifications récentes.

## Lancer en mode local

Le mode local est le mode par défaut. Il ne nécessite aucun service externe.

```bash
npm install
npm run dev
```

Variables facultatives :

```env
VITE_DATA_BACKEND=local
```

## Checklist premier test Supabase live

Suivez ces étapes dans cet ordre pour le premier vrai test Supabase :

1. Créez un projet Supabase.
2. Ouvrez l'éditeur SQL Supabase et exécutez `supabase/schema.sql`.
3. Exécutez `supabase/seed.sql`.
4. Dans Supabase Dashboard, créez les utilisateurs Auth avec les vrais emails des professeurs.
5. Copiez le `User UID` de chaque utilisateur Auth.
6. Liez chaque utilisateur Auth à une ligne `teachers.auth_user_id`.
7. Réglez le rôle de chaque professeur dans `teachers.role` : `super_admin`, `admin` ou `teacher`.
8. Exécutez `supabase/rls.sql`.
9. Exécutez `supabase/rpc.sql`.
10. Exécutez les requêtes utiles de `supabase/verify.sql`.
11. Créez `.env.local` à la racine du projet :

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

12. Lancez l'app :

```bash
npm run dev
```

13. Connectez-vous avec un compte admin.
14. Vérifiez que l'admin peut créer, modifier et supprimer un cours de test.
15. Déconnectez-vous puis connectez-vous avec un compte professeur.
16. Vérifiez que le professeur ne voit pas les contrôles admin.
17. Vérifiez que le professeur peut modifier sa disponibilité et le contenu pédagogique.
18. Vérifiez les modifications récentes dans l'app et dans `change_log_entries`.

Si `VITE_DATA_BACKEND=supabase` est utilisé sans URL ou clé anon, l'app affiche une erreur de configuration claire.

Le plan détaillé de test manuel se trouve dans `docs/supabase-live-test-plan.md`.

## Checklist premier déploiement

Pour un vrai usage par les professeurs, utilisez le backend Supabase. Le mode local est uniquement destiné au développement hors ligne.

1. Choisissez le backend `supabase` pour l'environnement déployé.
2. Exécutez `supabase/schema.sql` dans le projet Supabase.
3. Exécutez `supabase/seed.sql` seulement si vous voulez initialiser des données de départ. Ce fichier contient des emails locaux d'exemple et ne doit pas être utilisé tel quel comme données de production.
4. Remplacez tous les emails `@dojo.local` par les vrais emails avant de considérer les données comme production.
5. Créez les comptes Supabase Auth des professeurs.
6. Liez chaque compte Auth à `teachers.auth_user_id`.
7. Vérifiez que Samy Belkacemi a le rôle `super_admin` uniquement si c'est bien le compte qui doit gérer les professeurs.
8. Vérifiez que Marc Piperno a le rôle `admin` uniquement si c'est bien souhaité.
9. Mettez tous les professeurs non-admins en rôle `teacher`.
10. Exécutez `supabase/rls.sql`.
11. Exécutez `supabase/rpc.sql`.
12. Configurez les variables chez l'hébergeur :

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

13. Lancez `npm run build`.
14. Déployez le dossier `dist`, ou connectez le dépôt à Vercel, Netlify ou Cloudflare Pages.
15. Connectez-vous avec un admin et vérifiez la création/modification/suppression d'un cours.
16. Connectez-vous avec un professeur et vérifiez l'absence des contrôles admin.
17. Vérifiez que les disponibilités, le contenu du cours et les modifications récentes fonctionnent.

À ne pas faire :

- Ne déployez pas `VITE_DATA_BACKEND=local` pour un vrai usage professeur.
- N'utilisez jamais la clé `service_role` Supabase dans le frontend.
- Ne vous fiez pas aux rôles côté interface sans avoir vérifié RLS dans le projet Supabase réel.

## Mise à jour d'une production existante

Pour une base Supabase déjà utilisée en production, ne relancez pas `supabase/seed.sql` : ce fichier vide et recrée des données de départ.

Pour cette version, exécutez uniquement ces migrations additives dans Supabase SQL Editor, dans cet ordre :

1. `supabase/migrations/add_karate_contact_sessions_2026_2027.sql`
2. `supabase/migrations/add_regular_sessions_2026_09_07.sql`
3. `supabase/migrations/add_bulk_availability_rpc.sql`
4. `supabase/migrations/restrict_bulk_availability_to_regular_lessons.sql`
5. `supabase/migrations/add_notification_read_state.sql`
6. `supabase/migrations/link_hugo_lohan_auth_accounts.sql` (après avoir créé leurs comptes dans Supabase Authentication)
7. `supabase/migrations/add_forum_messages.sql`

Ensuite :

1. Poussez les changements de code sur le dépôt relié à Vercel.
2. Attendez le redéploiement automatique Vercel.
3. Testez avec un compte professeur normal.
4. Testez avec un compte admin ou super admin.
5. Vérifiez que les cours `Karaté Contact` apparaissent les lundis et jeudis hors vacances.
6. Vérifiez qu'un professeur peut utiliser `Renseigner plusieurs disponibilités` pour lui-même.
7. Vérifiez qu'un admin peut renseigner la disponibilité d'un autre professeur.

## Créer et lier des comptes professeurs

Dans Supabase Dashboard :

1. Créez un utilisateur Auth avec le vrai email du professeur et un mot de passe.
2. Copiez son `User UID`.
3. Mettez à jour la ligne professeur correspondante avec cet UID :

```sql
update teachers
set auth_user_id = '<auth.users.id>'
where email = '<email-du-professeur>';
```

N'utilisez pas les emails `@dojo.local` du seed pour la production. Ils servent seulement à initialiser ou tester la structure.

Les rôles se règlent dans `teachers.role` :

- `super_admin` : réservé à Samy Belkacemi, permet de gérer les professeurs et les rôles.
- `admin` : permet de gérer les cours.
- `teacher` : permet de gérer sa disponibilité et le contenu pédagogique.

Un utilisateur connecté sans profil professeur lié verra une erreur en français dans l'app.

## Checklist comptes avant production

- Créez les vrais comptes Supabase Auth pour chaque professeur.
- Liez chaque compte Auth à une ligne `teachers.auth_user_id`.
- Vérifiez qu'au moins un compte `super_admin` ou `admin` peut se connecter.
- Vérifiez qu'un compte professeur normal peut se connecter.
- Vérifiez qu'un utilisateur connecté sans profil lié est bloqué avec un message clair.
- Vérifiez que les contrôles de gestion des cours apparaissent seulement pour `admin` et `super_admin`.
- Vérifiez que la gestion des professeurs apparaît seulement pour `super_admin`.
- Vérifiez qu'un professeur normal ne peut pas créer, modifier ou supprimer de cours.
- Vérifiez qu'un professeur normal peut seulement modifier sa propre disponibilité.

## RLS et RPC

`supabase/rls.sql` active RLS sur :

- `teachers`
- `sessions`
- `availability`
- `change_log_entries`
- `notification_read_state`
- `forum_messages`

Règles principales :

- Les professeurs authentifiés peuvent lire les professeurs, cours, disponibilités et changements.
- Les admins et le super administrateur peuvent créer/modifier/supprimer des cours.
- Seul le super administrateur peut créer/supprimer des professeurs et changer les rôles.
- Les professeurs peuvent modifier uniquement leur propre disponibilité.
- Les admins et super admins peuvent modifier la disponibilité d'un autre professeur via RPC sécurisée.
- Les entrées de journal ne peuvent être insérées qu'avec `actor_teacher_id = current_teacher_id()`.
- Chaque professeur peut lire et modifier uniquement son propre état de lecture des notifications.
- Tous les professeurs authentifiés et liés peuvent lire le Forum et publier uniquement sous leur propre identité.

Le Forum conserve l'historique en base. L'interface charge les 200 messages les plus récents afin de rester légère.

Les mises à jour directes de `sessions` restent réservées aux admins. Les professeurs peuvent modifier le contenu pédagogique via `public.update_session_lesson_content`, défini dans `supabase/rpc.sql`. Cette fonction utilise `auth.uid()` pour retrouver le professeur connecté, met à jour uniquement `lesson_plan`, éventuellement `notes`, et crée une entrée de journal en français.

Les disponibilités en série et les modifications de disponibilité pour un autre professeur passent par `public.bulk_update_availability`, aussi défini dans `supabase/rpc.sql`. Cette fonction utilise `auth.uid()` pour retrouver l'acteur, vérifie le rôle, applique les règles d'écrasement et crée une seule entrée de journal résumée.

Ordre SQL recommandé :

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/rls.sql`
4. `supabase/rpc.sql`

## Commandes utiles

```bash
npm run lint
npm run build
npm run test
npm run test:watch
```

## Structure

- `src/auth/AuthProvider.tsx` : état d'auth local/Supabase.
- `src/auth/LoginScreen.tsx` : écran de connexion Supabase.
- `src/auth/authService.ts` : appels Supabase Auth et chargement du profil professeur.
- `src/data/repositories/dojoRepository.ts` : façade stable utilisée par l'app.
- `src/data/repositories/localDojoRepository.ts` : implémentation localStorage.
- `src/data/repositories/supabaseDojoRepository.ts` : implémentation Supabase.
- `src/data/repositories/repositoryTypes.ts` : contrat commun des repositories.
- `src/components/forum/ForumPage.tsx` : historique et saisie des messages du Forum.
- `src/data/recurringSchedule.ts` : planning hebdomadaire réel du dojo.
- `src/data/holidayCalendar.ts` : vacances scolaires Zone C / Perpignan, jours fériés et pont de l'Ascension.
- `src/utils/sessionGeneration.ts` : génération des cours récurrents avec exclusion des vacances.
- `src/lib/supabaseClient.ts` : client Supabase configuré via variables Vite.
- `supabase/schema.sql` : schéma SQL Supabase.
- `supabase/seed.sql` : données initiales Supabase.
- `supabase/rls.sql` : policies RLS.
- `supabase/rpc.sql` : RPC sécurisée pour le contenu pédagogique.
- `supabase/migrations/add_karate_contact_sessions_2026_2027.sql` : ajoute les cours Karaté Contact manquants en production sans toucher aux autres cours.
- `supabase/migrations/add_bulk_availability_rpc.sql` : ajoute la RPC de disponibilités en série et admin pour production existante.
- `supabase/migrations/add_notification_read_state.sql` : ajoute le suivi privé lu/non lu des modifications récentes.
- `supabase/migrations/add_forum_messages.sql` : ajoute le Forum persistant et ses policies RLS.
- `supabase/migrations/link_hugo_lohan_auth_accounts.sql` : met à jour et lie les profils Auth de Hugo et Lohan sans stocker leurs mots de passe.
- `supabase/verify.sql` : requêtes read-only pour vérifier le setup Supabase.
- `docs/supabase-live-test-plan.md` : scénario manuel pour tester admin/professeur.

Les composants ne manipulent pas directement les données. Les opérations passent par la façade repository.

## Production Readiness Warning

Cette étape rend Supabase structurellement prêt, mais il faut encore valider le projet Supabase réel avant usage en dojo.

- Le mode local garde un sélecteur d'utilisateur réservé au développement.
- Ne déployez pas le mode local pour un vrai usage professeur.
- En mode Supabase, l'app utilise Supabase Auth et `teachers.auth_user_id`.
- Les rôles côté client restent uniquement de l'ergonomie UI. La sécurité réelle doit venir de RLS.
- Le service role key ne doit jamais être utilisé dans le frontend.
- Testez les policies RLS dans Supabase avant un vrai déploiement.
- Testez `update_session_lesson_content` avec de vrais comptes professeur/admin avant usage réel.
