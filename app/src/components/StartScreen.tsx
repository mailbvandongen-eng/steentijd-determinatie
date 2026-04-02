import { useState } from 'react';
import {
  Camera,
  ArrowLeft,
  Archive,
  GraduationCap,
  Settings,
  LogIn,
  ChevronUp,
  ChevronDown,
  Sprout,
  Leaf,
  Star,
  Info,
  BookOpen,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { LevelSelector } from './LevelSelector';
import { ProgressBar } from './ProgressBar';
import type { UserLevel } from '../types';
import {
  getQuickStartDefinitionsForLevel,
  type QuickStartCategory,
  type QuickStartFamily,
} from '../lib/quickStart';

interface StartScreenProps {
  onStartPractice: (level: UserLevel, isSandbox: boolean) => void;
  onStartQuickStart: (level: UserLevel, family: QuickStartFamily) => void;
  onStartTraining: (sessionCode: string, name: string) => void;
  onOpenTrainerDashboard: () => void;
  onViewHistory: () => void;
  isLoggedIn: boolean;
  version: string;
  initialJoinCode?: string | null;
  onJoinCodeUsed?: () => void;
}

const CHANGELOG = [
  {
    version: '2.2.81',
    title: 'Snelle instap toont nu ook subtype-verwachting',
    items: [
      'Per snelle-instapfamilie laat de reviewkaart nu ook voorbeelden zien van subtype-uitkomsten die je ongeveer in die familie kunt verwachten',
      'Die subtype-preview gaat ook mee in de AI-plausibiliteitscheck, zodat de familiekeuze niet alleen op hoofdvorm maar ook op verwachte verdieping wordt beoordeeld',
      'Daardoor krijgt snelle instap meer inhoudelijke context vóórdat je de boom in gaat',
    ],
  },
  {
    version: '2.2.80',
    title: 'Snelle instap nu ook inhoudelijk afgedekt met een matrix',
    items: [
      'Een nieuwe quick-start matrix rekent nu per familie en niveau door hoeveel specifieke uitkomsten vanaf het gekozen instappunt bereikbaar zijn',
      'De matrix staat nu op 33 routes en 0 families die inhoudelijk doodlopen zonder subtype-uitkomsten',
      'Daardoor wordt snelle instap nu niet alleen op startvragen maar ook op inhoudelijke uitwaaiering regressietestbaar',
    ],
  },
  {
    version: '2.2.79',
    title: 'Snelle instap duwt nu beter terug bij onwaarschijnlijke keuze',
    items: [
      'Als de AI een snelle instap onwaarschijnlijk vindt, zet de reviewkaart nu de volledige route duidelijk als aanbevolen keuze bovenaan',
      'De verkorte route blijft nog wel mogelijk, maar voelt niet meer alsof de app een zwakke instap actief aanmoedigt',
      'Daardoor is de snelle instap terughoudender en eerlijker bij twijfelachtige familiekeuzes',
    ],
  },
  {
    version: '2.2.78',
    title: 'Snelle instap nu ook volledig gedekt met bronhints',
    items: [
      'Alle beginvragen van de snelle-instapfamilies hebben nu een bronhint, ook in de geslepen en doorboorde fasebomen',
      'Daardoor starten snelle instaproutes niet alleen op een geldige vraag, maar ook meteen met inhoudelijke AWN-ondersteuning',
      'De quick-start dekking staat nu op 21 families, 33 geldige instapchecks en 0 resterende hintgaten op startvragen',
    ],
  },
  {
    version: '2.2.77',
    title: 'Snelle instap inhoudelijk aangescherpt',
    items: [
      'Elke snelle-instapfamilie heeft nu expliciete herkenningskenmerken en veelvoorkomende verwarringen, zodat de AI-instap strenger en bronvaster kan beoordelen',
      'De snelle-instapreview laat nu ook zien waar de AI op let en met welke verwante families verwarring kan ontstaan',
      'Een nieuwe audit bewaakt dat elke snelle-instapfamilie naar een bestaand boominstappunt, boommodus en bronresultaat verwijst',
    ],
  },
  {
    version: '2.2.76',
    title: 'Snelle instap uitgebreid naar alle stabiele families',
    items: [
      'De snelle instap dekt nu alle artefactfamilies af waarvoor in de app al een stabiel instappunt bestaat, van kernen en kernwerktuigen tot geslepen en doorboorde typen',
      'Expertgebruikers kunnen nu ook direct starten in families zoals Levallois-kern, diskusvormige kern, geretoucheerde afslag, boor of priem en hamerbijl',
      'De keuzelijst is nu gegroepeerd per categorie zodat de grotere familieset nog bruikbaar en scanbaar blijft',
    ],
  },
  {
    version: '2.2.75',
    title: 'Snelle instap toegevoegd voor gevorderd en expert',
    items: [
      'Gevorderde en expertgebruikers kunnen nu direct een artefactfamilie kiezen, zoals spits, schrabber, kern of geslepen vuurstenen bijl',
      'Na het maken van een foto doet de AI eerst alleen een plausibiliteitscheck voor die gekozen instap, zonder meteen het type te bepalen',
      'Daarna kun je ofwel dieper in de boom starten of alsnog de volledige route vanaf het begin lopen',
    ],
  },
  {
    version: '2.2.74',
    title: 'Spitsroute met oppervlakteretouche weer bereikbaar',
    items: [
      'De expert-spitsroute rond oppervlakteretouche valt nu niet meer te vroeg terug op de brede categorie bekapt',
      'Vraag 540 loopt nu altijd door naar de eigen spits- en oppervlakteretoucheroute in plaats van bij nee abrupt te eindigen',
      'Daardoor blijven routes naar typen met schachtdoorn en weerhaken, zoals dennenboompje en klokbekerspitsen, beter bereikbaar',
    ],
  },
  {
    version: '2.2.73',
    title: 'Testinstructie weer verwijderd uit de app',
    items: [
      'De zichtbare testinstructie is weer verwijderd van het startscherm',
      'Ook de aparte testbriefing in de infomodal is weggehaald',
      'De app start daardoor weer rustiger en directer op',
    ],
  },
  {
    version: '2.2.72',
    title: 'Testinstructie nu direct zichtbaar op het startscherm',
    items: [
      'Bij het openen van de app staat nu meteen een korte testbriefing voor AWN-testers en andere proefgebruikers',
      'De briefing legt uit wat je het best kunt testen en hoe je bruikbare feedback terugkoppelt',
      'Daardoor hoeven testers niet eerst de infomodal te openen om goed te kunnen starten',
    ],
  },
  {
    version: '2.2.71',
    title: 'Resultaatscherm nu duidelijker over brede en onzekere uitkomsten',
    items: [
      'Het resultaatscherm onderscheidt nu expliciet tussen specifieke type-uitkomsten, brede restcategorieën en echte twijfelgevallen',
      'Generieke uitkomsten zoals doorboord artefact, geslepen stenen artefact, combinatiewerktuig en onbepaalde artefacten krijgen nu een duidelijke waarschuwingstekst',
      'Daardoor wordt de uitkomst inhoudelijk eerlijker gepresenteerd en minder snel gelezen als een te hard subtype',
    ],
  },
  {
    version: '2.2.70',
    title: 'Expert-engine opent nu ook geslepen en doorboorde detailsubtypen',
    items: [
      'De expert-engine kan nu ook de extra subtypevragen uit de geslepen en doorboorde detailbomen echt doorlopen in plaats van ze als onbekend te behandelen',
      'De geslepen vuurstenen bijlroute rond brede snede, dunne top en dik- of dunbladige subtypen is nu inhoudelijk opengetrokken',
      'De uitgebreide expert-regressieset stijgt daarmee naar 122 van 122 scenario’s zonder ontbrekende routes',
    ],
  },
  {
    version: '2.2.69',
    title: 'Expert-regressieset nu ook op spits- en vuistbijlsubtypen aangescherpt',
    items: [
      'De expert-regressieset controleert nu ook subtypeverwarring tussen naburige spits- en vuistbijlvarianten',
      'Tjonger, Bromme, Swidry, Font-Robert, Havelter en Zonhoven worden nu expliciet tegen elkaar afgezet, net als amandel-, hart-, driehoek- en Micoque-vuistbijlen',
      'De regressieset blijft daarbij schoon op 102 van 102 scenario’s zonder verboden overgangen',
    ],
  },
  {
    version: '2.2.68',
    title: 'Expert-regressieset nu ook op combinatiewerktuigen aangescherpt',
    items: [
      'De expert-regressieset bewaakt nu ook combinatiewerktuigen en gemengde subtypepaden zoals schaaf-steker, schrabber-boor en steker-boor',
      'Nieuwe scenario’s voor gekerfd-en-getand, gekerfd-en-afgeknot en getand-en-afgeknot artefacten zijn toegevoegd aan de matrix',
      'De aangescherpte regressieset blijft daarbij schoon op 102 van 102 scenario’s zonder verboden overgangen',
    ],
  },
  {
    version: '2.2.67',
    title: 'Expert-regressieset nu ook op subtypeverwarring aangescherpt',
    items: [
      'De expert-regressieset controleert nu ook subfamilieverwarring binnen werktuig-, geslepen- en doorboordroutes',
      'Nieuwe scenario’s voor afgeknotte, gekerfde, getande en schaafroutes zijn toegevoegd aan de matrix',
      'De aangescherpte regressieset blijft daarbij schoon op 94 van 94 scenario’s zonder verboden overgangen',
    ],
  },
  {
    version: '2.2.66',
    title: 'Expert-regressieset nu ook op familie-overgangen aangescherpt',
    items: [
      'De expert-regressieset bewaakt nu ook verboden familie-overgangen voor werktuigen, spitsen, geslepen en doorboorde routes',
      'De matrix controleert daarmee niet alleen of een pad bestaat, maar ook of een route niet onterecht in een andere artefactfamilie belandt',
      'De aangescherpte matrix blijft daarbij op 89 van 89 scenario’s zonder verboden overgangen staan',
    ],
  },
  {
    version: '2.2.65',
    title: 'Expert-kernroute rond vraag 30 en 31 hersteld',
    items: [
      'De expert-kernroute rond vraag 30 en 31 loopt nu niet meer door naar gemodificeerde brok- of klingvragen',
      'Een nee op vraag 30 eindigt nu correct op orthogonale kern en vraag 31 eindigt nu correct op bidirectionele afslag- of klingkern',
      'Daardoor springt de expertdeterminatie vanuit kernen niet meer onterecht naar afslag- en klingwerktuigen',
    ],
  },
  {
    version: '2.2.64',
    title: 'AI-beeldtoets bronvaster aangestuurd',
    items: [
      'De AI-beeldtoets krijgt nu een bronpakket mee uit het gekozen type en het doorlopen vraagpad in plaats van alleen een vrije resultaatbeschrijving',
      'Per validatie worden nu bronomschrijving van het type, verwachte kenmerken uit de beslisstappen en expliciete validatie-instructies meegestuurd',
      'Daardoor wordt de AI-beeldtoets strakker gestuurd op compatibiliteit met de AWN-bronlogica en minder op vrije interpretatie',
    ],
  },
  {
    version: '2.2.63',
    title: 'Bronomschrijvingen nu ook in geschiedenis en kaart',
    items: [
      'Bronomschrijvingen worden nu ook getoond in geschiedenis en kaart-popups voor opgeslagen vondsten',
      'Daardoor blijft de broncontext zichtbaar buiten het directe resultaatscherm',
      'Lijst- en kaartweergave sluiten nu beter aan op de bronvaste uitleg van de determinatie',
    ],
  },
  {
    version: '2.2.62',
    title: 'Bronomschrijvingen uitgebreid en doorgetrokken naar delen en export',
    items: [
      'De bronomschrijvingen zijn uitgebreid naar veel concrete expert-subtypen zoals kernvarianten, vuistbijlen, spitsen, schrabbers, stekers, doorboorde typen en geslepen bijlen en beitels',
      'Die broninformatie gaat nu ook mee in de deeltekst en PDF-export',
      'Daardoor blijft de bronverankering niet beperkt tot het scherm zelf maar reist die ook mee in gedeelde en geëxporteerde resultaten',
    ],
  },
  {
    version: '2.2.61',
    title: 'Bronomschrijvingen toegevoegd aan het resultaatscherm',
    items: [
      'Het resultaatscherm toont nu voor veel hoofdgroepen en veelgebruikte expertsubtypen een bronomschrijving uit algoritme en handleiding',
      'Die toelichting gebruikt het bronresultaat of een passende familieherkenning in plaats van alleen de vrije AI-beschrijving',
      'Daardoor zijn eindresultaten nu ook inhoudelijk beter verankerd in de AWN-bronlogica',
    ],
  },
  {
    version: '2.2.60',
    title: 'Bronhintdekking in de expert-regressieset afgerond',
    items: [
      'De laatste resterende bronhints uit de expert-regressiematrix zijn toegevoegd, inclusief zeldzame kern-, boor-, schrabber-, spits- en geslepen subtypevragen',
      'De bronhintdekking voor alle vragen die in de huidige expert-testmatrix voorkomen staat daarmee nu op 100 procent',
      'De expertflow heeft in de regressieset daardoor geen resterende hintgaten meer',
    ],
  },
  {
    version: '2.2.59',
    title: 'Bronhints verder doorgetrokken naar resterende expert-subtypen',
    items: [
      'De bronhintlaag dekt nu ook vroege kernspecialisaties, kleine schrabbertypen, gesteelde spitsen en de fijnere rechthoekige vuursteenbijl- en beitelroutes',
      'Ook veel lagere frequentievragen uit de expert-regressiematrix hebben nu een bronhint uit algoritme en handleiding',
      'De resterende ongedekte expertvragen zijn daarmee teruggebracht tot een kleine restgroep van zeldzamere subtypeknooppunten',
    ],
  },
  {
    version: '2.2.58',
    title: 'Bronhintdekking fors uitgebreid op basis van de expert-testmatrix',
    items: [
      'De bronhintlaag dekt nu veel meer hoofdknopen af, waaronder vroege instapvragen, kernsubtypen, vuistbijlen, schrabbers, stekers, geometrische spitsen en geslepen bijlen',
      'Veelgebruikte expertvragen uit de regressieset hebben nu een bronhint uit algoritme en handleiding in plaats van alleen AI-fallback',
      'Daardoor sluit de hulp in de app beter aan op de routes die testers en gevorderde gebruikers het vaakst doorlopen',
    ],
  },
  {
    version: '2.2.57',
    title: 'Eerste bronhintlaag en expliciete bronverwijzingen toegevoegd',
    items: [
      'Een eerste bronhintlaag is toegevoegd voor sleutelvragen in beginner en expert, gebaseerd op algoritme en handleiding in plaats van vrije AI-uitleg',
      'De vraagkaart in expert en het stappenoverzicht op het resultaatscherm tonen nu expliciet de bronvraag uit het algoritme',
      'Hints gebruiken nu eerst een bronhint en alleen waar nog niets is vastgelegd eventueel een AI-hint als fallback',
    ],
  },
  {
    version: '2.2.56',
    title: 'Expert-regressieset fors uitgebreid en boom inhoudelijk aangescherpt',
    items: [
      'De expertboom heeft nu een inhoudelijke regressieset met 89 scenario’s verspreid over kernen, werktuigen, spitsen, bifacialen, geslepen artefacten en doorboorde typen',
      'De expert-runtime-audit staat nu op 0 onbereikbare vragen en 0 runtimeproblemen, terwijl de uitgebreide testmatrix 89 van 89 scenario’s automatisch vindt',
      'Een echte bronlacune is hersteld met vraag 137 voor driehoekige vuistbijlen, en de geslepen, doorboorde en kernroutes zijn verder inhoudelijk opengetrokken',
    ],
  },
  {
    version: '2.2.55',
    title: 'Dolk- en stekervraagteksten verder hersteld',
    items: [
      'Een grote volgende batch dolk- en stekervraagteksten gebruikt nu weer de letterlijke algoritmeformulering in plaats van afgebroken parserrestjes',
      'De bronaudit daalt daardoor verder naar 406 issues en 229 vraagtekst-mismatches',
      'Ook de parserfoutcategorie daalt mee naar 335, terwijl de routekoppen stabiel blijven op 66',
    ],
  },
  {
    version: '2.2.54',
    title: 'Vroege dolkvraagteksten bronvaster gemaakt',
    items: [
      'Een eerste batch vroege vraagteksten in de dolkroute gebruikt nu weer de letterlijke formulering uit het algoritmedocument',
      'De bronaudit daalt daardoor verder naar 428 issues en 251 vraagtekst-mismatches',
      'Ook de parserfoutcategorie daalt mee naar 357, terwijl de routekoppen gelijk blijven op 66',
    ],
  },
  {
    version: '2.2.53',
    title: 'Vroege bifaciale routekoppen verder opgeschoond',
    items: [
      'De vroege bifaciale route rond vraag 110, 125, 126 en 154 gebruikt nu explicietere labels in plaats van parserkoppen met het- en nee-vormen',
      'De ruwe bronaudit daalt daardoor verder naar 438 issues en 177 verdachte antwoordlabels',
      'De classificatie zakt mee naar 66 routekoppen, waardoor de resterende bronrommel steeds meer verschuift naar latere subtypevragen',
    ],
  },
  {
    version: '2.2.52',
    title: 'Kale nee-labels in vroege routes verminderd',
    items: [
      'Zes vroege kale nee-labels in kern-, artefact- en bifaciale routes zijn vervangen door expliciete doorgangslabels met dezelfde vervolgvraag',
      'De ruwe bronaudit daalt daardoor verder naar 444 issues en 183 verdachte antwoordlabels',
      'De classificatie zakt mee naar 72 routekoppen, zodat de bronlaag minder vaak op een kaal nee-label leunt',
    ],
  },
  {
    version: '2.2.51',
    title: 'Vroege routekoppen verder teruggedrongen',
    items: [
      'Een nieuwe batch vroege bifaciale en dolkroutes gebruikt nu minder parserachtige nee-labels en meer expliciete tussenstappen, zonder de bestaande spronglogica te veranderen',
      'De ruwe bronaudit daalt daardoor verder naar 450 issues en 189 verdachte antwoordlabels',
      'De classificatie zakt mee naar 78 routekoppen, waardoor vooral de kale nee-labels in de bronlaag steeds verder worden teruggedrongen',
    ],
  },
  {
    version: '2.2.50',
    title: 'Vroege antwoordlabels verder opgeschoond',
    items: [
      'Een volgende batch vroege kern-, afslag- en vuistbijllabels in de AWN-bronboom is ontdaan van parservormen als een-rugmes, een-kern en een-vuistbijl-kernvormig',
      'De ruwe bronaudit daalt daardoor verder naar 456 issues en 195 verdachte antwoordlabels',
      'Ook de classificatie zakt mee naar 367 parserfouten en 84 routekoppen, waardoor de resterende rommel nu steeds meer in echte routevragen zit',
    ],
  },
  {
    version: '2.2.49',
    title: 'Vroege bronvragen teruggezet naar algoritmetekst',
    items: [
      'Een grote batch vroege kern-, afslag-, kling- en bifaciale vragen in de AWN-bronboom gebruikt nu weer de letterlijke formulering uit het algoritmedocument',
      'Daardoor daalt de bronaudit van 303 naar 261 vraagtekst-mismatches en van 511 naar 469 totale issues',
      'De grootste resterende bronafwijkingen zitten nu minder in de vroege hoofdroutes en meer in latere subtypevragen en parserlabels',
    ],
  },
  {
    version: '2.2.48',
    title: 'Vroege bronlabels genormaliseerd',
    items: [
      'Een eerste batch vroege kern- en afslaglabels in de AWN-bronboom is nu minder parserachtig en sluit beter aan op de termen die de app zelf toont',
      'Daaronder vallen onder meer kernwerktuig, geteste brok of vorstsplijting, kern met meer dan een slagvlak, onbewerkte afslag of kling en kern of brok met werkkant of punt',
      'De baseline-bronaudit daalt daardoor verder naar 511 issues en 208 verdachte antwoordlabels, met een bijgewerkte classificatie van 414 parserfouten en 90 routekoppen',
    ],
  },
  {
    version: '2.2.47',
    title: 'Laatste expert-restlabels opgeschoond',
    items: [
      'De laatste zichtbare restlabels in Expert hebben nu leesbare namen, ook voor generieke categorieën, vroege kernlabels en opmerkingstypen',
      'Daaronder vallen onder meer bijl, beitel, kern, artefact met één of twee afslagnegatieven, segmentvormige restgroepen en diverse vermeld- of twijfeluitkomsten',
      'Deze ronde is bedoeld als afrondende opschoning van zichtbare expert-uitkomsten in plaats van nieuwe route- of boomlogica',
    ],
  },
  {
    version: '2.2.46',
    title: 'Schaaftypen en stekervarianten benoemd',
    items: [
      'Een nieuwe batch schaaftypen en stekervarianten toont nu nette namen in Expert, waaronder Quina, demi-Quina, beksteker en Noailles-steker',
      'Ook vroege categorie-uitkomsten zoals artefact met afslagnegatieven hebben nu een leesbare schermnaam',
      'Daardoor neemt het aantal ruwe eindlabels in de expertboom opnieuw verder af',
    ],
  },
  {
    version: '2.2.45',
    title: 'Resterende spits- en kernuitkomsten benoemd',
    items: [
      'Nog een batch echte experttypen toont nu nette namen, waaronder gemodificeerde Levallois-spitsen, pseudo-Levallois-spitsen, Dufour-lamellen en kernschrabbers',
      'Ook transversaal- en trapeziumvarianten, feuille-de-gui, vuistwig op afslag en enkele afgeknotte resttypen zijn nu leesbaar',
      'Daardoor wordt de expertboom opnieuw minder afhankelijk van ruwe AWN-slugs als einduitkomst',
    ],
  },
  {
    version: '2.2.44',
    title: 'Generieke expertcategorieën benoemd',
    items: [
      'Vroege en tussengelegen expertcategorieën zoals bekapt, afgeknot artefact, afslag- of klingwerktuig en geslepen artefact tonen nu nette namen',
      'Ook meerdere bifaciale en kernwerktuig-koppen hebben nu een leesbare schermnaam in plaats van een technische route- of parserlabel',
      'Daardoor blijven in Expert minder kale categoriecodes over als einduitkomst zichtbaar',
    ],
  },
  {
    version: '2.2.43',
    title: 'Geslepen bijlen en hamerbijlen leesbaarder',
    items: [
      'Meerdere half-afgebroken expertlabels voor geslepen bijlen tonen nu nette namen, vooral bij breedtoppige, smaltoppige en rechthoekige doorsneden',
      'Ook varianten van dissels en hamerbijlen met verdikkingen of ronde doorsneden zijn nu benoemd',
      'Daardoor eindigen opnieuw minder geslepen en doorboorde expertpaden op een technische slug',
    ],
  },
  {
    version: '2.2.42',
    title: 'Vroege expert-uitkomsten verder opgeschoond',
    items: [
      'Nog een batch vroege kern-, dolk- en doorboord-uitkomsten toont nu nette namen in plaats van ruwe labels',
      'Daaronder vallen onder meer splinter, geteste brok of vorstsplijting, bijlafslag, bladschaaf, Scandinavische dolk en doorboord werktuig',
      'Ook schoenleestbijl/dissel, disselkling en afslagbijl zijn nu als leesbare expertuitkomst benoemd',
    ],
  },
  {
    version: '2.2.41',
    title: 'Meer gemodificeerde expert-typen benoemd',
    items: [
      'Een volgende batch gemodificeerde afslagen, klingen en schaaftypen toont nu leesbare namen in Expert',
      'Ook resttypen zoals boor op kern, klingbeitel, onvolledig doorboorde dellensteen en polsbeschermer zijn nu benoemd',
      'Daardoor eindigt de expertboom opnieuw minder vaak op een ruwe slug of half parserlabel',
    ],
  },
  {
    version: '2.2.40',
    title: 'Meer expert-uitkomsten leesbaar gemaakt',
    items: [
      'Een extra batch geldige expertuitkomsten toont nu nette namen in plaats van ruwe AWN- of parserlabels',
      'Daaronder vallen onder meer Tayac-, Quinson-, Soyons-, Emireh- en Mousterien-spitsen, Havelter-steelspits, Zonhoven-spits en Pseudo-Grand-Pressigny-dolk',
      'Ook verschillende schrabbervarianten en restlabels zoals plaatselijk geretoucheerde artefacten zijn nu leesbaarder in de UI',
    ],
  },
  {
    version: '2.2.39',
    title: 'Oppervlakteretouche-route bronvaster gemaakt',
    items: [
      'De latere expert-subboom voor oppervlakteretouche loopt nu vraag voor vraag volgens het algoritme door, onder meer rond driehoekige, bladvormige en schachtdoorn-spitsen',
      'Meerdere nee-antwoorden die eerder te vroeg eindigden of op een verkeerde subtak belandden springen nu naar de juiste vervolgvraag',
      'Ontbrekende schermnamen voor Sögel-, Post-Swidry- en klokbekerspitsen en verwante uitkomsten zijn toegevoegd',
    ],
  },
  {
    version: '2.2.38',
    title: 'Dolkroutes beter gesplitst',
    items: [
      'De expertroute voor dolken splitst nu weer zoals in het algoritme tussen symmetrische en asymmetrische fijn bewerkte kernwerktuigen',
      'Vraag 155 stuurt nu niet meer beide antwoorden naar dezelfde vervolgroute, maar onderscheidt eenzijdig en tweezijdig bewerkte dolken',
      'Asymmetrische dolkvormen tonen nu bovendien een leesbare uitkomst in plaats van een technische bronlabel',
    ],
  },
  {
    version: '2.2.37',
    title: 'Gekerfde en segmentvormige spitsen consistenter',
    items: [
      'De expertroute voor gekerfde spitsen loopt nu vanaf vraag 412 expliciet door naar de eenzijdige subtypeboom of eindigt leesbaar op een tweezijdig gekerfde spits',
      'De segmentvormige spitsroute vanaf vraag 470 springt nu expliciet door naar de subtypevragen in plaats van op impliciete vraagvolgorde te leunen',
      'Daardoor zijn nog minder spitsroutes afhankelijk van parserlabels of toevallige volgorde in de bronexport',
    ],
  },
  {
    version: '2.2.36',
    title: 'Spitsroute in Expert rechtgetrokken',
    items: [
      'De hoofdvertakkingen voor spitsen springen nu door naar de juiste deelboom in plaats van op parserlabels als "geen punt" of "segmentvorm" te stranden',
      'Ook de eenzijdig en tweezijdig geretoucheerde spitsroutes lopen nu consistenter door vanaf vraag 476 tot en met de subtypevragen',
      'Ruwe eindlabels zoals "spits zonder steel of kerf" en eenzijdig of tweezijdig steil geretoucheerde spitsen tonen nu leesbare uitkomsten',
    ],
  },
  {
    version: '2.2.35',
    title: 'Combinatiewerktuigroute aangescherpt',
    items: [
      'Algemene combinatiewerktuig-uitkomsten springen niet meer onterecht terug een subtypeboom in als ze al als eindresultaat bedoeld zijn',
      'Een extra parservariant van combinatiewerktuig wordt nu ook als vervolgroute herkend',
      'Schaaf en combinatiewerktuig tonen nu bovendien expliciete schermnamen in Expert',
    ],
  },
  {
    version: '2.2.34',
    title: 'Expert werktuigroutes logischer gemaakt',
    items: [
      'Boor- en combinatiewerktuigroutes in Expert reageren nu verschillend op ja en nee waar de parser eerder beide antwoorden op dezelfde vervolgstap liet landen',
      'Ontbrekende schermnamen voor gekerfde, getande en afgeknotte afslag- en klingtypen zijn toegevoegd',
      'Daardoor lopen deze werktuigroutes minder springerig en eindigen ze vaker op een herkenbaar subtype',
    ],
  },
  {
    version: '2.2.33',
    title: 'Meer expert-eindtypes herkenbaar gemaakt',
    items: [
      'Ontbrekende schermnamen voor onder meer Montbani-klingkern, gekerfd werktuig en getand werktuig zijn toegevoegd',
      'Daardoor blijven deze uitkomsten stabieler als echt eindtype staan in plaats van sneller als tussenlabel te worden behandeld',
      'Dit sluit vooral de kern-, kling- en werktuigroutes beter aan op de verwachte expertuitkomst',
    ],
  },
  {
    version: '2.2.32',
    title: 'Expert nee-routes beter gesprongen',
    items: [
      'Nee-antwoorden op subtypevragen in de expertboom slaan nu de ja-specifieke vervolgvraag beter over als die alleen bij de ja-tak hoort',
      'Daardoor springen kling-, kern- en afslagroutes minder onlogisch door naar een subtype dat alleen bij het andere antwoord past',
      'Met name de expert-klingroute loopt nu consistenter door bij nee-antwoorden op Levallois- en vergelijkbare subtypevragen',
    ],
  },
  {
    version: '2.2.31',
    title: 'Expert klingroute minder springerig',
    items: [
      'Geldige expertuitkomsten zoals Levallois-kling vallen niet meer automatisch door naar de volgende klingvraag alleen omdat er nog een vervolgvraag bestaat',
      'Daardoor wisselt de expertboom minder onlogisch tussen verschillende klingtypen binnen één pad',
      'Gemodificeerde Levallois-kling toont nu ook een leesbare naam als uitkomst',
    ],
  },
  {
    version: '2.2.30',
    title: 'Vervolgflow en popup consistent gemaakt',
    items: [
      'Vervolg naar Expert start nu op een logisch instappunt in de AWN-boom in plaats van opnieuw bij het allereerste begin',
      'Een gevorderde vervolgroute kan nu ook nog doorlopen naar Expert als de expertverdieping daarna nog relevant is',
      'De antwoord-popup in gevorderd is verwijderd zodat antwoorden direct doorlopen zonder tussenscherm',
    ],
  },
  {
    version: '2.2.29',
    title: 'Latere expert-subroutes en labels opgeschoond',
    items: [
      'Een volgende batch bifaciale en dolkroutes gebruikt nu weer volledige bronvragen uit het algoritmedocument',
      'Meerdere parserachtige expertuitkomsten tonen nu leesbare schermnamen, onder meer bij combinatiewerktuigen, spitsen en bijlsubtypen',
      'De bronaudit daalt daardoor verder naar 303 vraagtekst-mismatches en 420 parserfouten',
    ],
  },
  {
    version: '2.2.28',
    title: 'Expert lus bij vraag 126 gerepareerd',
    items: [
      'De expertboom loopt bij de bifaciale route niet meer vast op vraag 126 over snede of werkkant',
      'De antwoorden op vraag 125 en 126 springen nu door naar de juiste vervolgvraag in plaats van terug naar dezelfde vraag',
      'Klingkern naar Expert kan daardoor weer doorlopen in de vuistbijl- of kernwerktuigroutes',
    ],
  },
  {
    version: '2.2.27',
    title: 'Vroege bifaciale en klingroutes bronvaster',
    items: [
      'De vroege klingroutes, controlevragen en eerste grof-bewerkte of bifaciale routes gebruiken nu weer volledige bronvragen',
      'De bronaudit daalt daardoor verder naar 306 vraagtekst-mismatches en 423 parserfouten',
      'De resterende bronopschoning verschuift nu steeds meer van hoofdroutes naar latere subroutes en technische labels',
    ],
  },
  {
    version: '2.2.26',
    title: 'Vroege routevragen verder hersteld',
    items: [
      'Een tweede batch vroege kern-, afslag- en klingvragen gebruikt nu weer volledige bronformuleringen uit het algoritmedocument',
      'De bronaudit daalt daardoor verder naar 312 vraagtekst-mismatches en 429 parserfouten',
      'De belangrijkste resterende bronafwijkingen zitten nu nog in latere routevragen en technische antwoordlabels',
    ],
  },
  {
    version: '2.2.25',
    title: 'Eerste vraagteksten bronvaster gemaakt',
    items: [
      'De eerste hoofdvragen in de AWN-bronboom zijn nu uitgebreid van verkorte prompts naar volledige bronformuleringen',
      'De bronaudit meet nu scherper dat veel JSON-vragen nog verkort zijn ten opzichte van het algoritmedocument',
      'Deze release markeert de eerste echte opschoningsronde van vraagteksten, niet alleen van route- en spronglogica',
    ],
  },
  {
    version: '2.2.24',
    title: 'Eerste bronreparatie uitgevoerd',
    items: [
      'Lege vraagteksten in de AWN-bronboom zijn nu aangevuld vanuit het algoritmedocument',
      'Het ontbrekende bronknooppunt 801 is toegevoegd als expliciete placeholder',
      'De geautomatiseerde audit laat nu geen lege vragen of ontbrekende knooppunten meer zien',
    ],
  },
  {
    version: '2.2.23',
    title: 'Bronissues geclassificeerd',
    items: [
      'De baseline-audit wordt nu automatisch gesplitst in parserfouten, routekoppen en vermoedelijk geldige typen',
      'De repo bevat nu een tweede auditlaag voor prioritering van bronopschoning',
      'De volgende inhoudelijke opschoningsronde kan daardoor gericht op echte parserproblemen starten',
    ],
  },
  {
    version: '2.2.22',
    title: 'Bronaudit basis toegevoegd',
    items: [
      'Een eerste geautomatiseerde audit vergelijkt nu algoritme.txt met beslisboom.json',
      'De repo bevat nu een auditrapport met lege vragen, ontbrekende knooppunten en verdachte labels',
      'Dit vormt de basis voor de volgende bronvaste opschoningsronde van de expertboom',
    ],
  },
  {
    version: '2.2.21',
    title: 'Bronbeleid en controleerbaar vraagpad',
    items: [
      'Bronbeleid voor algoritme, handleiding, hints, AI-toets en beeldmateriaal is vastgelegd',
      'Resultaatscherm toont nu het doorlopen beslispad met vragen en antwoorden',
      'Hints zijn niet langer beperkt tot drie en AI-validatie heet nu eerlijker AI-beeldtoets',
    ],
  },
  {
    version: '2.2.20',
    title: 'Expert eindronde afgerond',
    items: [
      'Laatste routelekken in vuistbijl-, boor- en oppervlakteretoucheroutes springen nu door naar de juiste expertvragen',
      'Kernlabels en dolksubtypen tonen nu vaker leesbare AWN-namen in plaats van parsertekst',
      'De expertboom eindigt daardoor minder vaak op technische tussencategorieen',
    ],
  },
  {
    version: '2.2.19',
    title: 'Expert voor bifaciaal en doorboord aangescherpt',
    items: [
      'Bifaciale routekoppen zoals vuistbijl-, bladvorm- en kernwerktuiglabels springen nu door naar hun echte expertvragen',
      'Geslepen bijlen, beitels en hamerbijlen lopen minder vaak vast op technische tussencategorieen',
      'Resterende expertuitkomsten in deze secties tonen nu vaker leesbare AWN-namen',
    ],
  },
  {
    version: '2.2.18',
    title: 'Expert eindlabels opgeschoond',
    items: [
      'Resterende boor- en combinatiesprongen in de afslag/kling-sectie lopen nu door',
      'Technische expertlabels voor stekers, boren en verwante werktuigen tonen nu leesbare namen',
      'De expertuitkomsten in deze sectie zijn daardoor minder intern en beter testbaar',
    ],
  },
  {
    version: '2.2.17',
    title: 'Expert afslag/kling-sprongen verbeterd',
    items: [
      'Hoofdlabels zoals bekapt, combinatie en afgeknot springen nu door naar hun echte expert-subboom',
      'Restgroepen binnen de afslag/kling-sectie lopen contextafhankelijk door in plaats van vast te lopen',
      'De expertflow voor afslag- en klingwerktuigen kapt daardoor minder vaak te vroeg af',
    ],
  },
  {
    version: '2.2.16',
    title: 'Expert sprongen gerepareerd',
    items: [
      'Kapotte expert-sprongen voor gat, cortex en geslepen artefacten zijn gerepareerd',
      'Interne parserlabels zoals losse \"nee\"-uitkomsten lopen nu door naar de volgende AWN-vraag',
      'De expertboom kapt daardoor minder vaak te vroeg af op technische tussenlabels',
    ],
  },
  {
    version: '2.2.15',
    title: 'Vervolgstatus zichtbaar gemaakt',
    items: [
      'Resultaatscherm legt nu uit waarom er geen vervolgkaart is',
      'Beginner toont expliciet het verschil tussen een bewust eindpunt en een nog niet uitgewerkte verdieping',
      'Testers hoeven daardoor niet meer te raden of een stil einde een bug is',
    ],
  },
  {
    version: '2.2.14',
    title: 'Meer vervolgkaarten gedicht',
    items: [
      'Geretoucheerde afslagen en meerdere kernwerktuigen geven nu ook een vervolgkaart',
      'Artefacttypen zonder eigen gevorderd-subboom lopen voorlopig door naar Expert',
      'De vervolgkaartlaag sluit nu beter aan op de feitelijke AWN-verdieping in de app',
    ],
  },
  {
    version: '2.2.13',
    title: 'Kernverdieping gekoppeld',
    items: [
      'Kernuitkomsten zoals klingkern, afslagkern en Levallois-kern geven nu een vervolgkaart',
      'Voor deze groepen gaat de vervolgroute direct naar Expert, omdat daar nu de volledige AWN-boom zit',
      'Vervolgknoppen tonen nu het juiste doelniveau in plaats van altijd Gevorderd',
    ],
  },
  {
    version: '2.2.12',
    title: 'Expert doorgroei aangescherpt',
    items: [
      'Expert unlock telt nu alleen correcte determinaties op gevorderd niveau mee',
      'Docenten kunnen gebruikers nog steeds direct naar expert promoveren',
      'Voortgangsteksten en balken tonen nu dezelfde expertregel als de unlocklogica',
    ],
  },
  {
    version: '2.2.11',
    title: 'Niveaulogica opgeschoond',
    items: [
      'Achterhaalde beginner-cutoff restanten verwijderd',
      'Expertfase staat nu overal als actief in plaats van gepland',
      'Unlock-uitleg verduidelijkt: reguliere doorgroei vereist correcte determinaties en docentvalidaties',
    ],
  },
  {
    version: '2.2.10',
    title: 'Wijzigingenbeheer bijgewerkt',
    items: [
      'Recente AWN-versies zijn toegevoegd aan "Wat is nieuw?"',
      'Release-overzicht sluit nu beter aan op de live V2-uitrol',
    ],
  },
  {
    version: '2.2.9',
    title: 'Echt resultaat op beginniveau',
    items: [
      'Beginner toont nu het echte resultaat in plaats van "Onbepaald (beginnersniveau bereikt)"',
      'Verborgen vervolgresultaten blijven beschikbaar voor latere verdieping',
      'Kern- en andere beginneruitkomsten zijn daardoor logischer leesbaar',
    ],
  },
  {
    version: '2.2.8',
    title: 'Vervolg na beginner cutoff',
    items: [
      'Verborgen beginnerresultaten bewaren nu het echte onderliggende type',
      'Vervolgknoppen kunnen daardoor ook werken na een beginner cutoff',
      'Overgang van beginner naar gevorderde verdieping is betrouwbaarder gemaakt',
    ],
  },
  {
    version: '2.2.7',
    title: 'Testinformatie voor AWN',
    items: [
      'Nieuwe uitleg- en testinformatie op het startscherm',
      'Heldere beschrijving van niveaus, training, vrij spelen en potentie',
      'Expertboom en AWN-fases beter uitlegbaar voor testers',
    ],
  },
  {
    version: '2.2.6',
    title: 'AWN expertboom',
    items: [
      'Expert start nu in een volledige AWN-bronboommodus',
      'Branchlabels springen door naar grotere AWN-secties',
      'Bronvragen uit de 511-knooppuntenboom zijn nu runtime beschikbaar',
    ],
  },
  {
    version: '2.2.5',
    title: 'AWN testfase 4-5',
    items: [
      'Geslepen werktuigen krijgen vervolgknoppen',
      'Doorboorde werktuigen en hamerbijlen zijn verdiept',
      'Fase 4 en 5 van het AWN-progressieplan zijn geactiveerd',
    ],
  },
  {
    version: '2.2.4',
    title: 'AWN testfase 3',
    items: [
      'Vuistbijlen kregen een eerste subtypeboom op gevorderd niveau',
      'Bifaciale werktuigen zijn als aparte AWN-testfase toegevoegd',
      'Eerste handmatige testpaden voor vuistbijlverdieping zijn vastgelegd',
    ],
  },
  {
    version: '2.2.3',
    title: 'AWN testfase 2',
    items: [
      'Spitsen krijgen een eerste subtypeboom op gevorderd',
      'Schrabbers krijgen bredere subtypevertakkingen',
      'Fase 2 van het AWN-progressieplan is geactiveerd',
    ],
  },
  {
    version: '2.2.2',
    title: 'AWN testfase 1',
    items: [
      'Eerste vervolgknoppen op beginner-resultaten',
      'Testfase voor klingen en afslagen',
      'AWN-progressieplan vastgelegd voor verdere uitrol',
    ],
  },
  {
    version: '2.3.0',
    title: 'Niveau dropdown & Lucide iconen',
    items: [
      'Niveaukeuze als dropdown (alleen ontgrendelde niveaus)',
      'Alle iconen vervangen door Lucide',
      'Pijlpunt foto als app-icoon',
      'Docent whitelist met e-mailbeveiliging',
    ],
  },
  {
    version: '2.2.0',
    title: 'Gebruikersprofiel & Progressiesysteem',
    items: [
      'Voortgangsbalk naar Gevorderd niveau',
      'Correct/validaties teller',
      'Lokaal opgeslagen profiel',
    ],
  },
  {
    version: '2.1.2',
    title: 'QR code direct join',
    items: ['Scan QR-code om direct een trainingsessie te joinen'],
  },
  {
    version: '2.1.1',
    title: 'Training sessie verbeteringen',
    items: ['Stabiliteit en bugfixes in de trainingsessie'],
  },
  {
    version: '2.1.0',
    title: 'UI Redesign',
    items: ['Educatieve focus', 'Verbeterde mobiele ervaring'],
  },
  {
    version: '2.0.0',
    title: 'Mobiele versie',
    items: ['Volledige herschrijving voor mobiel gebruik'],
  },
];


export function StartScreen({
  onStartPractice,
  onStartQuickStart,
  onStartTraining,
  onOpenTrainerDashboard,
  onViewHistory,
  isLoggedIn,
  version,
  initialJoinCode,
  onJoinCodeUsed
}: StartScreenProps) {
  const { profile, currentLevel, setCurrentLevel, isLevelUnlocked, progress, progressToExpert } = useUser();
  const { isAdmin } = useAuth();

  const [mode, setMode] = useState<'main' | 'join-training'>(initialJoinCode ? 'join-training' : 'main');
  const [sessionCode, setSessionCode] = useState(initialJoinCode || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showSandboxOption, setShowSandboxOption] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const quickStartDefinitions = getQuickStartDefinitionsForLevel(currentLevel);
  const quickStartGroups = quickStartDefinitions.reduce<Record<QuickStartCategory, typeof quickStartDefinitions>>(
    (groups, definition) => {
      if (!groups[definition.category]) {
        groups[definition.category] = [];
      }
      groups[definition.category].push(definition);
      return groups;
    },
    {
      Kernen: [],
      'Afslag en kling': [],
      Kernwerktuigen: [],
      Bifaciaal: [],
      Geslepen: [],
      Doorboord: [],
    }
  );

  const handleJoinTraining = () => {
    if (!sessionCode.trim()) { setError('Vul een sessiecode in'); return; }
    if (!name.trim()) { setError('Vul je naam in'); return; }
    setError('');
    if (onJoinCodeUsed) onJoinCodeUsed();
    onStartTraining(sessionCode.trim().toUpperCase(), name.trim());
  };

  // Training deelnemen scherm
  if (mode === 'join-training') {
    return (
      <div className="h-full bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">
          <button
            onClick={() => setMode('main')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            Terug
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Training Deelnemen</h1>
              <p className="text-sm text-white/70">Scan QR of vul code in</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Sessiecode</label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="bijv. AWN-2024-MAART"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Je naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hoe heet je?"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg"
              />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
            <button
              onClick={handleJoinTraining}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Deelnemen
            </button>
          </div>
          <p className="text-center text-stone-500 text-sm mt-6">
            Vraag je docent om de sessiecode of scan de QR-code
          </p>
        </div>
      </div>
    );
  }

  // Hoofd startscherm
  return (
    <div className="h-full bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col overflow-auto">

      {/* Header */}
      <header className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">

        {/* Top-right knoppen */}
        <div className="absolute top-4 right-4 flex gap-1">
          <button
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Info"
          >
            <Info size={18} />
          </button>
          {(!isLoggedIn || isAdmin) && (
            <button
              onClick={onOpenTrainerDashboard}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title={isAdmin ? 'Docent Dashboard' : 'Docent inloggen'}
            >
              {isAdmin ? <Settings size={18} /> : <LogIn size={18} />}
            </button>
          )}
        </div>

        {/* Gecentreerde titel */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            <img src="/steentijd.jpg" alt="Vuursteen pijlpunt" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center tracking-wide">STEENTIJD</h1>
        <p className="text-center text-white/80 text-sm mt-1">Leer artefacten herkennen</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="max-w-md mx-auto w-full space-y-4">

          {/* Niveau Selector */}
          <LevelSelector
            currentLevel={currentLevel}
            unlockedLevels={profile.unlockedLevels}
            onSelectLevel={setCurrentLevel}
          />

          {/* Voortgangsbalk */}
          {isLevelUnlocked('gevorderd') ? (
            <ProgressBar
              correctProgress={progressToExpert.correctProgress}
              validationProgress={progressToExpert.validationProgress}
              totalCorrect={profile.stats.gevorderd.correct}
              totalValidations={profile.docentValidations}
              correctNeeded={progressToExpert.correctNeeded}
              validationsNeeded={progressToExpert.validationsNeeded}
              isUnlocked={isLevelUnlocked('expert')}
              targetLevel="expert"
              correctTarget={30}
              validationTarget={10}
            />
          ) : (
            <ProgressBar
              correctProgress={progress.correctProgress}
              validationProgress={progress.validationProgress}
              totalCorrect={profile.totalCorrect}
              totalValidations={profile.docentValidations}
              correctNeeded={progress.correctNeeded}
              validationsNeeded={progress.validationsNeeded}
              isUnlocked={false}
              targetLevel="gevorderd"
              correctTarget={20}
              validationTarget={5}
            />
          )}

          {/* Hoofdactie */}
          <div className="space-y-2">
            <button
              onClick={() => onStartPractice(currentLevel, false)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-xl p-5 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Camera size={28} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Start Determinatie</h2>
                  <p className="text-white/80 text-sm">
                    {currentLevel === 'beginner' ? 'Met hints en hulp' : 'Zelfstandig determineren'}
                  </p>
                </div>
              </div>
            </button>

            {currentLevel !== 'beginner' && quickStartDefinitions.length > 0 && (
              <>
                <button
                  onClick={() => setShowQuickStart(!showQuickStart)}
                  className="w-full flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-amber-600 transition-colors py-1"
                >
                  {showQuickStart
                    ? <><ChevronUp size={14} /> Verberg snelle instap</>
                    : <><ChevronDown size={14} /> Snelle instap voor gevorderden en experts</>}
                </button>

                {showQuickStart && (
                  <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-sm space-y-2">
                    <p className="text-xs text-stone-600">
                      Kies een vermoedelijke artefactfamilie. De AI controleert daarna alleen of deze instap plausibel is.
                    </p>
                    {Object.entries(quickStartGroups).map(([category, definitions]) =>
                      definitions.length > 0 ? (
                        <div key={category} className="space-y-2 pt-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            {category}
                          </p>
                          {definitions.map((definition) => (
                            <button
                              key={definition.id}
                              onClick={() => onStartQuickStart(currentLevel, definition.id)}
                              className="w-full rounded-xl border border-stone-200 px-3 py-3 text-left hover:border-amber-400 hover:bg-amber-50 transition-colors"
                            >
                              <p className="text-sm font-semibold text-stone-800">{definition.label}</p>
                              <p className="mt-1 text-xs text-stone-500">{definition.description}</p>
                            </button>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowSandboxOption(!showSandboxOption)}
              className="w-full flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-amber-600 transition-colors py-1"
            >
              {showSandboxOption
                ? <><ChevronUp size={14} /> Verberg opties</>
                : <><ChevronDown size={14} /> Vrij spelen (zonder voortgang)</>
              }
            </button>

            {showSandboxOption && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <p className="text-xs text-stone-500 mb-2">
                  Oefen op elk niveau zonder dat het meetelt voor je voortgang.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartPractice('beginner', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <Sprout size={14} /> Beginner
                  </button>
                  <button
                    onClick={() => onStartPractice('gevorderd', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                  >
                    <Leaf size={14} /> Gevorderd
                  </button>
                  <button
                    onClick={() => onStartPractice('expert', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors"
                  >
                    <Star size={14} /> Expert
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secundaire acties */}
          <div className="flex gap-3">
            <button
              onClick={onViewHistory}
              className="flex-1 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                  <Archive size={24} className="text-stone-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">Geschiedenis</span>
              </div>
            </button>

            <button
              onClick={() => setMode('join-training')}
              className="flex-1 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GraduationCap size={24} className="text-amber-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">Training</span>
              </div>
            </button>
          </div>

          <button
            onClick={() => setShowInfo(true)}
            className="w-full bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen size={22} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-stone-800">Uitleg & testinformatie</h3>
                <p className="text-xs text-stone-500">
                  Voor AWN-testers, trainers, liefhebbers en geinteresseerden
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-stone-400 text-xs">v{version} - AWN Steentijdwerkgroep</p>
      </footer>

      {/* Info modal — zelfde stijl als v1 welkomstscherm */}
      {showInfo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[2000]" onClick={() => setShowInfo(false)} />
          <div className="fixed inset-4 z-[2000] flex items-center justify-center pointer-events-none">
            <div
              className="rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md max-h-full pointer-events-auto bg-white dark:bg-stone-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center">
                <h2 className="text-xl font-bold">Steentijd v2</h2>
                <p className="text-amber-200 text-sm">Uitleg, testinformatie en ontwikkelrichting</p>
              </div>

              {/* Scrollbare content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Wat deze app doet</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Steentijd is een mobiele determinatie-app voor stenen artefacten op basis van het AWN-determinatie-algoritme.
                    </p>
                    <p>
                      De app is bruikbaar als leeromgeving, als trainingsinstrument en als praktische hulp voor liefhebbers en geinteresseerden die stap voor stap een artefact willen bekijken.
                    </p>
                    <p>
                      V2 combineert een toegankelijke beginnerinstap met verdiepingen op gevorderd niveau en een expertmodus die nu op de volledige AWN-bronboom is gebaseerd.
                    </p>
                  </div>
                </section>

                <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">Niveaus in deze versie</h3>
                  <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                    <p><strong>Beginner</strong> — verkorte, begrijpelijke instapboom met hulp, context en referentiebeelden.</p>
                    <p><strong>Gevorderd</strong> — verdieping op artefactgroepen waar de AWN-bron echt verder uitsplitst, zoals spitsen, schrabbers, vuistbijlen, geslepen en doorboorde werktuigen.</p>
                    <p><strong>Expert</strong> — werkt zonder verkorte beginnerboom en gebruikt de volledige AWN-bronstructuur als basis voor determinatie.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Hoe dit tot stand is gekomen</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      De inhoudelijke basis komt uit het AWN-determinatie-algoritme en de handleiding van de Landelijke Werkgroep Steentijd.
                    </p>
                    <p>
                      De app is eerst opgebouwd als werkbare beginnerboom en daarna gefaseerd uitgebreid met AWN-verdiepingen voor klingen, afslagen, spitsen, schrabbers, bifaciale werktuigen, geslepen werktuigen en doorboorde werktuigen.
                    </p>
                    <p>
                      In deze versie is ook een expertmodus toegevoegd die de volledige AWN-bronboom als uitgangspunt gebruikt.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Doorgroeien en vrij spelen</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Van <strong>Beginner</strong> naar <strong>Gevorderd</strong> groei je door met correcte determinaties en docentvalidaties.
                    </p>
                    <p>
                      Reguliere doorgroei werkt via beide sporen tegelijk: correcte determinaties én docentvalidaties. Een docent kan een gebruiker daarnaast handmatig promoveren.
                    </p>
                    <p>
                      Van <strong>Gevorderd</strong> naar <strong>Expert</strong> groeit de gebruiker verder via 30 correcte determinaties op <strong>gevorderd niveau</strong> en 10 docentvalidaties.
                    </p>
                    <p>
                      Via <strong>Vrij spelen</strong> kun je beginner, gevorderd en expert direct testen zonder dat dit invloed heeft op de opgeslagen voortgang.
                    </p>
                    <p>
                      Daardoor is de app niet alleen bruikbaar voor trainingen, maar ook voor mensen die willen oefenen, verkennen of gewoon interesse hebben in steentijdartefacten.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Training, docent en validatie</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Trainers of docenten kunnen sessies aanmaken, deelnemers laten instromen via code of QR, en determinaties beoordelen in het docentdashboard.
                    </p>
                    <p>
                      Een docent kan determinaties goed- of afkeuren en gebruikers handmatig naar een hoger niveau promoveren.
                    </p>
                    <p>
                      <strong>Belangrijk:</strong> in de huidige V2 is er nog geen aparte <strong>validatorrol</strong>. Die validatie ligt nu bij de docent/trainer. Een losse validatorrol is een logische volgende stap, maar is nog niet apart ingericht in de interface.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Waar testers op kunnen letten</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Testers kunnen nu zowel de praktische bruikbaarheid als de AWN-logica beoordelen:
                    </p>
                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                      <li>• klopt de beginnerinstap voor nieuwe gebruikers?</li>
                      <li>• verschijnen verdiepingen op logische momenten?</li>
                      <li>• voelt de expertmodus inhoudelijk als de AWN-bronstructuur?</li>
                      <li>• zijn trainer en validatie bruikbaar voor oefen- en lessituaties?</li>
                    </ul>
                  </div>
                </section>

                <section className="rounded-xl p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
                  <h3 className="text-sm font-semibold mb-2 text-stone-800 dark:text-stone-100">Potentie van deze app</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Deze app kan uitgroeien tot een gedeeld hulpmiddel voor zelfstudie, training, veldgebruik en kwaliteitscontrole rond determinatie.
                    </p>
                    <p>
                      De combinatie van beginnerinstap, expertverdieping, trainingssessies, validatie, kaartfuncties en opgeslagen determinaties maakt het mogelijk om zowel onderwijs als praktijk te ondersteunen.
                    </p>
                    <p>
                      Voor liefhebbers en geinteresseerden is de app al bruikbaar als begeleide kennismaking met het determineren van steentijdartefacten, ook zonder directe toegang tot trainingssessies.
                    </p>
                  </div>
                </section>

                <section className="rounded-xl p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
                  <h3 className="text-sm font-semibold mb-2 text-stone-800 dark:text-stone-100">AWN Werkgroep Steentijd</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    Deze app is gebaseerd op het determinatie-algoritme van de AWN Landelijke Werkgroep Steentijd.
                  </p>
                  <div className="space-y-1">
                    {[
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/", label: "Over de werkgroep" },
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/determinatie/", label: "Determinatie-algoritme" },
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/vondstkaart/", label: "Vondstkaart Nederland" },
                    ].map(({ href, label }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        <span className="text-stone-400">→</span>{label}
                      </a>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl p-3 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>Let op:</strong> Dit blijft een hulpmiddel. Bij twijfel of bij inhoudelijke discussie hoort de beoordeling uiteindelijk bij de AWN-expertise en niet alleen bij de app.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Wat is nieuw?</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {CHANGELOG.map((entry) => (
                      <div key={entry.version} className="text-xs border-l-2 border-amber-400 dark:border-amber-600 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800 dark:text-stone-100">v{entry.version}</span>
                          <span className="text-stone-400">{entry.title}</span>
                        </div>
                        <ul className="mt-0.5 text-stone-500 dark:text-stone-400">
                          {entry.items.map((item, i) => <li key={i}>• {item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-4 py-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <button
                  onClick={() => setShowInfo(false)}
                  className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
