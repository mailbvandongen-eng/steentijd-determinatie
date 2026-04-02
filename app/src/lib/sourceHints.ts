export interface SourceHint {
  short: string;
  detail?: string;
  pitfall?: string;
  source: string;
}

const SOURCE_HINTS: Record<string, SourceHint> = {
  '5': {
    short: 'Kijk alleen naar echt gladde, gepolijste vlakken; gewone breukvlakken tellen niet als geslepen.',
    detail: 'Geslepen vuursteen heeft een bewust afgewerkt oppervlak. Ruwe breukvlakken blijven korrelig of schelpvormig.',
    pitfall: 'Verwar glans door gebruik of verwering niet met een werkelijk geslepen vlak.',
    source: 'Algoritme vraag 5, handleiding geslepen artefacten',
  },
  '6': {
    short: 'Een ventrale zijde is de gladde buikzijde van een afslag of kling, vaak met een slagbult.',
    detail: 'Zo’n ventrale zijde wijst erop dat je met een afslag of kling te maken hebt, niet met een kern of bifaciaal werktuig.',
    pitfall: 'Kijk niet alleen naar gladheid; zoek ook naar slagpunt en afslagvolgorde.',
    source: 'Algoritme vraag 6, handleiding basiskenmerken afslag/kling',
  },
  '7': {
    short: 'Afslagnegatieven zijn littekens van eerder afgeslagen stukken, geen toevallige kras of recente breuk.',
    detail: 'Let op holle negatieven met duidelijke richting en samenhang in het reductiepatroon.',
    pitfall: 'Recente beschadigingen geven vaak losse, scherpe breuken zonder logisch patroon.',
    source: 'Algoritme vraag 7, handleiding basisdeterminatie',
  },
  '11': {
    short: 'Zoek naar een echt herkenbaar slagvlak waarop doelgericht is geslagen.',
    detail: 'Een groot of herkenbaar slagvlak opent in de bron de kernroutes met Levallois-, discus- of andere kernsubtypen.',
    pitfall: 'Een willekeurig breukvlak is nog geen slagvlak.',
    source: 'Algoritme vraag 11, handleiding kernkenmerken',
  },
  '12': {
    short: 'Levallois herken je aan naar het midden gerichte negatieven en een schildpadachtige opbouw.',
    detail: 'De afslagen zijn aan één zijde steiler; de kern oogt voorbereid om een gewenste afslag of kling te leveren.',
    pitfall: 'Een kern met alleen veel negatieven is niet automatisch Levallois.',
    source: 'Algoritme vraag 12, handleiding Levallois-techniek',
  },
  '12a': {
    short: 'Een discusvormige kern heeft rondom naar het midden gerichte negatieven aan beide zijden.',
    detail: 'De vorm is rond of schijfachtig, met reductie aan boven- en onderzijde.',
    pitfall: 'Verwar een enkele bolle zijde niet met een echte discusvormige opbouw.',
    source: 'Algoritme vraag 12a, handleiding diskusvormige kernen',
  },
  '20': {
    short: 'Zoek op de Levallois-kern naar één groot ovaal negatief van een doelafslag.',
    detail: 'Dat grote centrale negatief is kenmerkend voor de afslagvariant binnen Levallois.',
    pitfall: 'Meerdere losse negatieven zonder dominante afslag passen minder goed.',
    source: 'Algoritme vraag 20, handleiding Levallois-kernsubtypen',
  },
  '21': {
    short: 'Klingvormige negatieven op de Levallois-kern wijzen op een Levallois-klingkern.',
    detail: 'De negatieven zijn langwerpig en doelgericht voorbereid, niet enkel toevallig lang.',
    pitfall: 'Een gewone klingkern is niet hetzelfde als een Levallois-klingkern.',
    source: 'Algoritme vraag 21, handleiding Levallois-kernsubtypen',
  },
  '23': {
    short: 'Kijk of de naar het midden gerichte negatieven vooral aan één zijde of aan beide zijden liggen.',
    detail: 'Aan één zijde past bij herhaald gebruikte Levallois, aan beide zijden bij een diskusvormige kern.',
    pitfall: 'Laat je niet misleiden door een enkele bijkomende afslag aan de tweede zijde.',
    source: 'Algoritme vraag 23, handleiding Levallois versus diskusvorm',
  },
  '71': {
    short: 'Cortex op de dorsale zijde wijst op een vroege kling of een natuurlijke rug.',
    detail: 'Controleer of de cortex echt op de rug ligt tegenover een scherpe zijde; dat kan richting rugmes wijzen.',
    pitfall: 'Restcortex alleen op een klein hoekje is minder overtuigend.',
    source: 'Algoritme vraag 71, handleiding klinggroepen',
  },
  '73': {
    short: 'Een Levallois-kling toont een voorbereid dorsaal patroon met naar het midden gerichte negatieven.',
    detail: 'Kijk naar regelmaat en voorbereiding, niet alleen naar langwerpigheid.',
    pitfall: 'Veel klingen zijn lang, maar missen het typische Levallois-patroon.',
    source: 'Algoritme vraag 73, handleiding Levallois-klingen',
  },
  '75': {
    short: 'Kernpreparatieklingen tonen op de dorsale zijde sporen die haaks staan op de uiteindelijke slagrichting.',
    detail: 'Ze zijn gemaakt om de kern verder voor te bereiden, niet als eindproduct.',
    pitfall: 'Verwar dwarse preparatiesporen niet met latere retouche.',
    source: 'Algoritme vraag 75, handleiding kernpreparatieklingen',
  },
  '77': {
    short: 'Montbani-achtige klingen hebben regelmatige, parallelle zijden en negatieven.',
    detail: 'De kling oogt gestandaardiseerd en strak in plaats van grillig of toevallig.',
    pitfall: 'Niet elke rechte kling is meteen Montbani-stijl.',
    source: 'Algoritme vraag 77, handleiding klingsubtypen',
  },
  '85': {
    short: 'Vraag je af of er na het losslaan nog bewuste nabewerking is aangebracht.',
    detail: 'Bij gemodificeerde klingen gaat het om retouche of een duidelijk gevormde werkrand.',
    pitfall: 'Gebruikssporen of kleine beschadigingen zijn niet altijd bewuste modificatie.',
    source: 'Algoritme vraag 85, handleiding gemodificeerde klingen',
  },
  '101': {
    short: 'Versplinterde uiteinden horen bij verbrijzelde of zwaar belaste werktuigen.',
    detail: 'Kijk naar duidelijke uiteinden met samengedrukte of versplinterde randen, niet naar gewone chips.',
    pitfall: 'Recente schade kan hierop lijken, maar mist vaak systematiek.',
    source: 'Algoritme vraag 101, handleiding verbrijzelde artefacten',
  },
  '103': {
    short: 'Fijn bewerkt met oppervlakteretouche betekent systematische, relatief fijne retouche over het oppervlak.',
    detail: 'Dat opent in de bron de fijn bewerkte bifaciale en dolk/spits-routes.',
    pitfall: 'Grove bekapping of enkele grote afslagen tellen hier niet als fijne oppervlakteretouche.',
    source: 'Algoritme vraag 103, handleiding fijn versus grof bifaciaal',
  },
  '110': {
    short: 'Beoordeel eerst de globale vorm: bijl, vuistbijl, bladvorm of iets anders bifaciaals.',
    detail: 'Deze stap bepaalt of je naar vuistbijlen en bladvormen gaat of naar andere bifaciale werktuigen.',
    pitfall: 'Laat je niet alleen leiden door één punt of één snede; kijk naar de totale contour.',
    source: 'Algoritme vraag 110, handleiding bifaciale hoofdgroepen',
  },
  '125': {
    short: 'Een afgewerkte werkkant of punt wijst op vuistbijl- of bladvormroutes; een echte snede eerder op bijl/beitel.',
    detail: 'Dit is de hoofdknip tussen vuistbijlvormen en kernwerktuigen met snede.',
    pitfall: 'Een beschadigde punt kan ten onrechte op een snede lijken.',
    source: 'Algoritme vraag 125, handleiding vuistbijl versus bijl/beitel',
  },
  '136': {
    short: 'Hier splitst de bron dunnere vuistbijlen van heel kleine of heel dunne vormen.',
    detail: 'Dunnere vuistbijlen gaan daarna naar driehoekige en hartvormige subtypen.',
    pitfall: 'Gebruik breedte-dikteverhouding en totale indruk samen, niet alleen op het oog.',
    source: 'Algoritme vraag 136, handleiding vuistbijlsubtypen',
  },
  '137': {
    short: 'Een driehoekige vuistbijl heeft rechte tot licht convexe of concave zijden en een rechte, scherpe basis.',
    detail: 'Past hij net niet zuiver, dan gaat de bron verder naar langwerpig of sub-driehoekig.',
    pitfall: 'Verwar driehoekige vuistbijlen niet met smalle lancetvormen of bout-coupé.',
    source: 'Algoritme vraag 137, handleiding driehoekige vuistbijlen',
  },
  '333': {
    short: 'Controleer of de schrabber echt op een kling is gemaakt en niet op een afslag.',
    detail: 'Een klingbasis is langwerpig en relatief smal; daarna splitst de bron verder naar klingschrabber-subtypen.',
    pitfall: 'Een brede kling kan op een afslag lijken als je alleen naar de kap kijkt.',
    source: 'Algoritme vraag 333, handleiding schrabbers op kling',
  },
  '335': {
    short: 'Een schrabberkap aan één uiteinde wijst op een enkelvoudige klingschrabber.',
    detail: 'Zit er ook een tweede actieve kap aan het andere uiteinde, dan hoort hij in de dubbele subtypegroep.',
    pitfall: 'Een beschadigd uiteinde is niet automatisch een tweede schrabberkap.',
    source: 'Algoritme vraag 335, handleiding klingschrabbers',
  },
  '470': {
    short: 'Een cirkelsegmentvormige dubbelspits heeft twee punten en een duidelijke segmentvorm.',
    detail: 'Daarna vraagt de bron door naar Azilien, cirkelsegment en andere segmentvormige spitsen.',
    pitfall: 'Een gewone gebogen spits is nog geen echte cirkelsegmentvorm.',
    source: 'Algoritme vraag 470, handleiding segmentvormige spitsen',
  },
  '476': {
    short: 'Kijk of één zijde volledig of gedeeltelijk geretoucheerd is, eventueel met een geretoucheerde basis.',
    detail: 'Deze route opent veel eenzijdig geretoucheerde spitsen zoals Tjonger, Cheddar en Creswell.',
    pitfall: 'Gebruikssporen langs één zijde zijn niet hetzelfde als systematische retouche.',
    source: 'Algoritme vraag 476, handleiding eenzijdig geretoucheerde spitsen',
  },
  '600': {
    short: 'Vraag eerst of het geslepen artefact uit een bijlfragment is gemaakt; dat is een aparte groep.',
    detail: 'Een gepolijst fragment met secundaire vormgeving kan hier thuishoren.',
    pitfall: 'Niet elk fragment met een glad vlak is automatisch van een bijl afkomstig.',
    source: 'Algoritme vraag 600, handleiding geslepen vuurstenen artefacten',
  },
  '602': {
    short: 'De breedteknip rond 2,9 cm scheidt bijlen van smallere beitels in de bron.',
    detail: 'Breder wijst richting bijl, smaller richting beitel en guts/disselbeitel.',
    pitfall: 'Meet op het breedste punt van het werktuig en niet alleen bij de snede.',
    source: 'Algoritme vraag 602, handleiding geslepen bijlen en beitels',
  },
  '700': {
    short: 'Kijk of het gat echt volledig door het artefact gaat.',
    detail: 'Volledig doorboord opent de rolsteen-, schijfsteen-, dubbelbijl- en hamerbijlroutes.',
    pitfall: 'Een begin van een boring of natuurlijke holte is nog geen volledig doorboord artefact.',
    source: 'Algoritme vraag 700, handleiding doorboorde artefacten',
  },
  '711': {
    short: 'Een hamervorm opent de hamerbijlgroep; anders blijf je in andere doorboorde werktuigtypen.',
    detail: 'Daarna volgt in de bron het onderscheid tussen gefacetteerde, knop- en andere hamerbijlen.',
    pitfall: 'Een dubbelbijl of schoenleestwig kan globaal massief lijken, maar is niet automatisch hamervormig.',
    source: 'Algoritme vraag 711, handleiding hamerbijlen',
  },
};

export function getSourceHint(questionId: string): SourceHint | null {
  return SOURCE_HINTS[questionId] ?? null;
}
