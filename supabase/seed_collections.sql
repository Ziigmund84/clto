-- Données initiales reprises de l ancien site cltobadminton.fr (octobre 2026)
create or replace function pg_temp.m(f text) returns text language sql immutable as
$$ select 'https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/clto-media/import/' || f $$;

-- Réglages généraux
insert into public.clto_settings(key, value) values
('club', jsonb_build_object(
  'name','CLTO Badminton',
  'fullname','Cercle Laïque des Tourelles Orléans Badminton',
  'season','2026-2027',
  'address','1 Boulevard de Québec, 45000 Orléans',
  'phone','06 65 29 63 72',
  'email','contact@cltobadminton.fr',
  'hours','<p><strong>Lundi et mardi</strong> : 9h30 – 16h, accueil au siège social</p><p><strong>Mercredi et jeudi</strong> : 9h30 – 16h, par téléphone, SMS, WhatsApp ou e-mail</p>',
  'logo', pg_temp.m('logo-android-chrome-512x512.webp'),
  'lat', 47.9148747, 'lng', 1.9024581)),
('links', jsonb_build_object(
  'helloasso','https://www.helloasso.com/associations/clto-badminton',
  'compte_joueur','https://www.gestion.cltobadminton.fr/',
  'myffbad','https://myffbad.fr/',
  'icbad','https://icbad.ffbad.org/',
  'facebook','https://www.facebook.com/cltoBadminton',
  'instagram','https://www.instagram.com/cltobadminton/',
  'linkedin','https://www.linkedin.com/company/clto-badminton/',
  'flickr','https://www.flickr.com/photos/200185781@N08/albums',
  'essai_qr','https://www.ffbad.org/')),
('stats', jsonb_build_object('main', jsonb_build_array(
   jsonb_build_object('value','346','label','adhérents cette saison'),
   jsonb_build_object('value','5','label','équipes en interclubs'),
   jsonb_build_object('value','57','suffix','h','label','de créneaux par semaine'),
   jsonb_build_object('value','6','label','gymnases à Orléans')),
 'more', jsonb_build_array(
   jsonb_build_object('value','50','label','bénévoles engagés'),
   jsonb_build_object('value','30','label','événements chaque saison'),
   jsonb_build_object('value','3','label','salariés, dont 2 entraîneurs diplômés'),
   jsonb_build_object('value','2','label','services civiques accueillis'),
   jsonb_build_object('value','1','label','équipe en Nationale 2')))),
('alert', jsonb_build_object('enabled', true,
  'title','Certains créneaux encadrés sont complets',
  'text','Adulte Intermédiaire (lundi 19h30–21h30), Adulte Débutant (mardi 20h–22h), Minime–Cadet (vendredi 18h15–20h) et Adulte Perfectionnement (mercredi 19h30–22h) ont atteint leur capacité maximale. Les inscriptions restent ouvertes pour les autres créneaux.')),
('president', jsonb_build_object('name','Steve Bandou-Naitoll','role','Président du CLTO Badminton','photo',null,
  'message','<p><strong>Chères adhérentes, chers adhérents, chers amis du CLTO Badminton,</strong></p><p>Le badminton évolue : nouveaux volants, nouveau classement, scoring en 15 points, évolution prochaine des Interclubs… Et le CLTO évolue avec lui.</p><p>Avec près de <strong>450 adhérents</strong>, notre club a grandi, mais notre ambition reste la même : permettre à chacun de trouver sa place, de la découverte au loisir, de la formation jusqu''au plus haut niveau.</p><p>Notre projet s''articule ainsi autour de cinq ambitions : <strong>Former, Jouer, Progresser, Construire et Rayonner</strong>. Cinq mots pour faire grandir notre club sans perdre ce qui fait son identité.</p><p>Car le CLTO, c''est aussi une histoire de transmission. Des jeunes accueillis hier sont aujourd''hui joueurs, entraîneurs, bénévoles, capitaines ou dirigeants et contribuent à construire le club de demain.</p><p>Ce nouveau site participe lui aussi à cette évolution : mieux informer, mieux accompagner et proposer de nouveaux services à nos adhérents.</p><p><strong>Demain, nous ne nous réunirons peut-être plus autour des mêmes plumes, mais nous continuerons de nous réunir autour de la même passion.</strong></p><p>Bienvenue au CLTO Badminton.</p>')),
('labels', jsonb_build_object('items', jsonb_build_array(
  jsonb_build_object('name','École Française de Badminton – 4 étoiles','image',pg_temp.m('ecoles_francaises_de_badminton_logo_4_etoiles_287556_fa30345747.webp')),
  jsonb_build_object('name','Label régional Argent – Convivialité','image',pg_temp.m('convivialite_f2932f4941.webp')),
  jsonb_build_object('name','Label régional Bronze – Santé et bien-être','image',pg_temp.m('sante_dc17b1a284.webp')),
  jsonb_build_object('name','Label régional Bronze – Bad pour toutes','image',pg_temp.m('pour_toutes_d868ae810f.webp')),
  jsonb_build_object('name','Club Avenir','image',pg_temp.m('5ba93c4834785_CLUBAVENIRFFSCCMJ_Npreview_e1599221071963_a570b12167.webp'))))),
('hero', jsonb_build_object(
  'title','Le badminton à Orléans, pour tout le monde.',
  'text','Depuis 1992, le CLTO Badminton accueille petits et grands, débutants et compétiteurs, dans six gymnases orléanais. Jeu libre, cours encadrés, stages et interclubs jusqu''en Nationale 2.',
  'image', pg_temp.m('Championnar_Ligue_26_4b4ce1d587.webp'),
  'image2', pg_temp.m('26_27_Affiche_N2_fa762ae830.webp'),
  'image3', pg_temp.m('Capture_d_ecran_2026_08_05_164101_509969ad8b.webp')))
on conflict (key) do update set value = excluded.value;

-- Gymnases
insert into public.clto_gyms(name,address,city,lat,lng,courts,position) values
('Jacques Barthélémy 1','11 rue Jeanne Jugan','45000 Orléans',47.9073295,1.9203028,7,1),
('Jacques Barthélémy 2','11 rue Jeanne Jugan','45000 Orléans',47.9070500,1.9207500,7,2),
('Georges Chardon','1 rue des Roses','45100 Orléans',47.8864938,1.9116633,7,3),
('Pierre Dessaux','Rue des Charretiers','45000 Orléans',47.8985530,1.8989378,4,4),
('Céline Lebrun','4 rue Georges Landré','45000 Orléans',47.9209433,1.9268376,7,5),
('Charles Péguy','14 rue Michel Royer','45100 Orléans',47.8877165,1.8983528,6,6);

-- Créneaux hebdomadaires (planning indicatif 2026-2027)
insert into public.clto_slots(day,start_time,end_time,gym,label,kind,audience,level,position) values
(1,'12:00','13:30','Jacques Barthélémy 1','Pratique libre','Jeu libre','Tous',null,1),
(1,'17:30','19:30','Georges Chardon','Entraînement Jeunes Élite et Perfectionnement','Entraînement','Jeunes','Élite',2),
(1,'18:00','20:00','Pierre Dessaux','Matchs Loisirs','Jeu libre','Adultes',null,3),
(1,'19:30','21:30','Georges Chardon','Entraînement Adultes Intermédiaire','Entraînement','Adultes','Intermédiaire',4),
(1,'21:30','22:00','Georges Chardon','Matchs Loisirs','Jeu libre','Adultes',null,5),
(2,'12:00','13:30','Jacques Barthélémy 1','Pratique libre','Jeu libre','Tous',null,1),
(2,'17:30','19:30','Georges Chardon','Entraînement Jeunes Élite et Perfectionnement','Entraînement','Jeunes','Élite',2),
(2,'18:00','20:00','Pierre Dessaux','Matchs Loisirs','Jeu libre','Adultes',null,3),
(2,'19:30','22:00','Georges Chardon','Matchs Compétiteurs','Jeu libre','Compétiteurs',null,4),
(2,'20:00','22:00','Charles Péguy','Entraînement Adultes Débutant','Entraînement','Adultes','Débutant',5),
(3,'17:30','19:00','Georges Chardon','Cours Poussins – Benjamins','Entraînement','Jeunes',null,1),
(3,'18:00','22:00','Pierre Dessaux','Matchs Loisirs','Jeu libre','Adultes',null,2),
(3,'19:30','22:00','Georges Chardon','Entraînement Adultes Élite','Entraînement','Adultes','Élite',3),
(3,'19:30','22:00','Céline Lebrun','Entraînement Adultes Perfectionnement','Entraînement','Adultes','Perfectionnement',4),
(4,'12:00','13:30','Jacques Barthélémy 1','Pratique libre','Jeu libre','Tous',null,1),
(4,'17:30','19:30','Georges Chardon','Entraînement Jeunes Élite et Perfectionnement','Entraînement','Jeunes','Élite',2),
(4,'18:00','22:00','Pierre Dessaux','Matchs Loisirs','Jeu libre','Adultes',null,3),
(4,'19:30','22:00','Georges Chardon','Entraînement Adultes Élite','Entraînement','Adultes','Élite',4),
(4,'20:00','22:00','Céline Lebrun','Entraînement Adultes Perfectionnement','Entraînement','Adultes','Perfectionnement',5),
(5,'13:00','14:00','Georges Chardon','Pratique libre','Jeu libre','Tous',null,1),
(5,'17:00','18:15','Georges Chardon','Cours Minibad – Baby-Bad','Entraînement','Jeunes',null,2),
(5,'18:15','20:00','Georges Chardon','Cours Minimes – Cadets','Entraînement','Jeunes',null,3),
(5,'19:30','23:00','Pierre Dessaux','Matchs préparation Interclubs','Jeu libre','Compétiteurs',null,4),
(5,'20:00','22:00','Georges Chardon','Matchs pour tous','Jeu libre','Tous',null,5),
(6,'09:30','12:30','Georges Chardon','Matchs pour tous','Jeu libre','Tous',null,1),
(7,'10:00','13:00','Jacques Barthélémy 2','Matchs pour tous','Jeu libre','Tous',null,1);

-- Tarifs 2026-2027
insert into public.clto_prices(category,label,price,details,position) values
('Licences','Baby-Bad / Minibad','120 €','1 cours encadré offert par semaine · part fédérale 28,85 €',1),
('Licences','Jeune','175 €','Hors Baby-Bad / Minibad · part fédérale 56,20 €',2),
('Licences','Adulte','195 €','Loisir & compétition · part fédérale 64,85 €',3),
('Licences','Extérieure Jeune','150 €','Accès au jeu libre Loisirs et Pour tous',4),
('Licences','Extérieure Adulte Loisir','150 €','Accès au jeu libre Loisirs et Pour tous',5),
('Licences','Extérieure Adulte Compétiteur','195 €','Accès au jeu libre Compétiteurs et Pour tous',6),
('Licences','Licence estivale','45 €','Tout âge, du 01/05/2027 au 31/08/2027',7),
('Licences','Licence non joueur','Gratuite','Prise en charge à 100 % par le club',8),
('Cours collectifs Jeunes','1 cours hebdomadaire','+ 50 €','Hors Baby-Bad et Minibad',1),
('Cours collectifs Jeunes','2 cours hebdomadaires','+ 100 €',null,2),
('Cours collectifs Jeunes','3 cours hebdomadaires','+ 125 €',null,3),
('Cours collectifs Adultes','1 cours Débutant / Intermédiaire','+ 100 €',null,1),
('Cours collectifs Adultes','1 cours Perfectionnement / Élite','+ 120 €',null,2),
('Cours collectifs Adultes','2 cours Perfectionnement / Élite','+ 140 €',null,3),
('Cours individuels','Club Avenir et Projet Jeune Talent','Gratuit','Sur sélection du coordinateur technique',1),
('Cours individuels','1 h – 1 personne','30 €',null,2),
('Cours individuels','1 h – 2 personnes','40 €','20 € par personne',3),
('Cours individuels','1 h – 3 personnes','45 €','15 € par personne',4),
('Cours individuels','Pack de 10 séances','270 €','1 personne / entraîneur',5);

-- Équipes interclubs
insert into public.clto_teams(name,division,description,image,link,position) values
('CLTO 1','Nationale 2 – Poule 3','L''équipe fanion du club, qui reçoit au gymnase Chardon.',pg_temp.m('Copie_de_N2_12f3927e04.webp'),'https://icbad.ffbad.org/',1),
('CLTO 2','Pré-Nationale – Poule régionale',null,null,'https://icbad.ffbad.org/',2),
('CLTO 3','Régionale 1 – Poule 1',null,null,'https://icbad.ffbad.org/',3),
('CLTO 4','Régionale 3 – Poule C',null,null,'https://icbad.ffbad.org/',4),
('CLTO 5','Départementale 1 – Poule B',null,null,'https://icbad.ffbad.org/',5);

-- Organigramme 2026-2027
insert into public.clto_people(name,role,grp,position) values
('Steve Bandou-Naitoll','Président','Conseil d''administration',1),
('Mathieu Alves','Vice-président vie sportive','Conseil d''administration',2),
('Philippe Maire','Trésorier','Conseil d''administration',3),
('Elodie Ricaud','Secrétaire','Conseil d''administration',4),
('Steve Bandou-Naitoll','Responsable commission informatique','Commissions',1),
('Maxime Baude','Membre commission informatique','Commissions',2),
('Mathilde Brochard','Responsable commission jeunes','Commissions',3),
('Bastien Chailloux','Responsable des équipes nationales','Commissions',4),
('Benjamin Gouit','Responsable soirées entreprises & tournois internes','Commissions',5),
('Martin Lamy','Responsable compétitions','Commissions',6),
('Valentin Martel','Responsable commission loisirs','Commissions',7),
('Elodie Ricaud','Responsable communication','Commissions',8),
('Benoit Soulard','Responsable partenariat','Commissions',9),
('Laurent Thorin','Responsable formations & officiels techniques','Commissions',10),
('Thomas Huboud-Perron','Coordinateur technique','Salariés',1),
('Yohan Henault','Entraîneur sportif (apprenti)','Salariés',2),
('Véronique Marchet','Assistante administrative et financière','Salariés',3),
('Halima Achahbar','Service civique','Services civiques',1),
('Clothilde Chieze','Service civique','Services civiques',2),
('Steve Bandou-Naitoll','Entraîneur bénévole','Entraîneurs bénévoles',1),
('Salma Agrebi','Ouvreur','Ouvreurs',1),('Yves Aussedat','Ouvreur','Ouvreurs',2),('Maxime Baude','Ouvreur','Ouvreurs',3),
('Gilles Becavin','Ouvreur','Ouvreurs',4),('Mathilde Brochard','Ouvreur','Ouvreurs',5),('Anthony Cavel','Ouvreur','Ouvreurs',6),
('Clothilde Chieze','Ouvreur','Ouvreurs',7),('Benjamin Gouit','Ouvreur','Ouvreurs',8),('Martin Lamy','Ouvreur','Ouvreurs',9),
('Chantal Leguay','Ouvreur','Ouvreurs',10),('Antoine Lolive','Ouvreur','Ouvreurs',11),('Philippe Maire','Ouvreur','Ouvreurs',12),
('Valentin Martel','Ouvreur','Ouvreurs',13),('Elodie Ricaud','Ouvreur','Ouvreurs',14),('Florent Sautereau','Ouvreur','Ouvreurs',15),
('Vincent Serin','Ouvreur','Ouvreurs',16),('Dorian Tissier','Ouvreur gymnase','Ouvreurs',17),('Benjamin Vu','Ouvreur','Ouvreurs',18);

-- Partenaires
insert into public.clto_partners(name,kind,logo,position) values
('Lardesports Orléans','Partenaires sportifs',pg_temp.m('Partenaire_Larde_Sports_ORLEANS_ece7f1f349.webp'),1),
('Victor','Partenaires sportifs',pg_temp.m('Partenaire_Victor_1759a451f9.webp'),2),
('Web & Co','Partenaires privés',pg_temp.m('Partenaire_Web_and_Co_e1238f18c6.webp'),1),
('Ninka Park','Partenaires privés',pg_temp.m('Partenaire_Ninka_Park_c6397b8de6.webp'),2),
('DS Carrelages','Partenaires privés',pg_temp.m('Partenaire_DS_Carrelages_44ff38d19e.webp'),3),
('Orex','Partenaires privés',pg_temp.m('Partenaire_Orex_ee2e7a13fb.webp'),4),
('Mairie d''Orléans','Partenaires institutionnels',pg_temp.m('Institutionnel_Mairie_Orleans_19cd132516.webp'),1),
('Fédération Française de Badminton','Partenaires institutionnels',pg_temp.m('logo_ffbad_379a885369.webp'),2),
('Région Centre-Val de Loire','Partenaires institutionnels',pg_temp.m('Institutionnel_Centre_Val_De_Loire_ff7ac5736e.webp'),3),
('Agence nationale du Sport','Partenaires institutionnels',pg_temp.m('Institutionnel_ANS_71b848a8c2.webp'),4),
('Département du Loiret','Partenaires institutionnels',pg_temp.m('Institutionnel_Departement_Loiret_f1b3790b40.webp'),5),
('Comité du Loiret de Badminton','Partenaires institutionnels',pg_temp.m('Badminton_Comite_Loiret_b29158cf03.webp'),6),
('Ligue Centre-Val de Loire de Badminton','Partenaires institutionnels',pg_temp.m('Badminton_Ligue_Centre_Val_De_Loire_09fdd8f94d.webp'),7),
('Service civique','Partenaires institutionnels',pg_temp.m('institutionnel_service_civique_eddcd374fb.webp'),8),
('Orléans Masters','Partenaires associatifs',pg_temp.m('Partenaire_Orleans_Masters_25e4c1b5ce.webp'),1),
('Solibad','Partenaires associatifs',pg_temp.m('Badminton_Label_solibad_9061deea1e.webp'),2);

-- Galerie (albums Flickr)
insert into public.clto_gallery(title,date,cover,url_album,category) values
('Championnat Ligues Séniors Argenton 2026','2026-03-07',pg_temp.m('Championnar_Ligue_26_4b4ce1d587.webp'),'https://www.flickr.com/photos/200185781@N08/albums/72177720335001366','Championnat'),
('Interclubs N3 25-26 – CLTO vs Seine Essonne','2026-01-17',pg_temp.m('Capture_d_ecran_2026_08_05_163849_b3ea1653c3.webp'),'https://www.flickr.com/photos/200185781@N08/albums/72177720330027830','Interclubs'),
('Interclubs N2/N3 – Saison 2024-2025','2024-09-13',pg_temp.m('Capture_d_ecran_2026_08_05_163547_4c09c6aa2a.webp'),'https://www.flickr.com/photos/200185781@N08/albums/72177720326583533/','Interclubs'),
('Nos Vieilles Plumes','2024-05-07',pg_temp.m('20240507_120525_a2487041e8.webp'),'https://www.flickr.com/photos/200185781@N08/albums/72177720335315121/','Vieilles Plumes'),
('Championnat de Ligue Jeunes 2024 à Orléans','2024-05-06',pg_temp.m('Capture_d_ecran_2026_08_05_164101_509969ad8b.webp'),'https://www.flickr.com/photos/200185781@N08/albums/72177720314920802','Championnat');

-- Documents
insert into public.clto_documents(title,category,url,position) values
('Autorisation parentale 2026-2027','Inscription',pg_temp.m('26_27_Autorisation_parentale_docx_Google_Docs_e87ef53d4a.pdf'),1),
('Certificat médical de non contre-indication','Inscription',pg_temp.m('Certificat_medical_de_non_contre_Indication_49c64b1512.pdf'),2),
('Questionnaire de santé – Mineurs','Inscription',pg_temp.m('FF_Ba_D_MINEURS_QUESTIONNAIRE_SANTE_725070d2cd.pdf'),3),
('Questionnaire de santé – Adultes','Inscription',pg_temp.m('FF_Ba_D_ADULTES_QUESTIONNAIRE_SANTE_042c4457ea.pdf'),4);

-- Historique & palmarès
insert into public.clto_timeline(date,title,text,kind) values
('1958-02-01','Création du Cercle Laïque des Tourelles','Naissance de l''association omnisports dont le club est issu.','histoire'),
('1992-09-01','Naissance de la section badminton','Une section badminton est créée au sein du CLTO Multisports.','histoire'),
('2006-01-01','Le CLTO Badminton devient indépendant',null,'histoire'),
('2012-07-10','Accession en Nationale 1','Les joueurs du CLTO accèdent à la Nationale 1 grâce à une victoire en barrages contre Guichen.','histoire'),
('2013-08-01','4 étoiles pour l''école de badminton','La FFBaD labellise le club École Française de Badminton, avec 4 étoiles sur 5.','histoire'),
('2014-10-01','Arrivée d''un 2e entraîneur','Avec les temps d''activités périscolaires et en accord avec la mairie d''Orléans, le club recrute un deuxième entraîneur.','histoire'),
('2015-06-01','Nouveau président','Après dix ans de présidence, Franck Laurent passe le relais à Philippe Maire.','histoire'),
('2016-11-01','Léonice Huet aux Championnats du monde','Espoir du badminton français née en 2000, elle dispute ses premiers championnats du monde sous les couleurs du CLTO.','histoire'),
('2018-02-04','Deux titres de championne de France','Léonice Huet est double championne de France (simple et double dames avec Vimala Hériau). Andréa Vanderstukken décroche le bronze en double dames.','histoire'),
('2018-09-10','Les Vieilles Plumes','Ouverture du premier créneau dédié aux 60 ans et plus.','histoire'),
('2019-01-17','Premier joueur au Championnat de France ParaBad','Nathan Chestier représente le club pour la première fois en ParaBad.','histoire'),
('2019-01-18','Le Championnat de France ParaBad 2019 au CLTO','Le club accueille la compétition nationale.','histoire'),
('2021-11-01','Nouveau président','Steve Bandou-Naitoll est élu président lors de l''assemblée générale.','histoire'),
('2022-09-01','Un nouvel entraîneur diplômé d''État','Arrivée de Thomas Huboud-Perron.','histoire'),
('2024-05-12','Argent aux France Jeunes','Anis Castello Abdellaoui, médaille d''argent en double hommes U13.','histoire'),
('2016-11-01','Championnat de France Séniors','Léonice Huet, double championne de France en simple et double dames.','palmares'),
('2016-11-01','Championnat de France Séniors','Andréa Vanderstukken, médaille de bronze en double dames.','palmares'),
('2022-08-01','Championnat d''Europe Vétérans','Participation de Marie Hermeline, en Slovénie.','palmares'),
('2023-05-27','Championnat de France Vétérans','Marie Hermeline, deux médailles de bronze en simple et double dames avec Weny Rasidi.','palmares'),
('2023-09-01','Championnat du monde','Participation de Marie Hermeline, en Corée du Sud.','palmares'),
('2024-05-12','Championnat de France Jeunes','Anis Castello Abdellaoui, médaille d''argent en double hommes U13.','palmares'),
('2024-08-01','Championnat d''Europe Vétérans','Participation de Marie Hermeline, en Belgique.','palmares'),
('2024-11-11','Championnat de France Vétérans','Marie Hermeline, bronze en simple et double dames avec Weny Rasidi.','palmares'),
('2026-03-14','Championnat régional Centre-Val de Loire','Mehdi Grzes, triple champion régional.','palmares'),
('2026-06-25','Championnat de France Vétérans','Marie Hermeline, bronze en double dames V2.','palmares'),
('2026-09-01','Championnat d''Europe Vétérans','Marie Hermeline, Chantal Leguay et Richard Sau à Cagliari (Italie).','palmares');

-- FAQ
insert into public.clto_faq(category,question,answer,position) values
('Pratique','Puis-je faire une séance d''essai avant de m''inscrire ?','<p>Oui. Le club propose jusqu''à deux séances d''essai gratuites. Une assurance FFBaD doit être activée le jour de chaque essai à l''aide du QR code prévu à cet effet (voir la page S''inscrire, rubrique Infos pratiques). Des raquettes de prêt sont disponibles.</p>',1),
('Inscription','Où trouver les tarifs et les modalités d''inscription ?','<p>Tout est réuni sur la page <a href="adherer.html">S''inscrire</a> : licences, cours encadrés, réductions, aides et moyens de paiement.</p>',2),
('Inscription','Puis-je m''inscrire en cours de saison ?','<p>Oui, dans la limite des places disponibles. Des tarifs réduits peuvent s''appliquer en cours de saison (−30 % sur les licences mi-saison).</p>',3),
('Pratique','Les volants sont-ils fournis ?','<p>Oui, sur les cours encadrés et sur les créneaux de jeu libre Loisirs. Pour les autres créneaux, renseignez-vous auprès de l''ouvreur.</p>',4),
('Pratique','Puis-je participer à plusieurs entraînements par semaine ?','<p>Oui, selon votre groupe et les places disponibles : jusqu''à trois cours collectifs pour les jeunes, jusqu''à deux pour les adultes Perfectionnement et Élite. Les créneaux de jeu libre restent accessibles toute la semaine.</p>',5),
('Pratique','Comment le groupe d''entraînement adulte est-il choisi ?','<p>Quatre niveaux sont proposés : <strong>Débutant</strong> (moins de 3 ans de pratique), <strong>Intermédiaire</strong> (plus de 3 ans, sans compétition régulière), <strong>Perfectionnement</strong> (compétiteurs classés D8 minimum) et <strong>Élite</strong> (compétiteurs classés R minimum). L''affectation se fait sur proposition de l''entraîneur.</p>',6),
('Compétition','La compétition est-elle obligatoire en cours encadré ?','<p>Non. Elle n''est pas demandée dans les groupes Débutant et Intermédiaire. Elle fait partie du parcours des groupes Perfectionnement et Élite.</p>',7),
('Compétition','Faut-il avoir déjà fait de la compétition pour rejoindre un groupe compétiteur ?','<p>Les groupes Perfectionnement et Élite s''adressent aux compétiteurs réguliers. Pour découvrir la compétition, le groupe Intermédiaire est le bon point de départ. Les jeux libres Compétiteurs sont réservés aux compétiteurs réguliers ; les autres joueurs ont les créneaux Loisirs et Pour tous.</p>',8),
('Compétition','Comment intégrer une équipe Interclubs ?','<p>Les équipes sont composées par les capitaines et l''équipe technique selon le niveau et les disponibilités. Faites-vous connaître auprès d''un entraîneur ou du responsable compétitions.</p>',9),
('Vie du club','Puis-je participer aux événements du club ?','<p>Oui. Tous les licenciés sont invités aux animations, stages, tournois internes et événements organisés par le club.</p>',10),
('Vie du club','Comment devenir bénévole ?','<p>Proposez votre aide ponctuellement ou régulièrement en contactant le club ou un membre du conseil d''administration. Voir la page <a href="benevolat.html">S''engager</a>.</p>',11);

-- Agenda : événements et stages
insert into public.clto_events(title,kind,date_start,date_end,time_text,location,audience,price,description,image,link,cta_label) values
('Moment convivial Halloween','Événement','2026-10-21',null,'19h – 22h','Gymnase Chardon','Licenciés',null,
 '<p>Forme ton équipe de 3 et embarque pour une soirée de défis, de rires et de surprises.</p><ul><li>3 matchs par équipe : un simple, un double et un 3 contre 3</li><li>1 match = 1 set de 15 points, poule unique par niveau</li><li>Concours de déguisements, récompenses individuelles et par équipe</li><li>Grand buffet partagé : chacun apporte un salé ou un sucré, les boissons sont offertes par le club</li></ul>',
 pg_temp.m('DATE_A_VENIR_36c429a29f.webp'),'https://docs.google.com/spreadsheets/d/1WyEiwvK3Xi_3pvgFpu4PafG-hfXIARsPZG7H6o-evfA/edit','Inscription bénévole'),
('Stage Toussaint jeunes et adultes','Stage','2026-10-26','2026-10-30','9h – 17h','Gymnase Chardon','Tous publics, tous niveaux','15 € – 35 €',
 '<p>Une semaine de stage mêlant séances collectives et entraînements individuels.</p><p><strong>Séances collectives</strong> : lundi et vendredi, de 9h à 17h.</p><p><strong>Séances individuelles</strong> : mardi, mercredi et jeudi, 5 créneaux d''1h30 par jour (9h, 10h30, 13h, 14h30, 16h), 2 joueurs maximum par entraîneur.</p>',
 pg_temp.m('26_27_Visuels_Stages_20260916_204203_0000_e49a302c9b.webp'),'https://www.helloasso.com/associations/clto-badminton','S''inscrire sur HelloAsso'),
('Stage Toussaint adultes','Stage','2026-10-27','2026-10-29','19h – 22h','Gymnases Lebrun et Dessaux','Adultes, tous niveaux','15 € – 20 €',
 '<p>Trois soirées de stage selon votre niveau.</p><ul><li>Mardi 19h–22h à Lebrun : joueurs N1 à R5</li><li>Mercredi 19h–22h à Lebrun : joueurs R6 à D9</li><li>Jeudi 19h–22h à Dessaux : joueurs P10 à NC</li></ul>',
 pg_temp.m('26_27_Visuels_Stages_20260916_204203_0000_e49a302c9b.webp'),'https://www.helloasso.com/associations/clto-badminton','S''inscrire sur HelloAsso'),
('Interclubs N2 : CLTO – ASPTT Strasbourg','Interclubs','2026-11-28',null,'15h45 – 18h','Gymnase Chardon','Supporters bienvenus',null,
 '<p>4e journée du championnat national interclubs, à domicile. Venez faire vibrer les tribunes de Chardon : allez les Bleus !</p>',
 pg_temp.m('26_27_Affiche_N2_fa762ae830.webp'),'https://docs.google.com/spreadsheets/d/1dyTOrPsD8QUaRHr0jEhIzERMva3wWosN4Hohlwh8Awc/edit','Inscription bénévole'),
('20es Plumes Écoresponsables d''Orléans','Tournoi','2026-12-05','2026-12-06','8h – 22h','Gymnase Gaston et Jacques Barthélémy','De N1 à NC',null,
 '<p>Le grand tournoi du club, presented by Victor : 380 joueurs de N1 à NC.</p><ul><li>Samedi : simple et mixte (combinaison simple/mixte interdite)</li><li>Dimanche : double</li><li>Buvette tout le week-end et stand Lardesports 100 % Victor / Forza</li></ul>',
 pg_temp.m('Publi_aa2b3b9abe.webp'),'https://docs.google.com/spreadsheets/d/1MTSW10_Mp7e0SluSYqQGZJ75XGvqNUu7QjSsM0Qs9Qk/edit','Inscription bénévole'),
('Interclubs N2 : CLTO – Val de Morteau','Interclubs','2027-01-30',null,'15h45 – 18h','Gymnase Chardon','Supporters bienvenus',null,
 '<p>7e journée du championnat national interclubs, à domicile. On compte sur vous dans les tribunes !</p>',
 pg_temp.m('26_27_Affiche_N2_2_146f835831.webp'),'https://docs.google.com/spreadsheets/d/1dyTOrPsD8QUaRHr0jEhIzERMva3wWosN4Hohlwh8Awc/edit','Inscription bénévole'),
('Stage d''hiver jeunes et adultes','Stage','2027-03-01','2027-03-05','9h – 17h','Gymnase à confirmer','Jeunes, tous niveaux','15 € – 35 €',
 '<p>Séances collectives lundi et vendredi, séances individuelles du mardi au jeudi (2 joueurs par entraîneur). Inscriptions bientôt ouvertes sur HelloAsso.</p>',
 pg_temp.m('26_27_Visuels_Stages_20260916_204203_0000_e49a302c9b.webp'),null,null),
('Stage d''hiver adultes','Stage','2027-03-02','2027-03-04','19h – 22h','Gymnase à confirmer','Adultes, tous niveaux','15 € – 20 €',
 '<p>Mardi pour les joueurs N1/R5, mercredi pour les R6/D9, jeudi pour les P10/NC. Inscriptions bientôt ouvertes sur HelloAsso.</p>',
 pg_temp.m('26_27_Visuels_Stages_20260916_204203_0000_e49a302c9b.webp'),null,null),
('Interclubs N2 : CLTO – Schwindratzheim','Interclubs','2027-03-20',null,'15h45 – 18h','Gymnase Chardon','Supporters bienvenus',null,
 '<p>8e journée du championnat national interclubs, à domicile.</p>',
 pg_temp.m('26_27_Affiche_N2_1_4cee876d1e.webp'),'https://docs.google.com/spreadsheets/d/1dyTOrPsD8QUaRHr0jEhIzERMva3wWosN4Hohlwh8Awc/edit','Inscription bénévole'),
('Stage de printemps jeunes et adultes','Stage','2027-04-26','2027-04-30','9h – 17h','Gymnase à confirmer','Jeunes, tous niveaux','15 € – 35 €',
 '<p>Séances collectives lundi et vendredi, séances individuelles du mardi au jeudi. Inscriptions bientôt ouvertes sur HelloAsso.</p>',
 pg_temp.m('26_27_Visuels_Stages_20260916_204203_0000_e49a302c9b.webp'),null,null);
