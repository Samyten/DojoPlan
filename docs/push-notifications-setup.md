# Installation et notifications sur téléphone

L'application est une PWA : elle peut être installée depuis le navigateur sur Android, iPhone,
iPad et ordinateur. Les notifications utilisent le standard Web Push et sont envoyées par une
fonction Supabase lorsqu'un message est publié dans le Forum ou qu'une ligne est ajoutée dans
`change_log_entries`.

## Comportement dans l'application

1. Dans le navigateur, une petite bulle propose `Installer l’application`.
2. Sur iPhone/iPad, le bouton explique d'utiliser `Partager` puis `Sur l’écran d’accueil`.
3. Une fois l'application ouverte depuis son icône, une seconde bulle propose
   `Activer les notifications`.
4. Chaque appareil est lié au professeur Supabase connecté.
5. L'auteur d'un message ou d'une modification ne reçoit pas sa propre notification.
6. Le réglage `Notifications du téléphone` dans le bas de l'application permet de désactiver
   les notifications sur l'appareil courant.

Sur iPhone et iPad, Web Push nécessite iOS/iPadOS 16.4 ou plus récent et l'application doit être
ouverte depuis l'icône ajoutée à l'écran d'accueil. Sur tous les appareils, le site déployé doit
être servi en HTTPS.

## 1. Ajouter la table Supabase

Dans SQL Editor, exécutez une seule fois :

```text
supabase/migrations/add_push_notifications.sql
```

Cette migration crée `push_subscriptions` et ses policies RLS. Un professeur connecté ne peut
lire, créer, modifier ou supprimer que ses propres abonnements.

## 2. Générer les clés VAPID

Dans PowerShell, à la racine du projet :

```powershell
npx web-push@3.6.7 generate-vapid-keys --json
```

Conservez les deux valeurs :

- `publicKey` peut être utilisée dans le frontend ;
- `privateKey` est un secret serveur et ne doit jamais être ajoutée à `.env.local`, Vercel ou au
  code frontend.

Ajoutez la clé publique dans `.env.local` et dans les variables du site déployé :

```env
VITE_WEB_PUSH_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE_VAPID
```

Une modification d'une variable `VITE_...` nécessite un nouveau build/déploiement du site.

## 3. Déployer la fonction Supabase

Connectez le CLI au projet, puis déployez la fonction :

```powershell
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase functions deploy send-push-notifications --no-verify-jwt
```

Générez un secret aléatoire pour protéger les appels des webhooks :

```powershell
$webhookSecret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
$webhookSecret
```

Configurez ensuite les secrets de la fonction. Remplacez les valeurs avant d'exécuter :

```powershell
npx supabase secrets set "VAPID_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE_VAPID" "VAPID_PRIVATE_KEY=VOTRE_CLE_PRIVEE_VAPID" "VAPID_SUBJECT=mailto:ADRESSE_DU_DOJO" "PUSH_WEBHOOK_SECRET=VOTRE_SECRET_WEBHOOK"
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement à la fonction Edge par
Supabase. La clé `service_role` reste uniquement côté serveur et ne doit jamais être copiée dans
une variable `VITE_...`.

## 4. Créer les deux Database Webhooks

Dans Supabase Dashboard, ouvrez la gestion des Database Webhooks et créez deux webhooks `POST` vers :

```text
https://VOTRE_PROJECT_REF.supabase.co/functions/v1/send-push-notifications
```

Ajoutez sur chacun l'en-tête HTTP suivant :

```text
x-webhook-secret: VOTRE_SECRET_WEBHOOK
```

Webhook 1 :

- nom : `push_forum_messages` ;
- table : `public.forum_messages` ;
- événement : `INSERT`.

Webhook 2 :

- nom : `push_recent_changes` ;
- table : `public.change_log_entries` ;
- événement : `INSERT`.

Les webhooks de base de données sont asynchrones : une panne temporaire d'envoi Push ne bloque pas
l'enregistrement du message ou de la modification dans l'application.

## 5. Test sur deux comptes

1. Déployez le site avec `VITE_DATA_BACKEND=supabase` et la clé VAPID publique.
2. Installez l'application sur un téléphone et ouvrez-la depuis son icône.
3. Connectez-vous avec un professeur puis touchez `Activer les notifications`.
4. Vérifiez dans `supabase/verify.sql` que ce professeur possède un appareil abonné.
5. Depuis un autre compte, publiez un message dans le Forum.
6. Fermez ou placez l'application en arrière-plan : le premier téléphone doit recevoir une
   notification système.
7. Touchez la notification : l'application doit ouvrir le Forum.
8. Depuis l'autre compte, effectuez une modification produisant une entrée dans
   `Modifications récentes` : une seconde notification doit arriver et ouvrir cet onglet.
9. Vérifiez qu'un utilisateur ne reçoit pas de notification pour sa propre action.

En cas d'échec, vérifiez dans cet ordre : la permission du téléphone, la présence de
`push_subscriptions`, les logs de la fonction Edge, l'historique des Database Webhooks, les quatre
secrets de la fonction et la correspondance entre les clés VAPID publique et privée.
