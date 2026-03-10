// ============================
// 🌱 LE POTAGER MALIN — DATA
// ============================

const MN = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const ME = ['❄️','🌧️','🌸','🌷','🌞','☀️','🔥','🌻','🍂','🎃','🍁','⛄'];
const MS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const DL = { easy:'😎 Facile', medium:'💪 Moyen', hard:'🔥 Costaud' };

// Half-month system: Jan début=0, Jan fin=1, Feb début=2 ... Dec fin=23
// Ranges: [[start, end], ...] inclusive

const PLANTS = [
  // ═══════ LÉGUMES ═══════
  {id:"tomate",n:"Tomate",e:"🍅",c:"legume",d:"easy",
    t:"Tuteure dès 30cm. Semis en intérieur début fév.",
    sow:[[2,7]],plant:[[8,11]],harvest:[[12,19]],
    spacing:50,row:70,perM2:3,yieldKg:5,
    family:"solanacee",serre:true},

  {id:"carotte",n:"Carotte",e:"🥕",c:"legume",d:"easy",
    t:"Sol léger sans cailloux, éclaircis à 5cm",
    sow:[[4,13]],plant:[],harvest:[[10,21]],
    spacing:5,row:25,perM2:60,yieldKg:0.07,
    family:"apiacee",serre:false},

  {id:"courgette",n:"Courgette",e:"🥒",c:"legume",d:"easy",
    t:"2-3 pieds suffisent, très productive !",
    sow:[[6,9]],plant:[[9,11]],harvest:[[12,19]],
    spacing:80,row:100,perM2:1,yieldKg:5,
    family:"cucurbitacee",serre:false},

  {id:"salade",n:"Salade / Laitue",e:"🥬",c:"legume",d:"easy",
    t:"Sème toutes les 2-3 semaines pour en avoir en continu",
    sow:[[4,17]],plant:[[6,19]],harvest:[[8,21]],
    spacing:25,row:30,perM2:12,yieldKg:0.3,
    family:"asteracee",serre:true},

  {id:"haricot",n:"Haricot vert",e:"🫘",c:"legume",d:"easy",
    t:"Sol à 15°C min, récolte tous les 2 jours",
    sow:[[8,13]],plant:[],harvest:[[12,19]],
    spacing:8,row:45,perM2:25,yieldKg:0.15,
    family:"fabacee",serre:false},

  {id:"poivron",n:"Poivron",e:"🫑",c:"legume",d:"medium",
    t:"Frileux ! Semis en intérieur, repique fin mai",
    sow:[[2,7]],plant:[[9,11]],harvest:[[14,19]],
    spacing:45,row:60,perM2:4,yieldKg:1.5,
    family:"solanacee",serre:true},

  {id:"piment",n:"Piment",e:"🌶️",c:"legume",d:"medium",
    t:"Comme le poivron mais encore plus de chaleur",
    sow:[[2,7]],plant:[[9,11]],harvest:[[14,19]],
    spacing:45,row:60,perM2:4,yieldKg:1,
    family:"solanacee",serre:true},

  {id:"aubergine",n:"Aubergine",e:"🍆",c:"legume",d:"medium",
    t:"Chaleur ++, paille bien le pied",
    sow:[[2,7]],plant:[[9,11]],harvest:[[14,19]],
    spacing:50,row:70,perM2:3,yieldKg:2,
    family:"solanacee",serre:true},

  {id:"radis",n:"Radis",e:"🔴",c:"legume",d:"easy",
    t:"Prêt en 3-4 semaines ! Top pour débuter",
    sow:[[4,17]],plant:[],harvest:[[6,19]],
    spacing:4,row:15,perM2:100,yieldKg:0.02,
    family:"brassicacee",serre:true},

  {id:"petitpois",n:"Petit pois",e:"🟢",c:"legume",d:"easy",
    t:"Sème tôt, aime le frais. Tuteure les grimpants",
    sow:[[2,7],[18,21]],plant:[],harvest:[[8,13]],
    spacing:5,row:50,perM2:30,yieldKg:0.1,
    family:"fabacee",serre:false},

  {id:"feve",n:"Fève",e:"🫛",c:"legume",d:"easy",
    t:"Résiste au froid ! Sème dès l'automne dans le sud",
    sow:[[0,5],[20,23]],plant:[],harvest:[[10,15]],
    spacing:15,row:40,perM2:15,yieldKg:0.2,
    family:"fabacee",serre:false},

  {id:"oignon",n:"Oignon",e:"🧅",c:"legume",d:"easy",
    t:"Bulbilles = plus facile que graines",
    sow:[[2,7],[16,19]],plant:[[4,9],[18,21]],harvest:[[12,17]],
    spacing:10,row:25,perM2:30,yieldKg:0.1,
    family:"alliacee",serre:false},

  {id:"echalote",n:"Échalote",e:"🧅",c:"legume",d:"easy",
    t:"Plante les bulbes à fleur de terre, sol drainé",
    sow:[],plant:[[0,5],[20,23]],harvest:[[12,17]],
    spacing:15,row:25,perM2:25,yieldKg:0.08,
    family:"alliacee",serre:false},

  {id:"ail",n:"Ail",e:"🧄",c:"legume",d:"easy",
    t:"Caïeux pointe en haut, plante surtout en automne",
    sow:[],plant:[[0,5],[18,23]],harvest:[[10,15]],
    spacing:12,row:25,perM2:30,yieldKg:0.04,
    family:"alliacee",serre:false},

  {id:"pdt",n:"Pomme de terre",e:"🥔",c:"legume",d:"easy",
    t:"Butte régulièrement, récolte quand ça jaunit",
    sow:[],plant:[[4,9]],harvest:[[10,17]],
    spacing:35,row:65,perM2:4,yieldKg:1.5,
    family:"solanacee",serre:false},

  {id:"patatedouce",n:"Patate douce",e:"🍠",c:"legume",d:"medium",
    t:"Besoin de chaleur. Plante les slips fin mai",
    sow:[],plant:[[9,11]],harvest:[[16,21]],
    spacing:35,row:75,perM2:3,yieldKg:1.5,
    family:"convolvulacee",serre:false},

  {id:"concombre",n:"Concombre",e:"🥒",c:"legume",d:"easy",
    t:"Palisse pour gagner de la place, arrose bien",
    sow:[[6,9]],plant:[[9,11]],harvest:[[12,19]],
    spacing:50,row:80,perM2:2,yieldKg:4,
    family:"cucurbitacee",serre:true},

  {id:"cornichon",n:"Cornichon",e:"🥒",c:"legume",d:"easy",
    t:"Comme le concombre mais récolte petit ! Tous les 2j",
    sow:[[6,9]],plant:[[9,11]],harvest:[[12,19]],
    spacing:50,row:80,perM2:2,yieldKg:3,
    family:"cucurbitacee",serre:false},

  {id:"potimarron",n:"Potimarron",e:"🎃",c:"legume",d:"easy",
    t:"Beaucoup d'espace, pince après 3-4 fruits",
    sow:[[6,9]],plant:[[9,11]],harvest:[[16,21]],
    spacing:100,row:150,perM2:0.5,yieldKg:8,
    family:"cucurbitacee",serre:false},

  {id:"butternut",n:"Butternut",e:"🎃",c:"legume",d:"easy",
    t:"Comme le potimarron, se conserve tout l'hiver",
    sow:[[6,9]],plant:[[9,11]],harvest:[[16,21]],
    spacing:100,row:150,perM2:0.5,yieldKg:6,
    family:"cucurbitacee",serre:false},

  {id:"epinard",n:"Épinard",e:"🌿",c:"legume",d:"easy",
    t:"Aime le frais, printemps et automne. Monte en été",
    sow:[[4,9],[16,19]],plant:[],harvest:[[8,13],[18,23]],
    spacing:12,row:25,perM2:30,yieldKg:0.15,
    family:"chenopodiacee",serre:true},

  {id:"mache",n:"Mâche",e:"🥬",c:"legume",d:"easy",
    t:"LA salade d'hiver ! Sème fin d'été",
    sow:[[14,19]],plant:[],harvest:[[0,7],[18,23]],
    spacing:8,row:15,perM2:60,yieldKg:0.05,
    family:"valerianacee",serre:true},

  {id:"roquette",n:"Roquette",e:"🥬",c:"legume",d:"easy",
    t:"Pousse vite, relevée. Mi-ombre en été",
    sow:[[6,17]],plant:[],harvest:[[8,21]],
    spacing:10,row:20,perM2:40,yieldKg:0.08,
    family:"brassicacee",serre:true},

  {id:"blette",n:"Blette / Poirée",e:"🥬",c:"legume",d:"easy",
    t:"Facile et productive, récolte feuille par feuille",
    sow:[[6,11]],plant:[[8,13]],harvest:[[12,23]],
    spacing:30,row:40,perM2:8,yieldKg:1,
    family:"chenopodiacee",serre:false},

  {id:"poireau",n:"Poireau",e:"🥬",c:"legume",d:"medium",
    t:"Repique profond = long fût blanc",
    sow:[[2,7]],plant:[[8,13]],harvest:[[0,3],[16,23]],
    spacing:12,row:35,perM2:20,yieldKg:0.25,
    family:"alliacee",serre:false},

  {id:"betterave",n:"Betterave",e:"🟣",c:"legume",d:"easy",
    t:"Éclaircis à 10cm, se conserve super bien",
    sow:[[6,11]],plant:[],harvest:[[12,21]],
    spacing:12,row:25,perM2:30,yieldKg:0.2,
    family:"chenopodiacee",serre:false},

  {id:"chou",n:"Chou",e:"🥦",c:"legume",d:"medium",
    t:"Filet anti-piérides obligatoire !",
    sow:[[4,11]],plant:[[8,13]],harvest:[[14,23]],
    spacing:50,row:60,perM2:3,yieldKg:2,
    family:"brassicacee",serre:false},

  {id:"navet",n:"Navet",e:"🤍",c:"legume",d:"easy",
    t:"Pousse vite ! Top en culture d'automne",
    sow:[[4,9],[14,17]],plant:[],harvest:[[8,13],[18,23]],
    spacing:10,row:25,perM2:30,yieldKg:0.15,
    family:"brassicacee",serre:false},

  {id:"panais",n:"Panais",e:"🥕",c:"legume",d:"easy",
    t:"Légume ancien, goût noisette. Supporte le gel",
    sow:[[4,11]],plant:[],harvest:[[0,3],[16,23]],
    spacing:10,row:30,perM2:25,yieldKg:0.2,
    family:"apiacee",serre:false},

  {id:"celeri",n:"Céleri",e:"🥬",c:"legume",d:"hard",
    t:"Long à démarrer, garde le sol humide",
    sow:[[2,7]],plant:[[8,11]],harvest:[[16,23]],
    spacing:30,row:40,perM2:8,yieldKg:0.8,
    family:"apiacee",serre:false},

  {id:"fenouil",n:"Fenouil",e:"🌾",c:"legume",d:"medium",
    t:"Sème en place, déteste le repiquage. Butte le bulbe",
    sow:[[10,15]],plant:[],harvest:[[16,21]],
    spacing:25,row:40,perM2:10,yieldKg:0.3,
    family:"apiacee",serre:false},

  {id:"mais",n:"Maïs doux",e:"🌽",c:"legume",d:"easy",
    t:"En bloc (pas en ligne) pour la pollinisation",
    sow:[[8,11]],plant:[],harvest:[[14,19]],
    spacing:30,row:60,perM2:5,yieldKg:0.3,
    family:"poacee",serre:false},

  {id:"topinambour",n:"Topinambour",e:"🌻",c:"legume",d:"easy",
    t:"Increvable ! Attention, envahissant",
    sow:[],plant:[[4,7]],harvest:[[0,5],[20,23]],
    spacing:40,row:60,perM2:4,yieldKg:1.5,
    family:"asteracee",serre:false},

  // ═══════ FRUITS ═══════
  {id:"fraise",n:"Fraise",e:"🍓",c:"fruit",d:"easy",
    t:"Paille le pied, stolons = nouveaux plants",
    sow:[],plant:[[4,7],[16,19]],harvest:[[8,15]],
    spacing:30,row:45,perM2:8,yieldKg:0.35,
    family:"rosacee",serre:true},

  {id:"framboise",n:"Framboise",e:"🫐",c:"fruit",d:"easy",
    t:"Plante en automne, taille les cannes sèches",
    sow:[],plant:[[4,7],[20,23]],harvest:[[10,19]],
    spacing:40,row:100,perM2:2,yieldKg:1.5,
    family:"rosacee",serre:false},

  {id:"melon",n:"Melon",e:"🍈",c:"fruit",d:"hard",
    t:"Chaleur ++, pince après 3-4 fruits",
    sow:[[4,9]],plant:[[9,11]],harvest:[[14,19]],
    spacing:80,row:120,perM2:1,yieldKg:3,
    family:"cucurbitacee",serre:true},

  {id:"pasteque",n:"Pastèque",e:"🍉",c:"fruit",d:"hard",
    t:"Soleil ++, patience, besoin d'espace",
    sow:[[4,9]],plant:[[9,11]],harvest:[[14,19]],
    spacing:100,row:150,perM2:0.5,yieldKg:5,
    family:"cucurbitacee",serre:false},

  {id:"rhubarbe",n:"Rhubarbe",e:"🌿",c:"fruit",d:"easy",
    t:"Vivace ! Plante une fois, récolte des années",
    sow:[],plant:[[4,7],[18,21]],harvest:[[6,13]],
    spacing:80,row:100,perM2:1,yieldKg:3,
    family:"polygonacee",serre:false},

  {id:"groseille",n:"Groseille",e:"🔴",c:"fruit",d:"easy",
    t:"Arbuste facile, taille en hiver pour aérer",
    sow:[],plant:[[4,7],[20,23]],harvest:[[10,15]],
    spacing:100,row:150,perM2:0.5,yieldKg:3,
    family:"grossulariacee",serre:false},

  // ═══════ AROMATES ═══════
  {id:"basilic",n:"Basilic",e:"🌿",c:"aromate",d:"easy",
    t:"Pince les fleurs pour + de feuilles !",
    sow:[[6,9]],plant:[[9,11]],harvest:[[10,19]],
    spacing:20,row:30,perM2:15,yieldKg:0.15,
    family:"lamiacee",serre:true},

  {id:"persil",n:"Persil",e:"🌿",c:"aromate",d:"easy",
    t:"Trempe 24h avant semis, lent à lever",
    sow:[[4,15]],plant:[],harvest:[[8,21]],
    spacing:15,row:25,perM2:20,yieldKg:0.1,
    family:"apiacee",serre:true},

  {id:"ciboulette",n:"Ciboulette",e:"🌱",c:"aromate",d:"easy",
    t:"Vivace et increvable, divise tous les 3 ans",
    sow:[[4,9]],plant:[[6,11],[16,19]],harvest:[[6,21]],
    spacing:15,row:20,perM2:25,yieldKg:0.1,
    family:"alliacee",serre:false},

  {id:"menthe",n:"Menthe",e:"🌿",c:"aromate",d:"easy",
    t:"⚠️ Envahissante ! Plante en pot enterré",
    sow:[[6,9]],plant:[[6,11],[16,19]],harvest:[[8,19]],
    spacing:30,row:30,perM2:10,yieldKg:0.2,
    family:"lamiacee",serre:false},

  {id:"thym",n:"Thym",e:"🌿",c:"aromate",d:"easy",
    t:"Sec + soleil = bonheur. Increvable",
    sow:[[6,9]],plant:[[6,11],[18,21]],harvest:[[0,23]],
    spacing:25,row:30,perM2:12,yieldKg:0.1,
    family:"lamiacee",serre:false},

  {id:"romarin",n:"Romarin",e:"🌿",c:"aromate",d:"easy",
    t:"Persistant, les abeilles adorent",
    sow:[[6,9]],plant:[[6,11],[18,21]],harvest:[[0,23]],
    spacing:50,row:60,perM2:3,yieldKg:0.3,
    family:"lamiacee",serre:false},

  {id:"coriandre",n:"Coriandre",e:"🌿",c:"aromate",d:"medium",
    t:"Mi-ombre, monte vite en graines l'été",
    sow:[[6,11],[16,19]],plant:[],harvest:[[10,21]],
    spacing:15,row:25,perM2:20,yieldKg:0.08,
    family:"apiacee",serre:false},

  {id:"aneth",n:"Aneth",e:"🌿",c:"aromate",d:"easy",
    t:"Se ressème tout seul ! Top avec le poisson",
    sow:[[6,11]],plant:[],harvest:[[10,19]],
    spacing:20,row:30,perM2:15,yieldKg:0.08,
    family:"apiacee",serre:false},

  {id:"cerfeuil",n:"Cerfeuil",e:"🌿",c:"aromate",d:"easy",
    t:"Classique français, mi-ombre, aime le frais",
    sow:[[4,9],[16,19]],plant:[],harvest:[[8,13],[20,23]],
    spacing:15,row:20,perM2:25,yieldKg:0.08,
    family:"apiacee",serre:false},

  {id:"estragon",n:"Estragon",e:"🌿",c:"aromate",d:"easy",
    t:"Vivace. Prends du français, pas du russe !",
    sow:[],plant:[[6,11],[18,19]],harvest:[[8,19]],
    spacing:40,row:50,perM2:5,yieldKg:0.15,
    family:"asteracee",serre:false},

  {id:"sauge",n:"Sauge",e:"🌿",c:"aromate",d:"easy",
    t:"Vivace et médicinale, taille après floraison",
    sow:[[6,9]],plant:[[8,11],[18,19]],harvest:[[8,21]],
    spacing:35,row:40,perM2:7,yieldKg:0.12,
    family:"lamiacee",serre:false},

  {id:"origan",n:"Origan",e:"🌿",c:"aromate",d:"easy",
    t:"Top séché ! Famille de la marjolaine",
    sow:[[6,9]],plant:[[8,11],[18,19]],harvest:[[10,19]],
    spacing:30,row:35,perM2:9,yieldKg:0.1,
    family:"lamiacee",serre:false},

  {id:"lavande",n:"Lavande",e:"💜",c:"aromate",d:"easy",
    t:"Sol pauvre et drainé, taille en boule",
    sow:[],plant:[[4,9],[18,21]],harvest:[[10,17]],
    spacing:50,row:60,perM2:3,yieldKg:0.2,
    family:"lamiacee",serre:false},
];

// ═══════ COMPANION PLANTING ═══════
// +1 = bonne association, -1 = mauvaise association
// Only store one direction (a→b), lookup checks both
const COMPANIONS = [
  // TOMATE
  ["tomate","basilic",1],["tomate","carotte",1],["tomate","celeri",1],
  ["tomate","oignon",1],["tomate","poireau",1],["tomate","salade",1],
  ["tomate","persil",1],["tomate","epinard",1],["tomate","radis",1],
  ["tomate","poivron",1],["tomate","chou",-1],["tomate","betterave",-1],
  ["tomate","petitpois",-1],["tomate","fenouil",-1],["tomate","pdt",-1],
  ["tomate","concombre",-1],

  // CAROTTE
  ["carotte","oignon",1],["carotte","poireau",1],["carotte","petitpois",1],
  ["carotte","radis",1],["carotte","salade",1],["carotte","romarin",1],
  ["carotte","sauge",1],["carotte","ciboulette",1],["carotte","aneth",-1],

  // HARICOT
  ["haricot","chou",1],["haricot","celeri",1],["haricot","concombre",1],
  ["haricot","courgette",1],["haricot","salade",1],["haricot","mais",1],
  ["haricot","pdt",1],["haricot","radis",1],["haricot","fraise",1],
  ["haricot","aubergine",1],
  ["haricot","ail",-1],["haricot","oignon",-1],["haricot","poireau",-1],
  ["haricot","echalote",-1],["haricot","ciboulette",-1],

  // COURGETTE / COURGES
  ["courgette","haricot",1],["courgette","petitpois",1],["courgette","radis",1],
  ["courgette","mais",1],["courgette","menthe",1],
  ["courgette","pdt",-1],["courgette","fenouil",-1],

  // SALADE
  ["salade","betterave",1],["salade","carotte",1],["salade","radis",1],
  ["salade","petitpois",1],["salade","haricot",1],["salade","poireau",1],
  ["salade","fraise",1],["salade","chou",1],["salade","oignon",1],

  // POIVRON / AUBERGINE
  ["poivron","aubergine",1],["poivron","basilic",1],["poivron","carotte",1],
  ["poivron","oignon",1],["poivron","fenouil",-1],

  // OIGNON / AIL / ÉCHALOTE
  ["oignon","betterave",1],["oignon","chou",1],["oignon","carotte",1],
  ["oignon","fraise",1],["oignon","romarin",1],
  ["ail","salade",1],["ail","chou",1],["ail","pdt",1],
  ["ail","fraise",1],["ail","carotte",1],
  ["ail","petitpois",-1],["ail","feve",-1],

  // PETIT POIS / FÈVE
  ["petitpois","carotte",1],["petitpois","celeri",1],["petitpois","mais",1],
  ["petitpois","concombre",1],["petitpois","radis",1],
  ["petitpois","oignon",-1],["petitpois","ail",-1],["petitpois","echalote",-1],
  ["petitpois","poireau",-1],
  ["feve","epinard",1],["feve","salade",1],["feve","mais",1],

  // CONCOMBRE
  ["concombre","haricot",1],["concombre","salade",1],["concombre","mais",1],
  ["concombre","aneth",1],["concombre","petitpois",1],["concombre","chou",1],
  ["concombre","pdt",-1],

  // CHOU
  ["chou","betterave",1],["chou","celeri",1],["chou","epinard",1],
  ["chou","petitpois",1],["chou","salade",1],

  // POMME DE TERRE
  ["pdt","haricot",1],["pdt","petitpois",1],["pdt","chou",1],
  ["pdt","epinard",1],["pdt","salade",1],

  // FRAISE
  ["fraise","epinard",1],["fraise","thym",1],["fraise","sauge",1],
  ["fraise","chou",-1],

  // MAIS — "Three Sisters"
  ["mais","haricot",1],["mais","courgette",1],["mais","potimarron",1],

  // FENOUIL — mauvais avec presque tout
  ["fenouil","salade",1],
  ["fenouil","aubergine",-1],["fenouil","chou",-1],
  ["fenouil","haricot",-1],["fenouil","petitpois",-1],

  // AROMATES
  ["basilic","aubergine",1],["basilic","poivron",1],
  ["romarin","carotte",1],["romarin","chou",1],["romarin","haricot",1],
  ["thym","chou",1],["thym","fraise",1],
  ["sauge","carotte",1],["sauge","chou",1],
  ["menthe","chou",1],["menthe","tomate",1],
  ["aneth","concombre",1],["aneth","salade",1],["aneth","chou",1],
  ["cerfeuil","salade",1],["cerfeuil","radis",1],
  ["lavande","carotte",1],["lavande","romarin",1],
];

// ═══════ FAMILY ROTATION GROUPS ═══════
const FAMILY_NAMES = {
  solanacee: "🍅 Solanacées (tomate, poivron, aubergine, pdt)",
  cucurbitacee: "🎃 Cucurbitacées (courgette, concombre, courge, melon)",
  fabacee: "🫘 Fabacées (haricot, pois, fève) — fixent l'azote",
  brassicacee: "🥦 Brassicacées (chou, radis, navet, roquette)",
  apiacee: "🥕 Apiacées (carotte, persil, céleri, fenouil, panais)",
  alliacee: "🧅 Alliacées (oignon, ail, poireau, échalote, ciboulette)",
  asteracee: "🥬 Astéracées (salade, topinambour, estragon)",
  chenopodiacee: "🌿 Chénopodiacées (épinard, betterave, blette)",
  lamiacee: "🌿 Lamiacées (basilic, thym, romarin, menthe, sauge, lavande)",
  rosacee: "🍓 Rosacées (fraise, framboise)",
};

const CARE_DATA = {
  "tomate": {
    water: "💧💧💧 Régulier, 2-3x/sem en été. Au pied, jamais le feuillage !",
    sun: "☀️ Plein soleil (6h+ par jour)",
    soil: "Riche, bien drainé, pH 6-7. Apporter du compost à la plantation",
    pruning: "Pincer les gourmands, tuteurer. Supprimer les feuilles jaunies du bas",
    harvest_tips: "Récolter quand le fruit est bien coloré et se détache facilement",
    diseases: "Mildiou (taches brunes) → traiter au cuivre. Oïdium → soufre"
  },
  "carotte": {
    water: "💧💧 Modéré, garder le sol frais mais pas détrempé",
    sun: "☀️ Soleil à mi-ombre légère",
    soil: "Léger, sableux, sans cailloux ni fumier frais. Bien ameubli en profondeur",
    pruning: "Éclaircir à 3-5 cm quand les plants ont 3-4 feuilles",
    harvest_tips: "Arracher quand le collet dépasse 2-3 cm. Tirer délicatement ou soulever à la fourche",
    diseases: "Mouche de la carotte → voile anti-insectes. Alterner les rangs avec des poireaux"
  },
  "courgette": {
    water: "💧💧💧 Abondant et régulier, au pied. Pailler pour garder l'humidité",
    sun: "☀️ Plein soleil, emplacement chaud et abrité",
    soil: "Très riche, bien amendé en compost. Peut être plantée sur un tas de compost",
    pruning: "Pas de taille nécessaire. Supprimer les feuilles abîmées ou malades",
    harvest_tips: "Cueillir jeune (15-20 cm) pour plus de saveur. Récolter très régulièrement",
    diseases: "Oïdium (feutrage blanc) → pulvériser du lait dilué ou du soufre"
  },
  "salade": {
    water: "💧💧 Régulier, maintenir le sol frais. Arroser en pluie fine le soir",
    sun: "☀️ Soleil à mi-ombre (apprécie l'ombre en été pour éviter la montée en graines)",
    soil: "Frais, léger, riche en humus",
    pruning: "Éclaircir les semis à 25 cm. Couper les feuilles extérieures pour les variétés à couper",
    harvest_tips: "Couper le matin au ras du sol ou cueillir feuille à feuille selon la variété",
    diseases: "Limaces → pièges à bière ou cendres autour des plants. Pucerons → savon noir"
  },
  "haricot": {
    water: "💧💧 Modéré, arroser surtout à la floraison et formation des gousses",
    sun: "☀️ Plein soleil, emplacement chaud",
    soil: "Léger, pas trop riche (les haricots fixent l'azote). Éviter le fumier frais",
    pruning: "Butter les pieds quand ils ont 15 cm. Tuteurer les grimpants (rames)",
    harvest_tips: "Cueillir les verts avant que les grains ne se forment. Récolter tous les 2-3 jours",
    diseases: "Anthracnose → éviter de mouiller le feuillage. Pucerons noirs → savon noir"
  },
  "poivron": {
    water: "💧💧💧 Régulier, le sol doit rester frais. Arroser au pied à l'eau tiède",
    sun: "☀️ Plein soleil, chaleur indispensable. Abriter du vent",
    soil: "Riche, bien drainé, réchauffé. Apporter compost et engrais potassique",
    pruning: "Supprimer la première fleur (fleur de la couronne) pour favoriser la ramification",
    harvest_tips: "Cueillir vert ou attendre la coloration complète (rouge, jaune) pour plus de douceur",
    diseases: "Pucerons → savon noir. Pourriture apicale (cul noir) → arrosage régulier + calcium"
  },
  "piment": {
    water: "💧💧 Modéré, laisser sécher légèrement entre les arrosages. Le stress hydrique augmente le piquant",
    sun: "☀️ Plein soleil, maximum de chaleur. Idéal contre un mur exposé sud",
    soil: "Riche, bien drainé, réchauffé. Apporter du compost bien décomposé",
    pruning: "Pincer la première fleur. Tuteurer si nécessaire",
    harvest_tips: "Récolter quand le piment a atteint sa couleur finale. Plus il mûrit, plus il est piquant",
    diseases: "Pucerons → savon noir. Araignées rouges → brumiser le feuillage"
  },
  "aubergine": {
    water: "💧💧💧 Régulier et abondant, au pied. Ne jamais laisser le sol sécher",
    sun: "☀️ Plein soleil, très exigeante en chaleur. La plus frileuse des solanacées",
    soil: "Très riche, profond, bien drainé. Pailler généreusement",
    pruning: "Tailler à 2-3 branches principales. Limiter à 5-6 fruits par pied",
    harvest_tips: "Cueillir quand la peau est brillante. Si elle devient mate, le fruit est trop mûr",
    diseases: "Doryphore → ramassage manuel. Mildiou → cuivre en préventif"
  },
  "radis": {
    water: "💧💧 Régulier, maintenir le sol frais. Un manque d'eau rend les radis piquants et creux",
    sun: "☀️ Soleil à mi-ombre (mi-ombre en été)",
    soil: "Léger, sableux, sans cailloux. Pas besoin de sol très riche",
    pruning: "Éclaircir à 3 cm pour les radis ronds, 5 cm pour les longs",
    harvest_tips: "Récolter dès qu'ils affleurent (3-4 semaines après semis). Ne pas attendre, ils deviennent creux",
    diseases: "Altise (petits trous) → voile anti-insectes. Arroser régulièrement les repousse"
  },
  "petitpois": {
    water: "💧💧 Modéré, arroser surtout à la floraison. Pailler pour garder la fraîcheur",
    sun: "☀️ Soleil à mi-ombre légère. Supporte mal les fortes chaleurs",
    soil: "Frais, léger, pas trop riche (légumineuse qui fixe l'azote)",
    pruning: "Butter les pieds à 10-15 cm. Installer des rames pour les variétés grimpantes",
    harvest_tips: "Récolter les mangetout jeunes. Pour les petits pois à écosser, quand les gousses sont bien remplies",
    diseases: "Oïdium → soufre. Tordeuse du pois → filet anti-insectes"
  },
  "feve": {
    water: "💧💧 Modéré, la fève est assez résistante à la sécheresse une fois installée",
    sun: "☀️ Plein soleil",
    soil: "Argileux accepté, frais et profond. Légumineuse fixatrice d'azote",
    pruning: "Pincer les têtes dès que les premières gousses se forment (limite les pucerons aussi)",
    harvest_tips: "Récolter jeune pour manger avec la peau, ou à maturité pour écosser",
    diseases: "Pucerons noirs (très fréquents) → pincer les sommets, savon noir, coccinelles"
  },
  "oignon": {
    water: "💧 Peu, arroser uniquement en cas de sécheresse prolongée. Stopper l'arrosage 2 sem avant récolte",
    sun: "☀️ Plein soleil",
    soil: "Léger, drainant, pas de fumier frais. Sol trop humide = pourriture",
    pruning: "Pas de taille. Ne pas butter. Désherber régulièrement",
    harvest_tips: "Récolter quand le feuillage jaunit et se couche. Laisser sécher au sol 2-3 jours",
    diseases: "Mildiou de l'oignon → cuivre. Mouche de l'oignon → alterner avec des carottes"
  },
  "echalote": {
    water: "💧 Très peu, comme l'oignon. Un excès d'eau fait pourrir les bulbes",
    sun: "☀️ Plein soleil",
    soil: "Léger, bien drainé, sableux idéal. Pas de fumier frais ni sol lourd",
    pruning: "Aucune taille. Désherber à la main sans blesser les bulbes",
    harvest_tips: "Récolter quand le feuillage est complètement sec. Sécher à l'abri avant stockage",
    diseases: "Pourriture blanche → rotation longue (5 ans). Ne jamais replanter au même endroit"
  },
  "ail": {
    water: "💧 Très peu, l'ail déteste l'humidité. Ne pas arroser après juin",
    sun: "☀️ Plein soleil",
    soil: "Très drainant, léger, même pauvre. Jamais de fumier frais, jamais d'excès d'eau",
    pruning: "Nouer les fanes quand elles jaunissent pour forcer le grossissement du bulbe",
    harvest_tips: "Récolter quand les feuilles sont aux 2/3 sèches. Laisser sécher 2-3 semaines à l'abri",
    diseases: "Rouille (taches oranges) → éviter l'humidité. Pourriture blanche → rotation 5 ans"
  },
  "pdt": {
    water: "💧💧 Modéré, arroser par temps sec surtout à la floraison. Ne pas mouiller le feuillage",
    sun: "☀️ Plein soleil",
    soil: "Meuble, profond, légèrement acide. Enrichi en compost bien décomposé",
    pruning: "Butter les plants quand ils atteignent 20-25 cm (2 à 3 buttages). Cela augmente le rendement",
    harvest_tips: "Primeurs : récolter à la floraison. Conservation : attendre que le feuillage soit fané",
    diseases: "Mildiou → traiter au cuivre dès les premiers signes. Doryphore → ramassage manuel"
  },
  "patatedouce": {
    water: "💧💧 Modéré mais régulier, surtout au début. Réduire en fin de culture",
    sun: "☀️ Plein soleil, maximum de chaleur. Culture sous serre recommandée au nord",
    soil: "Léger, sableux, bien drainé. Pas trop riche en azote (sinon trop de feuilles, peu de tubercules)",
    pruning: "Pas de taille. Les tiges rampantes couvrent le sol naturellement (effet paillage vivant)",
    harvest_tips: "Récolter avant les premières gelées quand le feuillage jaunit. Manipuler avec soin, la peau est fragile",
    diseases: "Peu de maladies en France. Attention aux campagnols qui grignotent les tubercules"
  },
  "concombre": {
    water: "💧💧💧 Abondant et très régulier. Le concombre est composé à 95% d'eau !",
    sun: "☀️ Plein soleil, chaleur nécessaire. Abriter du vent",
    soil: "Très riche, humifère, bien drainé. Pailler généreusement",
    pruning: "Pincer la tige principale après 4 feuilles pour favoriser les ramifications",
    harvest_tips: "Cueillir jeune (20-25 cm) avant que les graines ne grossissent. Récolter régulièrement",
    diseases: "Oïdium → lait dilué ou soufre. Acariens → brumiser le feuillage"
  },
  "cornichon": {
    water: "💧💧💧 Abondant et régulier, comme le concombre. Ne jamais laisser le sol sécher",
    sun: "☀️ Plein soleil, emplacement chaud",
    soil: "Riche, humifère, frais mais bien drainé",
    pruning: "Pincer après 4 feuilles. Tuteurer sur un grillage pour faciliter la récolte",
    harvest_tips: "Récolter chaque jour quand ils font 5-8 cm. Ils grossissent très vite !",
    diseases: "Oïdium → soufre ou lait dilué. Limaces → pièges ou barrières"
  },
  "potimarron": {
    water: "💧💧 Modéré, arroser au pied 1-2x/sem. Pailler pour conserver l'humidité",
    sun: "☀️ Plein soleil, chaleur appréciée",
    soil: "Très riche, profond. Planter sur un lit de compost ou au bord du tas de compost",
    pruning: "Pincer après 4-5 feuilles sur chaque tige. Limiter à 3-4 fruits par pied",
    harvest_tips: "Récolter quand le pédoncule est sec et liégeux. La peau doit être bien dure",
    diseases: "Oïdium → traiter au soufre. Limaces sur les jeunes plants → protéger"
  },
  "butternut": {
    water: "💧💧 Modéré, arroser régulièrement au pied. Pailler le sol",
    sun: "☀️ Plein soleil, chaleur indispensable",
    soil: "Très riche, profond, bien amendé. Apporter du compost généreusement",
    pruning: "Pincer les tiges après 5 feuilles. Limiter à 3-4 fruits par pied pour qu'ils grossissent",
    harvest_tips: "Récolter avant les gelées quand le pédoncule est sec. Laisser mûrir 1 mois après récolte",
    diseases: "Oïdium → soufre. Les courges sont globalement résistantes aux maladies"
  },
  "epinard": {
    water: "💧💧 Régulier, garder le sol toujours frais. L'épinard monte vite en graines s'il a soif",
    sun: "☀️ Mi-ombre en été, soleil au printemps/automne. Craint la chaleur",
    soil: "Riche, frais, humifère. Apprécie un sol qui retient l'eau",
    pruning: "Éclaircir à 10-15 cm. Couper les hampes florales dès leur apparition",
    harvest_tips: "Cueillir les feuilles extérieures au fur et à mesure, en laissant le cœur pousser",
    diseases: "Mildiou → aérer les plants, éviter l'arrosage par aspersion. Limaces → protéger"
  },
  "mache": {
    water: "💧💧 Régulier mais léger. Le sol doit rester frais sans être gorgé d'eau",
    sun: "☀️ Soleil à mi-ombre. Culture d'automne/hiver, supporte le froid",
    soil: "Ferme et tassé (ne pas bêcher avant semis !). Tout type de sol convient",
    pruning: "Pas de taille. Éclaircir si nécessaire à 8-10 cm",
    harvest_tips: "Couper la rosette entière au ras du sol. Récolter tout l'hiver selon les besoins",
    diseases: "Très résistante. Attention aux limaces à l'automne"
  },
  "roquette": {
    water: "💧💧 Régulier, garder le sol frais pour éviter un goût trop piquant",
    sun: "☀️ Mi-ombre en été, soleil le reste de l'année. Monte vite en graines au soleil brûlant",
    soil: "Frais, ordinaire, pas d'exigence particulière",
    pruning: "Couper les fleurs dès leur apparition pour prolonger la récolte de feuilles",
    harvest_tips: "Cueillir les jeunes feuilles régulièrement. Elles repoussent rapidement",
    diseases: "Altise (petits trous) → voile anti-insectes et arrosage régulier"
  },
  "blette": {
    water: "💧💧💧 Régulier et abondant. La blette a besoin de beaucoup d'eau pour ses larges feuilles",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Riche, frais, profond. Apporter du compost",
    pruning: "Pas de taille. Couper les feuilles extérieures pour favoriser la repousse",
    harvest_tips: "Cueillir les feuilles extérieures en coupant à la base. Le cœur continue de produire",
    diseases: "Peu de maladies. Cercosporiose (taches) → supprimer les feuilles atteintes"
  },
  "poireau": {
    water: "💧💧 Régulier, le poireau aime les sols frais. Pailler en été",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Riche, profond, frais. Apporter du compost bien décomposé",
    pruning: "Butter progressivement pour allonger le blanc (3-4 buttages). Habiller avant repiquage",
    harvest_tips: "Récolter selon les besoins de l'automne au printemps. Soulever à la fourche-bêche",
    diseases: "Teigne du poireau → filet anti-insectes. Ver du poireau → rotation et filet"
  },
  "betterave": {
    water: "💧💧 Modéré, arrosage régulier pour éviter les racines fibreuses",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Meuble, frais, riche. Éviter les sols caillouteux",
    pruning: "Éclaircir à 10-15 cm quand les plants ont 3-4 feuilles",
    harvest_tips: "Récolter quand la racine fait 8-10 cm de diamètre. Tordre les feuilles, ne pas couper",
    diseases: "Cercosporiose → rotation. Peu de problèmes en général, plante robuste"
  },
  "chou": {
    water: "💧💧💧 Régulier et abondant. Le chou est très gourmand en eau",
    sun: "☀️ Soleil, supporte la mi-ombre",
    soil: "Riche, argileux accepté, calcaire. Très gourmand, apporter beaucoup de compost",
    pruning: "Supprimer les feuilles jaunies du bas. Pas de taille particulière",
    harvest_tips: "Couper la pomme quand elle est bien ferme. Laisser le trognon en terre, il peut redonner",
    diseases: "Piéride du chou (chenilles vertes) → Bacillus thuringiensis ou filet. Hernie → chaulage du sol"
  },
  "navet": {
    water: "💧💧 Régulier, maintenir le sol frais. Un manque d'eau rend les navets fibreux et piquants",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Frais, léger, bien ameubli. Pas de fumier frais",
    pruning: "Éclaircir à 10-12 cm. Désherber régulièrement",
    harvest_tips: "Récolter jeune pour les navets de printemps (6-8 cm). Navets d'automne supportent un léger gel",
    diseases: "Altise → voile anti-insectes et arrosage régulier. Mouche du chou → rotation"
  },
  "panais": {
    water: "💧💧 Modéré, arroser par temps sec. Le panais est assez résistant une fois installé",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Profond, meuble, sans cailloux. Comme la carotte, le sol doit être bien travaillé",
    pruning: "Éclaircir à 15 cm. Attention : la sève peut provoquer des brûlures au soleil (phototoxique)",
    harvest_tips: "Récolter après les premières gelées, elles améliorent le goût ! Se conserve en terre tout l'hiver",
    diseases: "Peu de maladies. Mouche de la carotte possible → voile anti-insectes"
  },
  "celeri": {
    water: "💧💧💧 Très régulier, le céleri ne supporte pas la sécheresse. Pailler abondamment",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Très riche, frais, profond, humifère. Le céleri est très exigeant",
    pruning: "Céleri-branche : butter pour blanchir les côtes. Céleri-rave : supprimer les feuilles extérieures",
    harvest_tips: "Céleri-branche : couper les côtes au besoin. Céleri-rave : récolter avant les gelées fortes",
    diseases: "Septoriose (taches) → supprimer les feuilles atteintes, traiter au cuivre"
  },
  "fenouil": {
    water: "💧💧💧 Régulier et abondant. Un manque d'eau fait monter en graines rapidement",
    sun: "☀️ Plein soleil, chaleur appréciée",
    soil: "Riche, frais, bien drainé. Apporter du compost",
    pruning: "Butter progressivement le bulbe pour le blanchir et l'attendrir",
    harvest_tips: "Récolter quand le bulbe fait la taille d'un poing. Couper au ras du sol, il peut repousser",
    diseases: "Pucerons → savon noir. Monte facilement en graines → semer en été pour éviter ce problème"
  },
  "mais": {
    water: "💧💧💧 Abondant, surtout lors de la formation des épis. Le maïs est très gourmand en eau",
    sun: "☀️ Plein soleil, maximum de chaleur",
    soil: "Riche, profond, bien amendé en compost. Sol réchauffé pour le semis",
    pruning: "Pas de taille. Butter les pieds pour améliorer l'ancrage. Planter en carré (pollinisation par le vent)",
    harvest_tips: "Récolter quand les soies brunissent et qu'un grain percé libère un jus laiteux",
    diseases: "Pyrale du maïs → Bacillus thuringiensis. Charbon du maïs → arracher les plants atteints"
  },
  "topinambour": {
    water: "💧 Très peu, le topinambour est quasi autonome une fois installé",
    sun: "☀️ Soleil à mi-ombre, très accommodant",
    soil: "Tout type de sol, même pauvre. Attention : il est très envahissant !",
    pruning: "Couper les tiges à 1 m pour éviter qu'elles ne versent. Contenir l'expansion",
    harvest_tips: "Récolter de novembre à mars, au fur et à mesure des besoins. Les laisser en terre, ils se conservent mieux",
    diseases: "Aucune maladie notable. Le principal défi est de limiter sa propagation !"
  },
  "fraise": {
    water: "💧💧💧 Régulier, au pied, jamais sur les fruits. Pailler avec de la paille pour éviter la pourriture",
    sun: "☀️ Soleil à mi-ombre légère",
    soil: "Riche, légèrement acide, bien drainé. Apporter du compost et du terreau de feuilles",
    pruning: "Supprimer les stolons sauf pour multiplier. Couper les feuilles sèches au printemps",
    harvest_tips: "Cueillir quand le fruit est entièrement rouge. Récolter le matin pour plus de saveur",
    diseases: "Pourriture grise (botrytis) → pailler, aérer, supprimer les fruits touchés. Oïdium → soufre"
  },
  "framboise": {
    water: "💧💧 Régulier en été, pailler pour garder la fraîcheur. Les racines sont superficielles",
    sun: "☀️ Soleil à mi-ombre (mi-ombre bienvenue dans le sud)",
    soil: "Riche, acide à neutre, frais mais bien drainé. Apporter du compost chaque année",
    pruning: "Remontants : rabattre en février. Non-remontants : couper les cannes ayant fructifié après récolte",
    harvest_tips: "Cueillir quand le fruit se détache facilement. Récolter tous les 2 jours en saison",
    diseases: "Ver du framboisier → piéger avec des pièges à phéromones. Rouille → supprimer les feuilles atteintes"
  },
  "melon": {
    water: "💧💧 Modéré, arroser au pied sans excès. Réduire l'arrosage à l'approche de la maturité pour concentrer les sucres",
    sun: "☀️ Plein soleil, maximum de chaleur. Abriter du vent, culture sous cloche au nord",
    soil: "Très riche, chaud, bien drainé. Planter sur un lit de compost",
    pruning: "Taille essentielle : pincer après 4 feuilles, puis 2 feuilles sur les ramifications. Limiter à 4-6 fruits/pied",
    harvest_tips: "Mûr quand le pédoncule se craquelle, le fruit embaume et la peau change de couleur",
    diseases: "Oïdium → soufre ou lait dilué. Pucerons → savon noir"
  },
  "pasteque": {
    water: "💧💧💧 Abondant et régulier au départ, réduire à maturité pour concentrer le sucre",
    sun: "☀️ Plein soleil, très exigeante en chaleur. Sous serre au nord de la Loire",
    soil: "Riche, sableux, chaud, bien drainé. Apporter du compost généreusement",
    pruning: "Pincer comme le melon après 4 feuilles. Limiter à 2-3 fruits par pied",
    harvest_tips: "Mûre quand la vrille la plus proche est sèche et que le son est sourd en tapotant",
    diseases: "Oïdium → soufre. Fusariose → rotation des cultures (5 ans)"
  },
  "rhubarbe": {
    water: "💧💧 Régulier, sol toujours frais. Pailler généreusement",
    sun: "☀️ Mi-ombre idéale, supporte le soleil si le sol reste frais",
    soil: "Riche, profond, frais, humifère. Apporter du compost chaque automne",
    pruning: "Supprimer les hampes florales dès leur apparition. Ne jamais couper plus de la moitié des pétioles",
    harvest_tips: "Tirer (ne pas couper) les pétioles en les tordant. Attention : seuls les pétioles sont comestibles, les feuilles sont toxiques",
    diseases: "Très résistante. Limaces sur les jeunes pousses → protéger au printemps"
  },
  "groseille": {
    water: "💧💧 Régulier en été, pailler le pied. Arrosage modéré le reste de l'année",
    sun: "☀️ Soleil à mi-ombre (mi-ombre appréciée dans le sud)",
    soil: "Frais, riche, bien drainé. Apporter du compost au pied chaque automne",
    pruning: "Tailler en hiver : supprimer les branches de plus de 4 ans et aérer le centre du buisson",
    harvest_tips: "Cueillir les grappes entières quand toutes les baies sont colorées",
    diseases: "Oïdium → soufre en préventif. Pucerons → savon noir"
  },
  "basilic": {
    water: "💧💧💧 Régulier, le basilic a toujours soif ! Au pied, jamais sur le feuillage",
    sun: "☀️ Plein soleil, chaleur indispensable. Gèle au moindre froid",
    soil: "Riche, léger, bien drainé. En pot : terreau de qualité",
    pruning: "Pincer régulièrement les sommets et les fleurs pour favoriser la ramification et retarder la montée en graines",
    harvest_tips: "Couper les tiges (pas les feuilles seules) pour stimuler la pousse. Récolter le matin",
    diseases: "Fusariose → éviter l'excès d'eau, bonne rotation. Limaces → protéger les jeunes plants"
  },
  "persil": {
    water: "💧💧 Régulier, maintenir le sol frais. Supporte un léger manque d'eau",
    sun: "☀️ Soleil à mi-ombre (mi-ombre en été)",
    soil: "Riche, frais, humifère. Semer en sol bien travaillé",
    pruning: "Couper les tiges florales la 2e année pour prolonger la récolte de feuilles",
    harvest_tips: "Couper les tiges extérieures à la base. Le cœur continue de produire",
    diseases: "Septoriose → supprimer les feuilles tachées, ne pas arroser le feuillage"
  },
  "ciboulette": {
    water: "💧💧 Modéré, garder le sol frais. Résiste bien à une sécheresse passagère",
    sun: "☀️ Soleil à mi-ombre",
    soil: "Ordinaire, frais, bien drainé. Peu exigeante",
    pruning: "Couper les fleurs fanées (ou les manger !). Rabattre à 5 cm 2-3x/an pour renouveler le feuillage",
    harvest_tips: "Couper les tiges à 2 cm du sol, elles repoussent. Prélever sur le pourtour de la touffe",
    diseases: "Rouille → couper le feuillage atteint, il repousse sain. Très résistante"
  },
  "menthe": {
    water: "💧💧💧 Régulier, la menthe aime l'eau. Sol toujours frais",
    sun: "☀️ Mi-ombre idéale, supporte le soleil si le sol est frais",
    soil: "Riche, frais, humifère. Attention : très envahissante, planter en pot enterré !",
    pruning: "Rabattre à ras en fin de saison. Contenir les stolons qui envahissent tout le jardin",
    harvest_tips: "Couper les tiges avant la floraison pour un arôme maximal. Se récolte toute la saison",
    diseases: "Rouille → rabattre complètement, le nouveau feuillage sera sain. Très résistante"
  },
  "thym": {
    water: "💧 Très peu, le thym est une plante méditerranéenne. Arroser uniquement en pot par fortes chaleurs",
    sun: "☀️ Plein soleil, chaleur et sécheresse bienvenues",
    soil: "Pauvre, caillouteux, très bien drainé. Le thym déteste l'humidité stagnante",
    pruning: "Tailler légèrement après la floraison pour garder un port compact. Ne jamais couper dans le vieux bois",
    harvest_tips: "Cueillir les brins au besoin toute l'année. Arôme maximal juste avant la floraison",
    diseases: "Pourriture racinaire si sol trop humide → assurer un drainage parfait"
  },
  "romarin": {
    water: "💧 Très peu, plante de garrigue. Résiste très bien à la sécheresse",
    sun: "☀️ Plein soleil, emplacement chaud et abrité",
    soil: "Pauvre, calcaire, très bien drainé. Supporte les sols caillouteux",
    pruning: "Tailler légèrement après la floraison pour maintenir la forme. Peut devenir un bel arbuste",
    harvest_tips: "Prélever les brins au besoin toute l'année. Aromatique même sec",
    diseases: "Très résistant. Seul ennemi : l'excès d'humidité (pourriture racinaire)"
  },
  "coriandre": {
    water: "💧💧 Régulier, garder le sol frais pour retarder la montée en graines",
    sun: "☀️ Mi-ombre en été, soleil le reste de l'année. Monte très vite en graines au soleil brûlant",
    soil: "Léger, frais, bien drainé. Semer en place (la coriandre déteste le repiquage)",
    pruning: "Couper les tiges florales pour prolonger la production de feuilles. Semer tous les 3 semaines pour un approvisionnement continu",
    harvest_tips: "Cueillir les feuilles jeunes. Les graines se récoltent quand elles brunissent",
    diseases: "Peu de problèmes. Monte en graines très vite → semer à mi-ombre et garder frais"
  },
  "aneth": {
    water: "💧💧 Modéré, garder le sol frais sans excès",
    sun: "☀️ Plein soleil, emplacement abrité du vent (tiges fragiles)",
    soil: "Léger, bien drainé, pas trop riche. Semer en place (n'aime pas le repiquage)",
    pruning: "Couper les ombelles pour prolonger la récolte de feuilles. Laisser monter en graines pour le ressemis",
    harvest_tips: "Cueillir les feuilles au besoin. Les graines se récoltent quand les ombelles brunissent",
    diseases: "Pucerons → savon noir. Peu de problèmes en général"
  },
  "cerfeuil": {
    water: "💧💧 Régulier, maintenir le sol frais. Craint la sécheresse",
    sun: "☀️ Mi-ombre indispensable en été. Plante de sous-bois",
    soil: "Frais, léger, humifère. Semer en place, le cerfeuil déteste le repiquage",
    pruning: "Couper les tiges florales pour prolonger la récolte. Semer régulièrement pour un approvisionnement continu",
    harvest_tips: "Couper les feuilles à la base 6-8 semaines après le semis. Utiliser très frais (perd son arôme séché)",
    diseases: "Peu de maladies. Pucerons possibles → savon noir"
  },
  "estragon": {
    water: "💧💧 Modéré, arroser régulièrement mais sans excès. Supporte une légère sécheresse",
    sun: "☀️ Plein soleil, emplacement chaud et abrité",
    soil: "Léger, bien drainé, pas trop riche. L'estragon français ne se sème pas, il se bouture ou divise",
    pruning: "Rabattre à 10 cm en fin d'automne. Diviser la touffe tous les 3-4 ans pour la renouveler",
    harvest_tips: "Cueillir les jeunes pousses au besoin. Arôme maximal avant la floraison",
    diseases: "Rouille → supprimer les parties atteintes. Pourriture si sol trop humide"
  },
  "sauge": {
    water: "💧 Peu, la sauge est très résistante à la sécheresse une fois installée",
    sun: "☀️ Plein soleil, chaleur appréciée",
    soil: "Bien drainé, calcaire accepté, même pauvre. Éviter les sols lourds et humides",
    pruning: "Tailler en mars pour maintenir un port compact. Supprimer les fleurs fanées",
    harvest_tips: "Cueillir les feuilles au besoin toute l'année. Arôme plus prononcé avant floraison",
    diseases: "Oïdium possible → bonne aération. Très résistante globalement"
  },
  "origan": {
    water: "💧 Peu, plante méditerranéenne qui préfère la sécheresse",
    sun: "☀️ Plein soleil, maximum de chaleur",
    soil: "Pauvre, caillouteux, très bien drainé. Calcaire apprécié",
    pruning: "Rabattre au printemps pour renouveler la touffe. Couper les fleurs pour prolonger la récolte de feuilles",
    harvest_tips: "Cueillir les brins avant ou pendant la floraison (arôme maximal). Sèche très bien",
    diseases: "Très résistant. Aucune maladie notable si le sol est bien drainé"
  },
  "lavande": {
    water: "💧 Très peu, la lavande déteste l'humidité. N'arroser qu'en pot ou la première année",
    sun: "☀️ Plein soleil, chaleur et sécheresse bienvenues",
    soil: "Pauvre, caillouteux, calcaire, très bien drainé. Sol lourd = mort assurée",
    pruning: "Tailler après la floraison en coupant les épis et en arrondissant la touffe. Ne jamais couper dans le vieux bois",
    harvest_tips: "Récolter les épis quand les fleurs commencent à s'ouvrir. Faire sécher tête en bas",
    diseases: "Dépérissement dû au phytoplasme (cicadelle) → pas de traitement, arracher. Pourriture si sol trop humide"
  }
};
