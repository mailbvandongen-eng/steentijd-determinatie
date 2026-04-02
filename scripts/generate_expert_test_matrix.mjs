#!/usr/bin/env node

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = resolve(ROOT, 'app/src/lib/decisionTree.ts');
const TREE_PATH = resolve(ROOT, 'app/src/data/beslisboom.json');
const IMAGES = pathToFileURL(resolve(ROOT, 'app/src/data/images_metadata.json')).href;
const TREE = pathToFileURL(resolve(ROOT, 'app/src/data/beslisboom.json')).href;
const REPORT_DIR = resolve(ROOT, 'audit');
const REPORT_JSON = resolve(REPORT_DIR, 'expert_test_matrix.json');
const REPORT_MD = resolve(REPORT_DIR, 'expert_test_matrix.md');

const SCENARIOS = [
  { id: 'kern_levallois_afslag', label: 'Kern: Levallois-kern', targetPrefixes: ['kern--levallois'], forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_kling', label: 'Kern: klingkern', targetPrefixes: ['kern--kling'], forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_montbani', label: 'Kern: Montbani-klingkern', targets: ['met-parallelle-afslagnegatieven-kern--kling--montbani', 'kern--kling--montbani'], forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_kombewa', label: 'Kern: Kombewa-kern', target: 'kern--kombewa', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_quina', label: 'Kern: Quina-kern', target: 'kern--quina', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_veelvlaks', label: 'Kern: veelvlakkige kern', target: 'kern--veelvlaks', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_bipolair', label: 'Kern: bipolaire kern', target: 'kern--bipolair', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_diskus', label: 'Kern: diskusvormige kern', targets: ['beide-zijden-licht-bol-een-kern--diskusvormig', 'aan-beide-zijden-kern--diskusvormig'], forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_afslag_piramidaal', label: 'Kern: piramidale afslagkern', target: 'kern--afslag--piramida-al', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_lamelle', label: 'Kern: lamellenkern', target: 'kern--lamelle', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_kielvormig', label: 'Kern: kielvormige kern', targetPrefixes: ['kern--kielvormig', 'een-kern--kielvormig'], forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_coincy', label: 'Kern: Coincy-klingkern', target: 'kern--kling--coincy', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_bidirectioneel', label: 'Kern: bidirectionele kern', target: 'kern--bidirectioneel', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_bidirectioneel_kling', label: 'Kern: bidirectionele klingkern', target: 'kern--bidirectioneel--kling', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_bidirectioneel_afslag', label: 'Kern: bidirectionele afslagkern', target: 'kern--bidirectioneel--afslag', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'kern_orthogonaal', label: 'Kern: orthogonale kern', target: 'kern--orthogon-aal', forbiddenPrefixes: ['afslag', 'kling--', 'schrabber', 'steker', 'spits--'] },
  { id: 'werktuig_rugmes', label: 'Kling/afslag: rugmes', target: 'rugmes', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand'] },
  { id: 'werktuig_schrabber', label: 'Kling/afslag: schrabber', target: 'schrabber', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_steker', label: 'Kling/afslag: steker', targetPrefixes: ['steker'], forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_boor', label: 'Kling/afslag: boor', target: 'boor', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_klingschrabber', label: 'Kling/afslag: klingschrabber', targetPrefixes: ['schrabber--kling'], forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_stekerafslag', label: 'Kling/afslag: stekerafslag', target: 'stekerafslag', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_lamelle', label: 'Kling/afslag: lamelle', target: 'lamelle', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand'] },
  { id: 'werktuig_rabot', label: 'Kling/afslag: carene/rabot', targets: ['grattoir--caréné-rabot-of-schrabber--kern', 'schrabber--bootvormig'], forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand'] },
  { id: 'werktuig_schrabber_zij', label: 'Kling/afslag: zijschrabber', target: 'schrabber--zij', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_schrabber_duimnagel', label: 'Kling/afslag: duimnagelschrabber', target: 'schrabber--duimnagel', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_schrabber_bec', label: 'Kling/afslag: bec-vormige schrabber', targets: ['schrabber--bec-vormig', 'schrabber--snuitvormig'], forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_steker_transversaal', label: 'Kling/afslag: transversale steker', target: 'steker--transversaal', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_steker_noailles', label: 'Kling/afslag: Noailles-steker', target: 'steker--noailles', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_afgeknot', label: 'Kling/afslag: afgeknot artefact', target: 'afgeknot-artefact', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'schaaf', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_gekerfd', label: 'Kling/afslag: gekerfd werktuig', target: 'werktuig--gekerfd', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_getand', label: 'Kling/afslag: getand werktuig', target: 'werktuig--getand', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'schaaf', 'afgeknot', 'werktuig--gekerfd', 'rugmes'] },
  { id: 'werktuig_schaaf', label: 'Kling/afslag: schaaf', target: 'schaaf', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_schaaf_quina', label: 'Kling/afslag: Quina-schaaf', target: 'schaaf--quina', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'schrabber', 'steker', 'boor', 'afgeknot', 'werktuig--gekerfd', 'werktuig--getand', 'rugmes'] },
  { id: 'werktuig_combinatie', label: 'Kling/afslag: combinatiewerktuig', target: 'combinatiewerktuig', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes'] },
  { id: 'werktuig_schaaf_steker', label: 'Kling/afslag: schaaf-steker', target: 'schaaf--steker', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schrabber--', 'boor--', 'werktuig--gekerfd', 'werktuig--getand', 'afgeknot'] },
  { id: 'werktuig_schrabber_steker', label: 'Kling/afslag: schrabber-steker', target: 'schrabber--steker', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'boor--', 'werktuig--gekerfd', 'werktuig--getand', 'afgeknot'] },
  { id: 'werktuig_schrabber_boor', label: 'Kling/afslag: schrabber-boor', target: 'schrabber--boor', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'steker--', 'werktuig--gekerfd', 'werktuig--getand', 'afgeknot'] },
  { id: 'werktuig_steker_boor', label: 'Kling/afslag: steker-boor', target: 'steker--boor', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'schrabber--', 'werktuig--gekerfd', 'werktuig--getand', 'afgeknot'] },
  { id: 'werktuig_gekerfd_getand', label: 'Kling/afslag: gekerfd en getand artefact', target: 'gekerfd--en-getand--artefact', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'schrabber--', 'steker--', 'boor--', 'afgeknot'] },
  { id: 'werktuig_gekerfd_afgeknot', label: 'Kling/afslag: gekerfd en afgeknot artefact', target: 'gekerfd--en-afgeknot--artefact', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'schrabber--', 'steker--', 'boor--', 'werktuig--getand'] },
  { id: 'werktuig_getand_afgeknot', label: 'Kling/afslag: getand en afgeknot artefact', target: 'getand--en-afgeknot--artefact', forbiddenPrefixes: ['kern--', 'vuistbijl--', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'rugmes', 'schaaf--', 'schrabber--', 'steker--', 'boor--', 'werktuig--gekerfd'] },
  { id: 'spits_bladspits', label: 'Spits: bladspits', target: 'spits--bladspits', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_tjonger', label: 'Spits: Tjongerspits', target: 'spits--tjonger', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--bromme', 'spits--swidry', 'spits--font-robert', 'spits--havelter', 'spits--zonhoven'] },
  { id: 'spits_bromme', label: 'Spits: Bromme-spits', target: 'spits--bromme', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--tjonger', 'spits--swidry', 'spits--font-robert', 'spits--havelter', 'spits--zonhoven'] },
  { id: 'spits_swidry', label: 'Spits: Swidry-spits', target: 'spits--swidry', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--tjonger', 'spits--bromme', 'spits--font-robert', 'spits--havelter', 'spits--zonhoven'] },
  { id: 'spits_font_robert', label: 'Spits: Font-Robert-spits', target: 'spits--font-robert', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--tjonger', 'spits--bromme', 'spits--swidry', 'spits--havelter', 'spits--zonhoven'] },
  { id: 'spits_hamburg_kerf', label: 'Spits: Hamburg-kerfspits', target: 'spits--kerf-hamburg', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_lbk', label: 'Spits: LBK-spits', target: 'spits--lbk', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_trapezium_breed', label: 'Spits: breed trapezium', target: 'spits--trapezium--breed', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_trapezium_smal', label: 'Spits: smal trapezium', target: 'spits--trapezium--smal', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_transversaal', label: 'Spits: transversaalspits', target: 'spits--transversaal', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_azilien', label: 'Spits: Azilien-spits', target: 'spits--azilien', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_sauveterre', label: 'Spits: Sauveterre-spits', target: 'spits--sauveterre', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_naaldvormig', label: 'Spits: naaldvormige spits', target: 'spits--naaldvormig', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'spits_havelter', label: 'Spits: Havelter-steelspits', target: 'spits--havelter-steelspits', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--tjonger', 'spits--bromme', 'spits--swidry', 'spits--font-robert', 'spits--zonhoven'] },
  { id: 'spits_zonhoven', label: 'Spits: Zonhovenspits', target: 'spits--zonhoven', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'bijl-', 'beitel', 'doorboorde--', 'bijl-hamer', 'bijl-dubbel', 'spits--tjonger', 'spits--bromme', 'spits--swidry', 'spits--font-robert', 'spits--havelter'] },
  { id: 'vuistbijl_amandel', label: 'Bifaciaal: amandelvormige vuistbijl', target: 'vuistbijl--amandelvormig', forbiddenPrefixes: ['vuistbijl--hartvormig', 'vuistbijl--driehoekig', 'vuistbijl--micoque', 'vuistbijl--lancetvormig'] },
  { id: 'vuistbijl_faustkeilblatt', label: 'Bifaciaal: faustkeilblatt', target: 'vuistbijl--faustkeilblatt' },
  { id: 'vuistbijl_micoque', label: 'Bifaciaal: Micoque-vuistbijl', target: 'vuistbijl--micoque', forbiddenPrefixes: ['vuistbijl--amandelvormig', 'vuistbijl--hartvormig', 'vuistbijl--driehoekig', 'vuistbijl--lancetvormig'] },
  { id: 'vuistbijl_lancetvormig', label: 'Bifaciaal: lancetvormige vuistbijl', target: 'vuistbijl--lancetvormig', forbiddenPrefixes: ['vuistbijl--amandelvormig', 'vuistbijl--hartvormig', 'vuistbijl--driehoekig', 'vuistbijl--micoque'] },
  { id: 'vuistbijl_ficron', label: 'Bifaciaal: ficron', target: 'vuistbijl--ficron' },
  { id: 'vuistbijl_flesvormig', label: 'Bifaciaal: flesvormige vuistbijl', target: 'vuistbijl--flesvormig' },
  { id: 'vuistbijl_hartvormig', label: 'Bifaciaal: hartvormige vuistbijl', target: 'vuistbijl--hartvormig', forbiddenPrefixes: ['vuistbijl--amandelvormig', 'vuistbijl--driehoekig', 'vuistbijl--micoque', 'vuistbijl--lancetvormig'] },
  { id: 'vuistbijl_lang_hartvormig', label: 'Bifaciaal: langwerpig hartvormige vuistbijl', target: 'vuistbijl--langwerpig--hartvormig' },
  { id: 'vuistbijl_sub_hartvormig', label: 'Bifaciaal: sub-hartvormige vuistbijl', target: 'vuistbijl--sub-hartvormig' },
  { id: 'vuistbijl_driehoekig', label: 'Bifaciaal: driehoekige vuistbijl', target: 'vuistbijl--driehoekig', forbiddenPrefixes: ['vuistbijl--amandelvormig', 'vuistbijl--hartvormig', 'vuistbijl--micoque', 'vuistbijl--lancetvormig'] },
  { id: 'vuistbijl_lang_driehoekig', label: 'Bifaciaal: langwerpig driehoekige vuistbijl', target: 'vuistbijl--langwerpig--driehoekig' },
  { id: 'vuistbijl_sub_driehoekig', label: 'Bifaciaal: sub-driehoekige vuistbijl', target: 'vuistbijl--sub-driehoekig' },
  { id: 'vuistbijl_bout_coupe', label: 'Bifaciaal: bout-coupe', target: 'vuistbijl--bout--coupé' },
  { id: 'vuistbijl_limande', label: 'Bifaciaal: limande', target: 'vuistbijl--limande' },
  { id: 'vuistbijl_ovaal', label: 'Bifaciaal: ovale vuistbijl', target: 'vuistbijl--ovaal' },
  { id: 'vuistbijl_disque', label: 'Bifaciaal: ronde/disque-vuistbijl', target: 'vuistbijl--rond-og-vuistbijl--disque' },
  { id: 'vuistbijl_bootvormig', label: 'Bifaciaal: bootvormige vuistbijl', target: 'vuistbijl--bootvormig' },
  { id: 'vuistbijl_faustel', label: 'Bifaciaal: Fäustel', target: 'vuistbijl--fäustel' },
  { id: 'bifaciaal_uniface', label: 'Bifaciaal: uniface', target: 'uniface' },
  { id: 'geslepen_bijl', label: 'Geslepen: vuurstenen bijl', targetPrefixes: ['bijl-vlakbijl', 'bijl-met-', 'bijl-dunbladig', 'bijl-breedtoppig', 'bijl-smaltoppig', 'bijl-buren'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_beitel', label: 'Geslepen: beitel', targetPrefixes: ['beitel'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'bijl-vlakbijl', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_vlakbijl_klokvormig', label: 'Geslepen: klokvormige vlakbijl', target: 'bijl-vlakbijl--klokvormig', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_vlakbijl_trapezium', label: 'Geslepen: trapeziumvormige vlakbijl', target: 'bijl-vlakbijl--trapeziumvormig', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_vlakbijl_rechthoekig', label: 'Geslepen: rechthoekige vlakbijl', target: 'bijl-vlakbijl--rechthoekig', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_bijl_buren', label: 'Geslepen: Buren-bijl', target: 'bijl-buren', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_bijl_dikbladig', label: 'Geslepen: dikbladige vuurstenen bijl', targetPrefixes: ['bijl-met-rechthoekige--dwarsdoorsnede--dikbladig'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_bijl_dunbladig', label: 'Geslepen: dunbladige vuurstenen bijl', targetPrefixes: ['bijl-met-rechthoekige--dwarsdoorsnede--dunbladig'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_dissel', label: 'Geslepen: dissel', targetPrefixes: ['bijl-dissel'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'beitel--', 'bijl-vlakbijl', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_gutsbeitel', label: 'Geslepen: gutsbeitel', target: 'beitel--guts', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'bijl-vlakbijl', 'bijl-dissel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_disselbeitel', label: 'Geslepen: disselbeitel', target: 'beitel--dissel', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'bijl-vlakbijl', 'bijl-dissel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'geslepen_puntbeitel', label: 'Geslepen: puntbeitel', target: 'beitel--punt', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'doorboorde--', 'bijl-vlakbijl', 'bijl-dissel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'doorboord_hamerbijl', label: 'Doorboord: hamerbijl', targetPrefixes: ['bijl-hamer'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_dubbelbijl', label: 'Doorboord: dubbelbijl', targetPrefixes: ['bijl-dubbel'], forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_rolsteen', label: 'Doorboord: rolsteen', target: 'doorboorde--rolsteen', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'doorboord_schijfsteen', label: 'Doorboord: schijfvormige steen', target: 'doorboorde--schijfvormige--steen', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'doorboord_breedwig', label: 'Doorboord: breedwig', target: 'doorboorde--breedwig', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'doorboord_schoenleestwig', label: 'Doorboord: schoenleestwig', target: 'bijl-dissel--doorboord', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'bijl-dubbel'] },
  { id: 'doorboord_dubbelbijl_a', label: 'Doorboord: dubbelbijl type A', target: 'bijl-dubbel--type-a', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_dubbelbijl_b', label: 'Doorboord: dubbelbijl type B', target: 'bijl-dubbel--type-b', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_dubbelbijl_c', label: 'Doorboord: dubbelbijl type C', target: 'bijl-dubbel--type-c', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-hamer', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_hamerbijl_knop', label: 'Doorboord: knop-hamerbijl', target: 'bijl-hamer--knop', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_hamerbijl_type_g', label: 'Doorboord: hamerbijl type G', target: 'bijl-hamer--type-g', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_hamerbijl_type_k', label: 'Doorboord: hamerbijl type K', target: 'bijl-hamer--type-k', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_hamerbijl_type_l', label: 'Doorboord: hamerbijl type L', target: 'bijl-hamer--type-l', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
  { id: 'doorboord_hamerbijl_type_ba', label: 'Doorboord: hamerbijl type Ba', target: 'bijl-hamer--type-ba', forbiddenPrefixes: ['kern--', 'schrabber', 'steker', 'spits--', 'rugmes', 'lamelle', 'bijl-vlakbijl', 'beitel', 'bijl-dubbel', 'doorboorde--rolsteen', 'doorboorde--schijfvormige--steen', 'doorboorde--breedwig'] },
];

function patchSource(source) {
  return source
    .replace(
      "import imageMetadata from '../data/images_metadata.json';",
      `import imageMetadata from '${IMAGES}' with { type: 'json' };`
    )
    .replace(
      "import fullDecisionTreeData from '../data/beslisboom.json';",
      `import fullDecisionTreeData from '${TREE}' with { type: 'json' };`
    );
}

function formatTransitionStep(mod, questionId, answer, result) {
  const question = mod.getQuestion(questionId, 'expert');
  return {
    questionId,
    question: question?.vraag ?? '',
    answer,
    nextQuestion: result.nextQuestion ?? null,
    result: result.result ?? null,
    formattedResult: result.result ? mod.formatTypeName(result.result) : null,
  };
}

function targetMatches(mod, result, scenario) {
  if (!result?.isEnd || !result.result) return false;
  const raw = result.result;
  const formatted = mod.formatTypeName(raw);

  if (scenario.target) {
    return raw === scenario.target || formatted === mod.formatTypeName(scenario.target);
  }

  if (scenario.targets?.length) {
    return scenario.targets.some((target) => raw === target || formatted === mod.formatTypeName(target));
  }

  if (scenario.targetPrefixes?.length) {
    return scenario.targetPrefixes.some((prefix) => raw.startsWith(prefix));
  }

  return false;
}

function rawTargetMatches(mod, rawTarget, scenario) {
  if (!rawTarget) return false;
  const formatted = mod.formatTypeName(rawTarget);

  if (scenario.target) {
    return rawTarget === scenario.target || formatted === mod.formatTypeName(scenario.target);
  }

  if (scenario.targets?.length) {
    return scenario.targets.some((target) => rawTarget === target || formatted === mod.formatTypeName(target));
  }

  if (scenario.targetPrefixes?.length) {
    return scenario.targetPrefixes.some((prefix) => rawTarget.startsWith(prefix));
  }

  return false;
}

function pathHitsForbiddenTargets(path, scenario) {
  if (!scenario.forbiddenPrefixes?.length) return false;
  return path.some((step) =>
    step.result && scenario.forbiddenPrefixes.some((prefix) => step.result.startsWith(prefix))
  );
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), 'steentijd-expert-matrix-'));

  try {
    const source = await readFile(SOURCE, 'utf8');
    const patched = patchSource(source);
    const tempModule = join(tempDir, 'decisionTree.matrix.ts');
    await writeFile(tempModule, patched, 'utf8');
    const mod = await import(pathToFileURL(tempModule).href);
    const rawTree = JSON.parse(await readFile(TREE_PATH, 'utf8'));

    const start = mod.getTreeStartQuestionId('expert');
    const matrix = [];

    for (const scenario of SCENARIOS) {
      const queue = [{ questionId: start, path: [] }];
      const seen = new Set();
      let found = null;

      while (queue.length && !found) {
        const current = queue.shift();
        if (!current?.questionId) continue;

        for (const answer of ['ja', 'nee']) {
          const stateKey = `${current.questionId}:${answer}:${current.path.length}`;
          if (seen.has(stateKey)) continue;
          seen.add(stateKey);

          const result = mod.processAnswer(current.questionId, answer, 'expert');
          const step = formatTransitionStep(mod, current.questionId, answer, result);
          const nextPath = [...current.path, step];
          const rawTarget = rawTree[current.questionId]?.[answer];

          if (rawTargetMatches(mod, rawTarget, scenario)) {
            const forbidden = pathHitsForbiddenTargets(nextPath, scenario);
            found = {
              ...scenario,
              found: !forbidden,
              endResult: rawTarget,
              displayName: mod.formatTypeName(rawTarget),
              steps: nextPath,
              matchedOn: forbidden ? 'forbidden' : 'label',
            };
            break;
          }

          if (targetMatches(mod, result, scenario)) {
            const forbidden = pathHitsForbiddenTargets(nextPath, scenario);
            found = {
              ...scenario,
              found: !forbidden,
              endResult: result.result,
              displayName: mod.formatTypeName(result.result),
              steps: nextPath,
              matchedOn: forbidden ? 'forbidden' : 'end',
            };
            break;
          }

          if (result.nextQuestion && nextPath.length < 80) {
            queue.push({ questionId: result.nextQuestion, path: nextPath });
          }
        }
      }

      matrix.push(
        found ?? {
          ...scenario,
          found: false,
          endResult: null,
          displayName: null,
          steps: [],
          matchedOn: null,
        }
      );
    }

    await mkdir(REPORT_DIR, { recursive: true });
    await writeFile(REPORT_JSON, JSON.stringify({ startQuestion: start, scenarios: matrix }, null, 2) + '\n', 'utf8');

    const md = [
      '# Expert Test Matrix',
      '',
      `- startQuestion: \`${start}\``,
      `- scenarios: \`${matrix.length}\``,
      `- found: \`${matrix.filter((item) => item.found).length}\``,
      '',
      '## Scenario Overzicht',
      ...matrix.map((item) =>
        `- \`${item.id}\` ${item.label}: ${item.found ? `gevonden als \`${item.displayName}\`` : 'niet gevonden'}`
      ),
      '',
      '## Paden',
      ...matrix.flatMap((item) => {
        if (!item.found) {
          return [`### ${item.label}`, '', '- niet automatisch gevonden', ''];
        }

        return [
          `### ${item.label}`,
          '',
          `- resultaat: \`${item.displayName}\``,
          `- match: \`${item.matchedOn}\``,
          `- stappen: \`${item.steps.length}\``,
          ...item.steps.map(
            (step) =>
              `- \`${step.questionId}\` ${step.question} -> \`${step.answer}\`${step.nextQuestion ? ` -> \`${step.nextQuestion}\`` : ` => \`${step.formattedResult}\``}`
          ),
          '',
        ];
      }),
    ].join('\n');

    await writeFile(REPORT_MD, md, 'utf8');
    console.log(
      JSON.stringify(
        {
          startQuestion: start,
          scenarios: matrix.length,
          found: matrix.filter((item) => item.found).length,
          missing: matrix.filter((item) => !item.found).map((item) => item.id),
        },
        null,
        2
      )
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

await main();
