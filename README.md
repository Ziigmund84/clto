# Site du CLTO Badminton Orléans

Site statique multi-pages (HTML, CSS, JavaScript) publié avec GitHub Pages, dont les contenus sont gérés depuis un espace d'administration relié à Supabase (projet `harmonie-olivet`, tables préfixées `clto_`).

## Arborescence

- `src/pages/` : contenu de chaque page publique (à modifier ici).
- `tools/build.py` : assemble les pages complètes à la racine (`python3 tools/build.py`).
- `assets/css/site.css` : design du site. `assets/js/core.js` : en-tête, pied de page, animations, textes éditables. `assets/js/pages/` : un script par page.
- `admin/` : espace d'administration (`/admin/`).
- `supabase/` : schéma et données initiales.

## Administration

Connexion sur `/admin/` avec un compte Supabase présent dans la table `clto_admins`.
Rubriques : actualités, agenda et stages, galerie, documents, FAQ, histoire et palmarès, créneaux, gymnases, tarifs, équipes, organigramme, partenaires, textes des pages, réglages (coordonnées, bandeau d'information, chiffres, mot du président, labels, liens) et médiathèque.

Pour ajouter un administrateur : créer l'utilisateur dans Supabase (Authentication), puis
`insert into clto_admins(user_id) select id from auth.users where email = 'adresse@exemple.fr';`

## Technique

Supabase JS, GSAP (ScrollTrigger, MotionPath), Lenis, Leaflet et Quill sont chargés depuis des CDN. Aucune étape de compilation n'est nécessaire en dehors de `tools/build.py`.
