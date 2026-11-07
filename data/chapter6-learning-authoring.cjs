// Reviewed classroom scenarios retain existing topic/answer mappings and historical scope.
const t=(id,title,point,paragraphs,items,wrong)=>({id,title,point,paragraphs,items,wrong});
const missions=[
{id:'chapter6-mission1',quiz:'chapter6-quiz1',question:'How did a later expedition establish a continuing presence, and what limited its reach?',objectives:['Separate the 1564 departure from the 1565 Cebu settlement.','Identify command, navigation and local participation.','Explain the return connection without assuming universal control.'],topics:[
t('legazpi-voyage-sequence','Put the later voyage in order','Legazpi left Mexico in 1564; the expedition reached the islands and established a Spanish settlement in Cebu in 1565.',[
'Miguel Lopez de Legazpi led a later expedition, separate from Magellan’s. It departed Mexico, then part of New Spain, in 1564 and crossed the Pacific to the Philippine islands in 1565.',
'A Spanish settlement was established in Cebu in 1565, among existing communities. Read each timeline label: leaving, arriving and establishing a base are different events. The line shows selected events, not every stop or exact sailing direction.'
],[
['Which event belongs to 1564?','Legazpi’s expedition departed Mexico.','The departure preceded the Philippine events of 1565.'],
['A fictional timeline gives the same label to departure and settlement. How should it change?','Label the 1564 departure and 1565 Cebu settlement separately.','Different events need their own labels.'],
['Where did the expedition depart from?','Mexico, then part of New Spain.','This was a Pacific expedition from New Spain.'],
['A report calls Legazpi’s fleet Magellan’s returning ships. What corrects it?','They were different expeditions separated by decades.','Magellan died in 1521; Legazpi departed in 1564.'],
['Which year belongs to the Spanish settlement in Cebu?','1565.','The settlement followed the 1564 departure.'],
['What can the selected timeline explain without supplying navigation?','The order of labelled events.','Sequence does not establish exact distances or every stop.']
],[['Departure and settlement were one event in one place.','Leaving Mexico and establishing a Cebu base were different events.'],['Magellan personally led this 1564 voyage.','Legazpi’s expedition was later and separate.'],['The timeline proves instant control of every island.','An event sequence does not establish political reach.'],['Cebu had no history before 1565.','The Spanish base was established among existing communities.']]),
t('legazpi-aims-and-roles','Different people, different responsibilities','Legazpi commanded; Urdaneta contributed navigation knowledge. A sponsor’s aim is different from a task or result.',[
'The Spanish Crown sought occupation and a continuing presence. A workable Pacific return connection also mattered. These aims do not show that local communities accepted them.',
'Legazpi commanded. Andres de Urdaneta was an Augustinian friar with earlier Pacific experience who contributed navigation knowledge. A friar belongs to a religious community; learning his historical role does not require sharing his faith.',
'Try a fictional team record with columns for aim, command and navigation. Match each contribution to its column without giving one person credit for all crew work.'
],[
['Which pairing identifies two different roles?','Legazpi commanded; Urdaneta contributed navigation knowledge.','Command and navigation were distinct contributions.'],
['In a fictional team record, where does “establish a continuing presence” belong?','The sponsor’s aims.','It states an intended result rather than a person’s navigation task.'],
['What was a friar?','A member of a religious community.','The term describes Urdaneta’s religious role.'],
['A record names a commander and a navigator. What claim still needs more evidence?','That they alone performed every task.','Crew work and other contributions must not be erased.'],
['Who contributed navigation knowledge in this lesson?','Andres de Urdaneta.','His Pacific experience was relevant to navigation.'],
['Why separate aims from responsibilities?','A desired outcome and the work assigned to someone answer different questions.','Neither alone proves that the aim was achieved.']
],[['Legazpi sailed and navigated every ship alone.','Different crew members and navigators contributed.'],['Urdaneta decided the beliefs of every resident.','A religious role does not establish everyone else’s beliefs.'],['A religious title proves universal consent.','Consent needs evidence of local responses.'],['Every aim was automatically achieved.','A plan requires separate evidence of results.']]),
t('legazpi-local-responses','An agreement has a setting','Local opposition, force and an agreement involving Tupas all belong in Cebu’s history; one action is not everyone’s opinion.',[
'The expedition met people with their own leaders and interests. Establishing the Spanish presence in Cebu involved force and opposition. A Cebu marker also records an agreement between Rajah Tupas and Legazpi in 1565.',
'Conflict and a later agreement can both be part of the account. Try a fictional exhibit check: does one agreement prove everyone freely welcomed colonial rule? Ask who participated, what was agreed and what pressure surrounded the event.'
],[
['Which account includes local participation?','It names opposition and the agreement involving Tupas.','Local responses were part of what happened.'],
['A fictional label says one agreement reveals every resident’s feelings. What should be checked?','The participants, terms and surrounding pressure.','A formal action cannot reveal everyone’s private views.'],
['Which local leader is named in the Cebu agreement?','Rajah Tupas.','The marker identifies a particular participant.'],
['Do records of conflict and a later agreement necessarily contradict each other?','No; they may concern different stages of the encounter.','Time and setting help explain changing actions.'],
['What does a treaty or agreement record help investigate?','A formal relationship among named participants.','It does not automatically represent every community.'],
['Why include force when explaining an agreement?','Pressure can affect the circumstances in which people respond.','A favorable label does not remove the surrounding conflict.']
],[['One agreement proves everyone’s freely chosen consent.','Participants and pressure need examination.'],['There was no local opposition.','Force and opposition are part of the Cebu account.'],['One leader’s action reveals every private motive.','An action does not establish everyone’s thoughts.'],['Every community made the same agreement.','A named agreement cannot stand for the entire archipelago.']]),
t('legazpi-cebu-settlement','A base in an existing community','A maintained Spanish base differs from a visit, but one settlement does not prove effective control everywhere.',[
'A settlement is a continuing base where people live. The Spanish base in Cebu in 1565 needed supplies, organization and relationships with nearby people.',
'Cebu already had leadership and trade. Try a fictional evidence table: arrival shows a visit; records of a maintained base show continuing presence there. Investigating control elsewhere needs evidence of institutions, enforcement and local responses.'
],[
['What distinguishes a settlement from a brief visit?','A continuing base to live and operate.','Maintaining a base requires ongoing resources and organization.'],
['In a fictional table, records describe a base maintained over time. What do they support?','Continuing presence at that place.','They do not establish control of every island.'],
['Did the Spanish settlement begin all of Cebu’s history?','No; communities, trade and leadership existed earlier.','The colonial development occurred within an existing society.'],
['A base record is used to claim control far away. What evidence is still needed?','How authority operated and how people responded in those places.','Local presence cannot establish distant enforcement.'],
['What did maintaining a base require?','Supplies, organization and relationships.','A continuing presence depends on more than arrival.'],
['Which wording distinguishes the new base from the earlier place?','A Spanish settlement was established in an already inhabited Cebu.','The wording identifies the colonial development without erasing earlier history.']
],[['Cebu and its people began in 1565.','Cebu’s communities existed before the Spanish base.'],['One settlement proved immediate control everywhere.','The reach of authority needs place-specific evidence.'],['The settlement was only a sighting from a ship.','A maintained base differs from seeing or briefly visiting land.'],['A base required no ongoing supplies.','Maintaining people and institutions required resources.']]),
t('legazpi-return-connection','Why the return connection mattered','San Pedro returned from Cebu to Mexico in 1565. Salcedo captained, Urdaneta contributed navigation knowledge and the crew carried out the voyage.',[
'A return connection could carry news, people and supplies across the Pacific. In 1565, San Pedro sailed from Cebu to Mexico. Felipe de Salcedo captained the ship; Urdaneta contributed navigation knowledge, with other navigators and crew.',
'Winds and currents shaped the route. Tornaviaje means the return voyage here. The teaching sequence is not sailing instructions or a claim about priority over every other crossing. A workable return helped connections but guaranteed neither safety nor universal authority.'
],[
['Why did a workable return connection matter?','It helped communication and movement of people and supplies.','Continuing presence depended on continuing connections.'],
['A fictional team display credits one person for the entire return. What should it include?','Salcedo’s command, Urdaneta’s knowledge and crew work.','Different contributions were needed for the voyage.'],
['Which ship made the return voyage described here?','San Pedro.','The lesson identifies its 1565 Cebu-to-Mexico return.'],
['Does a working route guarantee every later voyage is safe?','No; later conditions and journeys still need examination.','A connection does not remove all travel risks.'],
['What does tornaviaje mean in this lesson?','The return voyage.','The term identifies the return connection rather than universal political control.'],
['What can the teaching sequence support without settling priority disputes?','The roles and return connection described in this case.','This lesson does not establish who first completed every kind of Pacific crossing.']
],[['Urdaneta sailed alone without a captain or crew.','Salcedo, navigators and crew had different contributions.'],['A return route guaranteed control of every island.','Navigation cannot establish universal political authority.'],['Every later crossing was automatically safe.','A working route does not remove all voyage risks.'],['The diagram supplies precise sailing instructions.','It is a teaching sequence rather than a navigation guide.']])]},
{id:'chapter6-mission2',quiz:'chapter6-quiz2',question:'What changed in Cebu and Manila, and what already existed?',objectives:['Compare the 1565 and 1571 colonial developments.','Recognize earlier communities, trade and differing local responses.','Separate an institution’s creation from evidence of its reach.'],topics:[
t('cebu-manila-chronology','Compare two dated developments','Cebu’s Spanish settlement in 1565 preceded Manila’s Spanish city in 1571. Both places had earlier histories.',[
'Compare the same questions for two places. A Spanish settlement was established in Cebu in 1565 and a Spanish city in Manila in 1571. These dates describe colonial developments, not the beginning of local people or history.',
'Try a fictional two-column display: write the place, dated development, earlier community and local response. The selected comparison shows order; it does not prove every island between them was controlled.'
],[
['Which colonial development came earlier?','Cebu’s Spanish settlement in 1565.','1565 comes before Manila’s 1571 development.'],
['What should a fictional two-column comparison record for both places?','The dated development and evidence about the earlier community.','Using shared questions makes the comparison meaningful.'],
['Which year belongs to Manila’s Spanish city?','1571.','Keep the colonial date attached to the particular place.'],
['A report calls the dates the start of all local history. What should change?','Identify them as colonial developments within earlier societies.','The dates do not erase what preceded them.'],
['Which selected order fits the lesson?','Cebu 1565, then Manila 1571.','Compare the dates rather than assuming both events happened together.'],
['What cannot be inferred from the two dates alone?','That every place between the settlements came under control.','Chronology does not establish geographic reach.']
],[['Both places began with no earlier people or history.','Earlier communities existed in both settings.'],['Manila’s 1571 development preceded Cebu’s in 1565.','The date order is Cebu before Manila.'],['The dates identify every event in each place.','Only selected colonial developments are dated here.'],['Two settlements prove authority over all islands.','Political reach needs evidence beyond the two dates.']]),
t('settlements-existing-communities','Who was already there?','Cebu and Maynila had people, trade and political leadership before the Spanish institutions.',[
'A polity is a community organized under political authority. Cebu already had trade and local leaders; Rajah Tupas appears in the 1565 agreement. Maynila was associated with Rajah Sulayman, also written Soliman.',
'The later Spanish city occupied the site of an earlier polity. Try a fictional museum caption: replace “outsiders created all leadership” with an account distinguishing an existing society from new colonial institutions. One named leader still cannot reveal every resident’s viewpoint.'
],[
['Which description recognizes what existed earlier?','Communities with trade and political leadership.','The colonial institutions did not create all local society.'],
['A fictional caption says outsiders created every local leader. What corrects it?','Evidence of earlier Cebu and Maynila leadership.','Named local participants challenge the empty-place claim.'],
['What is a polity?','A community organized under political authority.','The term identifies political organization before the later city.'],
['Does naming Sulayman establish every resident’s view?','No; a leader’s identity is not everyone’s opinion.','Other participants and perspectives still need investigation.'],
['Which leader is associated with Maynila in this lesson?','Rajah Sulayman, also written Soliman.','The name concerns an earlier polity rather than a newly created Spanish office.'],
['Why distinguish the earlier polity from the later city?','To explain change without erasing earlier society.','Founding language should identify which institution was established.']
],[['The places were empty until Spanish officials arrived.','Existing communities already lived and traded there.'],['A city date creates every earlier local leader.','Local leadership preceded the colonial city.'],['One name explains every resident’s feelings.','An individual cannot stand for every viewpoint.'],['Every local institution and colonial office was identical.','Earlier societies and new colonial institutions need distinguishing.']]),
t('settlements-trade-connections','A port needs people too','Location mattered alongside merchants, supplies, knowledge and local relationships. A port alone guaranteed neither profit nor consent.',[
'A port connects ships with people and goods on shore. Cebu had exchange networks before the Spanish base. Manila’s location and Asian trading connections mattered to Spanish plans.',
'Regional merchants helped make these connections work. Follow the port teaching model: sea link, landing area and community. People carry, store and exchange goods. The model does not reconstruct exact buildings or guarantee profitable trade.'
],[
['What helps explain trade beyond a useful landing place?','Merchants, supplies, knowledge and relationships.','People and resources make exchange possible.'],
['In a fictional port model, goods reach the shore. What activity connects them with the community?','People carry, store and exchange the goods.','Location does not perform these tasks by itself.'],
['What is a port?','A place connecting ships with shore-based people and goods.','The term links water travel with activities on land.'],
['A report says a promising location guarantees profit. What is missing?','Evidence about costs, exchange and actual results.','An opportunity is not a guaranteed financial outcome.'],
['Did Cebu’s trade begin with the Spanish base?','No; exchange connections existed earlier.','The base entered existing relationships.'],
['What limit should accompany the port teaching model?','It explains connections without reconstructing every building or route.','A model illustrates relationships rather than all historical details.']
],[['Location alone does all the trading.','People’s work and relationships are necessary.'],['A port guarantees profit on every exchange.','Actual outcomes require evidence.'],['Existing merchants played no part.','Regional merchants were active participants.'],['The model gives each port’s exact historical buildings.','It is a simplified model rather than a reconstruction.']]),
t('settlements-local-responses','Name the response and its setting','The Cebu agreement and Bangkusay resistance concern particular participants and settings, not one identical response by everyone.',[
'Local responses could include negotiation, pressure and resistance. The Cebu agreement involving Tupas belongs alongside conflict. The NHCP Bangkusay marker records resistance around Manila Bay in 1571 led by a leader from Macabebe.',
'Do not identify that leader as Sulayman without evidence. Try a fictional report check: one agreement does not prove universal welcome, and one battle does not show everyone resisted identically. Name the participants, time, action and limits.'
],[
['How should a comparison describe the agreement and resistance?','Identify each action’s participants and setting.','Different records concern particular responses.'],
['A fictional caption gives the Macabebe leader a familiar name without evidence. What should change?','Use only the identity supported by the source.','A familiar name cannot substitute for identification.'],
['Which place is associated with the leader in the Bangkusay marker?','Macabebe.','The lesson preserves the place-based identification.'],
['Does one agreement prove every community welcomed rule?','No; other responses require their own evidence.','A recorded action cannot establish universal consent.'],
['Which year belongs to the Bangkusay resistance example?','1571.','Keep this example separate from the 1565 Cebu agreement.'],
['How can conflict and negotiation both appear in one history?','Responses may differ across participants and stages.','Historical choices need not fit one permanent response for everyone.']
],[['Every local person welcomed every colonial demand.','The resistance example challenges that universal claim.'],['One battle proves every community reacted identically.','Specific resistance does not establish everyone’s actions.'],['A familiar leader’s name can replace missing identification.','Identity requires evidence.'],['An agreement reveals every participant’s private thoughts.','An action cannot disclose every motive.']]),
t('settlements-institutions-and-reach','An office is not proof of obedience','A governing institution has continuing duties. Its actual reach needs evidence of enforcement, resources and local responses.',[
'Manila became a colonial governing center. Legazpi established a city council there in 1571. A council is a group with governing responsibilities; an institution is an organized body with continuing duties.',
'Try a fictional council record: an order was issued. Ask where it was carried out, who supplied resources and how communities responded. Issuing an order and enforcing it everywhere are different claims.'
],[
['What should be investigated after an order is issued?','Where it was carried out and how communities responded.','An order alone does not establish its practical effect.'],
['A fictional council record contains a new order. What does it directly show?','The council issued that order.','Implementation needs additional evidence.'],
['What is an institution?','An organized body with continuing duties.','Continuing responsibilities distinguish it from a brief visit.'],
['A council exists in one city. What wider claim needs evidence?','That its decisions were followed in every island.','The institution’s location does not establish universal reach.'],
['What does a city council do in this lesson?','Carries responsibilities for governing a town or city.','The example concerns a governing institution.'],
['Why examine resources when studying an order’s reach?','Carrying out decisions requires people and supplies.','Authority on paper and practical capacity are different.']
],[['Writing an order proves it was followed everywhere.','Implementation and responses need checking.'],['A council is only a passing ship.','It is a body with continuing responsibilities.'],['One institution reveals everyone’s feelings.','Private viewpoints need separate evidence.'],['Resources and local responses never affect reach.','Both can shape what authorities can actually do.']])]},
{id:'chapter6-mission3',quiz:'chapter6-quiz3',question:'How did colonial authority expand, and why did its reach vary?',objectives:['Connect bases with messages, supplies and relationships.','Distinguish coercion from agreement and compare changing local responses.','Use named examples without claiming universal control.'],topics:[
t('expansion-bases-and-links','What connected the bases?','Acting beyond a base required messages, supplies, people and relationships.',[
'An order from a base still had to reach people. Messages, supplies, regional merchants and local relationships helped connect places. These could support a continuing Spanish presence without making every community accept it.',
'Follow each arrow in the teaching diagram: whose work carries the message or supplies? This is a model of connections, not an exact route map or proof of successful authority everywhere.'
],[
['What was needed to act beyond a base?','Messages, supplies and relationships.','An order alone cannot perform all the work of connecting places.'],
['A fictional diagram joins two places with an arrow. What question makes the arrow meaningful?','Who carried what between the places?','The connection depends on actions and people.'],
['Which participants could help regional connections?','Merchants and local communities.','People already connected with trade were active participants.'],
['Does a connection between bases prove all communities agreed?','No; local responses require evidence.','A working link does not establish universal acceptance.'],
['What does a base provide?','A place from which activities can be organized.','It is a starting point, not proof of success everywhere.'],
['Why should a report explain an arrow rather than simply draw it?','The action and resources behind the connection matter.','A symbol needs an evidence-based explanation.']
],[['An order travels and enforces itself.','People and resources carry out decisions.'],['A base proves immediate success everywhere.','Reach requires evidence beyond the base.'],['Existing merchants had no role in connections.','Regional relationships could support movement and exchange.'],['The teaching arrows give exact routes and distances.','The diagram is a thinking model.']]),
t('expansion-pressure-and-force','Request or coercion?','A threat or use of force can change the circumstances of a response; an official’s favorable label is not enough.',[
'Coercion means trying to make someone obey through threats or force. Colonial expansion could involve pressure alongside agreements. Examine the actions rather than accepting an official’s label of “peaceful.”',
'Try fictional cards: one requests supplies; another threatens punishment for refusal. The added threat matters. A reply under pressure does not automatically show everyone freely welcomed outside rule. Explaining coercion does not justify harm.'
],[
['What does a threat to punish refusal illustrate?','Coercion.','The threat adds pressure to the request.'],
['What changes between the fictional request card and threat card?','The consequences attached to refusing.','A request under threat is not the same circumstance as an unpressured discussion.'],
['What is coercion?','Trying to make people obey through threats or force.','The term identifies pressure used to pursue compliance.'],
['An official calls a threatened agreement peaceful. What should be checked?','The actions and pressure surrounding the response.','A favorable label cannot settle the conditions of agreement.'],
['Does explaining coercion mean approving it?','No; explanation can recognize harm.','Understanding an action does not justify it.'],
['What would support a claim of freely chosen agreement?','Evidence about the participants’ choices and surrounding conditions.','A response alone does not establish freedom from pressure.']
],[['A threat has no effect on the circumstances of agreement.','Pressure changes what must be investigated.'],['A favorable official label proves everyone freely agreed.','Actions and local responses need checking.'],['Explaining force means praising harm.','Historical explanation can identify harm without approval.'],['Every request was identical to every threat.','Distinguish the actual actions and conditions.']]),
t('expansion-local-choices','Responses could change','Negotiation, adaptation and resistance describe actions in a setting, not permanent labels for whole peoples.',[
'Negotiation means discussing terms. Adaptation means changing some practices in response to circumstances. Resistance means opposing a demand or imposed authority.',
'Try fictional records: a community discusses supplies, then refuses a later demand. Ask who acted, when and toward which demand. These actions need not contradict each other, and neither reveals every resident’s thoughts.'
],[
['How should changing local actions be explained?','Identify who acted, when and toward which demand.','A response belongs to a particular setting.'],
['Do the fictional supply discussion and later refusal necessarily contradict each other?','No; they can concern different demands or circumstances.','People can respond differently as conditions change.'],
['What does negotiation mean?','Discussing terms.','It is an action rather than proof of approval of every policy.'],
['A report calls one community permanently obedient after one agreement. What should change?','Examine later actions instead of assigning a permanent label.','One response does not determine every later choice.'],
['What does resistance mean here?','Opposing a demand or imposed authority.','The term should stay attached to an action and setting.'],
['Why distinguish adaptation from complete approval?','Changing a practice does not establish consent to every part of rule.','A particular adjustment cannot establish a universal political preference.']
],[['One action permanently defines every member of a people.','Responses vary across individuals and time.'],['Discussing terms proves approval of every colonial policy.','A discussion concerns particular terms and participants.'],['Adaptation proves there was never resistance.','Responses can differ across issues and periods.'],['Different actions always mean the records are false.','Different circumstances can explain different actions.']]),
t('expansion-uneven-reach','A claim can exceed its reach','Issuing an order is different from enforcing it. Terrain, supplies, local organization and resistance all mattered.',[
'Effective control means decisions are actually carried out. A colored area on a modern teaching map does not prove that happened everywhere.',
'Travel and supplies mattered, along with local knowledge, organization, alliances and resistance. Try a fictional order record with no evidence of delivery: report that the order was issued, but keep its effect uncertain. Continued local leadership does not make a community less worthy.'
],[
['An order exists but no delivery or enforcement record is supplied. What can be said?','The order was issued; its effect there still needs evidence.','A decision on paper does not prove implementation.'],
['A fictional map colors a wide area. What should a learner investigate?','Where authority operated and how people responded.','The color cannot answer questions about actual reach.'],
['What does effective control concern?','Whether decisions are actually carried out.','A claim of authority and its operation need distinguishing.'],
['A report says mountains alone determined history. What is missing?','Local organization, knowledge, alliances and responses.','Physical conditions do not erase human actions.'],
['Does maintaining local leadership make a community less worthy?','No.','Political relationships do not determine human worth.'],
['Why attach a time and place to a control claim?','Reach could expand, weaken or be contested.','A claim cannot be assumed constant across all settings.']
],[['A written order proves universal obedience.','Delivery, enforcement and responses require evidence.'],['Map color measures every person’s agreement.','A teaching map cannot establish private consent.'],['Terrain alone determines all historical choices.','People’s organization and actions also matter.'],['Local autonomy shows people were less worthy.','Authority relationships do not rank people’s worth.']]),
t('expansion-autonomy-evidence','Compare named examples carefully','Ifugao resistance and later Sulu diplomacy question universal-control claims in different settings and periods.',[
'National Museum research material describes Ifugao resistance to Spanish conquest. It concerns a named setting, not one identical history for every highland community.',
'NCCA’s history discusses Sulu diplomacy and conflict, including a 1726 treaty with Spanish officials. This is later than Legazpi’s 1565 expedition. Compare the examples without assuming timeless, uniform groups or identical understandings of an agreement. Chapter 11 explores these histories further.'
],[
['How should Ifugao resistance and Sulu diplomacy be compared?','Keep their different settings and periods clear.','Both challenge universal-control claims without being the same event.'],
['A fictional timeline puts the 1726 treaty in Legazpi’s 1565 expedition. What should change?','Place the treaty in its later period.','The events are separated by more than a century.'],
['Which named example concerns resistance in this lesson?','Ifugao resistance to Spanish conquest.','It supplies a particular case rather than a universal highland history.'],
['Does a treaty record prove both parties understood every term identically?','No; interpretations and context need examination.','Agreement records still have limits.'],
['Which year belongs to the Sulu treaty example?','1726.','Keep the later example distinct from the 1565 expedition.'],
['Why avoid calling either group timeless and uniform?','People and relationships changed across settings and periods.','A named example cannot establish one unchanged experience for everyone.']
],[['The Sulu treaty happened during Legazpi’s 1565 expedition.','The treaty example is from 1726.'],['Every highland community had exactly Ifugao’s history.','A named case cannot represent all highland histories.'],['Diplomacy proves conflict never occurred.','Discussion and conflict can both appear across time.'],['One treaty reveals identical private views for everyone.','Participants, interpretations and context need examination.']])]},
{id:'chapter6-mission4',quiz:'chapter6-quiz4',question:'How can we distinguish colonization’s motives, methods and effects?',objectives:['Distinguish continuing outside authority from contact alone.','Classify motives, methods and consequences using concrete cases.','Check claims against evidence and local responses.'],topics:[
t('colonization-meaning','Contact or continuing rule?','Colonization involves establishing and maintaining outside authority over a place and its people, beyond a visit or exchange.',[
'An expedition is a journey; a settlement is a continuing base. Colonization involves outside authority over a place and its people. Cebu and Manila were existing societies before colonial institutions developed.',
'Try fictional cards: a passing ship and outside officials establishing continuing governing duties. The second concerns authority. Further evidence is still needed to establish where that authority actually operated.'
],[
['Which feature distinguishes colonial rule from a brief visit?','Continuing outside authority over people and place.','Contact alone does not establish rule.'],
['Which fictional card concerns governing rather than passing contact?','Outside officials establishing continuing governing duties.','The action concerns authority and institutions.'],
['What is an expedition?','A journey with a purpose.','A journey is not itself a complete system of continuing rule.'],
['Does a new place name alone establish effective colonial rule?','No; institutions, actions and responses need investigation.','Naming and governing are different kinds of evidence.'],
['Did colonization happen only in empty places?','No; existing communities already had leaders and histories.','The explanation must include people already present.'],
['Why is a definition not enough to prove control everywhere?','Actual reach still requires place-specific evidence.','Classification and historical proof answer different questions.']
],[['Every exchange is automatically colonization.','Exchange does not by itself establish outside authority.'],['A ship’s arrival proves lasting rule everywhere.','Arrival alone is evidence of a visit.'],['Colonial institutions created all earlier local history.','Existing societies preceded them.'],['A definition replaces evidence of actual events.','Evidence must show what happened in the setting.']]),
t('colonization-motives','What did sponsors want?','Economic, political and religious aims were motives; they do not prove results or justify domination.',[
'Spanish imperial aims could involve trade, political influence and spreading Catholic Christianity. Different participants could have different priorities. Geopolitical means connected with power and relationships between places.',
'Try a fictional sponsor card: “We want access to trade.” Classify an economic aim. Do not turn it into proof of profit, consent or a justification for domination. Studying a religious aim does not require practising the religion.'
],[
['Which category fits seeking trade access?','An economic motive.','It identifies a desired trading benefit.'],
['What does the fictional sponsor’s trade wish establish?','The aim stated on that card.','Actual results require separate evidence.'],
['What is a motive?','A reason for acting.','It explains an aim rather than a completed outcome.'],
['A religious aim is recorded. What claim needs different evidence?','That every community adopted that religion.','Intentions do not establish everyone’s beliefs.'],
['What does geopolitical concern?','Power and relationships between places.','The term helps classify political interests.'],
['Why avoid assigning identical aims to every participant?','People could have different priorities within one undertaking.','A sponsor’s stated aim is not everyone’s private motive.']
],[['A desired profit proves profit was achieved.','Actual income and costs require evidence.'],['A religious aim proves universal conversion.','Aims do not establish everyone’s beliefs.'],['Every participant had identical priorities.','Different roles could involve different interests.'],['A motive automatically justifies domination.','Explaining a reason does not make the action acceptable.']]),
t('colonization-methods','Aim, method or effect?','Methods are actions used to pursue aims: force, agreements, offices and religious institutions. Their operation varied.',[
'A method is a way of pursuing an aim. Colonial methods could include force, agreements, governing offices and religious institutions. DepEd’s learning resource also identifies tribute, encomienda and compulsory labor for investigation in later lessons.',
'Tribute is a required payment to authority. Try a fictional sort: wanting influence is an aim, creating an office is a method, and what happens to families is an effect. A required payment is not automatically a freely chosen gift. Exact obligations need evidence for the place and period.'
],[
['Which example is a method rather than an aim?','Creating an office that issues governing decisions.','The office is an arrangement used to pursue authority.'],
['In a fictional sort, where does “wanting influence” belong?','Aim.','It describes the desired result rather than the action used.'],
['What is tribute in this lesson?','A required payment to an authority.','The requirement distinguishes it from assuming a voluntary gift.'],
['A source names tribute but gives no amount. What should a report avoid?','Inventing one amount for every community.','Specific obligations require setting-specific evidence.'],
['What does a method describe?','A way of trying to achieve an aim.','Methods and intended results need separating.'],
['Why examine an agreement’s circumstances?','Pressure and force may affect how it was reached.','An official’s favorable label does not settle the conditions.']
],[['Wanting influence is itself evidence of an achieved outcome.','A wish and a result are different.'],['Every required payment was freely chosen.','An obligation is not automatically a voluntary gift.'],['Naming a method proves identical operation everywhere.','Methods varied across settings and periods.'],['A favorable title makes surrounding pressure irrelevant.','Actions and circumstances still need examination.']]),
t('colonization-effects-and-responses','What changed, and for whom?','Effects concern consequences for particular people. Intended benefits do not establish everyone’s actual experience.',[
'An effect is a consequence. It may differ from what a sponsor intended. A required payment could affect household resources; the actual demand, collection and family circumstances need checking.',
'Try a fictional record: goods were collected and the household had fewer afterward. This supports a particular consequence, not identical burdens or thoughts for all families. Compare official revenue concerns with affected people’s obligations and responses.'
],[
['What is an effect?','A consequence of an action or arrangement.','It concerns what changed rather than only what was intended.'],
['What can the fictional household record support?','That goods collected left that household with fewer goods.','The conclusion stays within the example.'],
['What should a report ask about a required payment?','How collection affected the people involved.','Consequences require evidence about affected people.'],
['A record concerns one family. What claim goes beyond it?','That every household had exactly the same experience.','One case does not establish universal consequences.'],
['Can an intended outcome differ from the actual effect?','Yes.','Plans do not determine all consequences.'],
['Why compare an official’s account with local responses?','They may illuminate different consequences and interests.','The official perspective is not the whole experience.']
],[['Every family experienced exactly the same burden.','Household circumstances and collection need examination.'],['An official’s desired benefit proves everyone benefited.','Intention is different from actual consequences.'],['One collection record reveals all private thoughts.','A material consequence cannot disclose everyone’s feelings.'],['Local responses are irrelevant to effects.','Negotiation, adaptation and resistance are part of the account.']]),
t('colonization-source-check','Check the report’s leap','An institution’s creation does not establish universal enforcement, consent or happiness. Separate the source’s claim from what it proves.',[
'A source may emphasize aims, methods or effects from one viewpoint. Compare its claims with actions and local responses rather than treating an official report as everyone’s story.',
'Try a fictional caption: “An office was created, so every island happily obeyed.” The first claim concerns an institution. The second adds reach and feelings that need separate evidence. Revise the caption; do not invent speech to support it. Explaining power must not rank people’s worth.'
],[
['What is missing from the fictional caption about happy obedience everywhere?','Evidence of reach and people’s responses.','Creating an office does not establish universal enforcement or feelings.'],
['Which part of the fictional caption concerns an institution?','An office was created.','That claim is different from what every person did or felt.'],
['What should be identified when reading a source?','Its maker, viewpoint and supported claims.','Source identity helps establish its scope.'],
['An official report claims peace. How should a learner investigate it?','Compare the claim with actions, pressure and local responses.','A favorable claim is not self-proving.'],
['Does questioning a source’s limits make it useless?','No; it can still support particular claims.','A source can be useful without answering everything.'],
['How should the final explanation connect aims, methods and effects?','Name each separately and link it to evidence in a setting.','Keeping categories distinct prevents a wish from becoming an invented result.']
],[['An office proves everyone happily obeyed.','Reach and private feelings require further evidence.'],['An official account contains every viewpoint.','Other experiences and responses may be missing.'],['Invented dialogue can prove a historical claim.','Fictional wording must not be treated as recorded evidence.'],['Power determines whose human worth is higher.','Historical authority does not rank people’s dignity.']])]}];
module.exports={missions};
