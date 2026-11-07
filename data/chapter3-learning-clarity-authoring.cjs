// Reviewed companion authoring source; not shipped as a public question-bank file.
// Each topic has six independently worded situations; named misconceptions recur deliberately.
const t=(id,title,point,paragraphs,items,wrong)=>({id,title,point,paragraphs,items,wrong});
const missions=[
 {id:'chapter3-mission2',quiz:'chapter3-quiz2',question:'How can goods connect places without revealing every step of a journey?',objectives:['Explain exchange through a network of people and places.','Use production, find context and dates to compare ceramic evidence.','Explain needs and connections without assuming identical choices.'],topics:[
 t('trade-networks','Follow connections between places','A trade network links people and places. A product may pass through several exchanges.',[
  'A network is a set of connected people or places. A product can pass from a maker through other traders before reaching its final user.',
  'Follow the fictional network diagram: production place, possible exchange stop, and later use or find place. The stop illustrates indirect exchange; it is not a documented port for one actual bowl.',
  'Keep the questions separate. Where was the object made? Where was it found? Which steps between them still need evidence?'
 ],[
  ['A model shows a pot moving from a maker through an exchange stop to a user. What does it illustrate?','Goods can pass through more than one exchange.','The model illustrates a network with an intermediate exchange, not only a maker-to-user trip.'],
  ['A trader receives a product and later exchanges it with someone else. How does this connect people?','The trader can form one link in a wider network.','An exchange can connect with other exchanges rather than stand alone.'],
  ['What is a trade network in this lesson?','Connected people and places through which goods can move.','The word network describes connected relationships and places.'],
  ['A product has a known production place and a distant find place, but its stops are unknown. Which report fits?','The places suggest connections, while the intermediate steps need investigation.','Known endpoints do not establish every exchange along the way.'],
  ['Why does the teaching diagram include a possible exchange stop?','To show how a product could move indirectly.','The extra stop helps explain indirect exchange rather than document an actual voyage.'],
  ['Two traders exchange the same object at different times. What question helps explain the network?','How each exchange connects people and places.','Following the relationships helps explain the network without assuming one direct delivery.']
 ],[
  ['Every object went straight from its maker to its final user.','Goods can pass through intermediate exchanges.'],['The fictional stop identifies an excavated ancient port.','A stop invented for a teaching model is not an archaeological find.'],['An object\'s production place identifies every person who handled it.','Production origin does not provide a complete list of traders or users.'],['One object records every voyage in the network.','One object does not supply a complete record of journeys.']]),
 t('asian-tradeware','Read a ceramic evidence card','A ceramic production tradition and a find location are different information. Compare the recorded contexts.',[
  'Tradeware is pottery or other ceramic ware investigated in connection with exchange. Changsha stoneware names a production tradition associated with China, not a Philippine find site.',
  'The National Museum discusses ceramic evidence from different places. Similar ceramic types can help researchers ask about connections, but the objects still have separate recorded settings and dates.',
  'Compare the evidence cards one at a time. A similarity does not prove that two objects belonged to the same owner, shipment or journey.'
 ],[
  ['One card names Changsha stoneware and another field names a find site. What should a learner distinguish?','The production tradition from the place of discovery.','A ceramic type and a find location answer different questions.'],
  ['Two ceramic objects look alike but were recorded at different sites. What is the useful next step?','Compare their dates, features and separate contexts.','Similarities are worth studying alongside differences in recorded setting.'],
  ['What does a find location tell us about a ceramic object?','Where the object was recorded as found.','A find location concerns discovery context rather than automatically identifying the maker.'],
  ['A museum compares related ceramic types from two contexts. What additional claim needs its own evidence?','That one particular ship connected both objects.','Related types do not by themselves establish a single shared shipment or voyage.'],
  ['Why keep the site information on an object\'s evidence card?','Its recorded setting helps researchers interpret the find.','Context connects the object with information from where it was found.'],
  ['A researcher compares a production tradition with records from two find sites. What makes the report stronger?','Keeping the separate dates and contexts visible in the comparison.','A comparison is stronger when it does not erase the differences between records.']
 ],[
  ['Similar objects must have arrived on the same ship.','Similarity alone does not establish a shared voyage.'],['The name of a ceramic tradition is always its Philippine find site.','Production tradition and find location must be distinguished.'],['Similar appearance makes recorded context unnecessary.','The setting still supplies information that appearance cannot replace.'],['Every object of one type had the same owner and date.','Objects of a related type can have different histories.']]),
 t('trade-needs','Why exchange could be useful','Different resources, skills and needs could make exchange useful. The same product could be valued for different reasons.',[
  'People use resources and skills to meet needs. In a fictional example, one community has fish while another has farm products. Exchange can help them obtain something they need.',
  'A useful object can also be valued for different reasons. Look for evidence of its particular use instead of assuming all users wanted exactly the same thing.',
  'Explain the supplies and needs in the example. Do not turn this model into a claim that every community used identical exchange terms.'
 ],[
  ['One model community has fish and needs rice; another has rice and needs fish. Why might they exchange?','Their different products could help meet each other\'s needs.','Different resources can make an exchange useful to both sides in this example.'],
  ['Two people value similar containers for different purposes. What should an explanation include?','The use and need described for each person.','Similar objects do not require identical purposes.'],
  ['What is a resource in this lesson?','Something people can use to meet a need.','The idea connects what is available with what people can do or obtain.'],
  ['A record shows an imported product beside local products. What should researchers investigate?','How the products were used and valued in that setting.','The presence of imported goods is a starting point for questions about needs and uses.'],
  ['A community has a craft skill another community wants to use. Why could exchange be useful?','Different skills can provide products others need or value.','Exchange can involve the results of skilled work as well as different natural resources.'],
  ['A report says everyone wanted a traded jar for one identical reason. What evidence is needed?','Evidence about the uses and needs of the particular people discussed.','A shared kind of object does not establish identical reasons for valuing it.']
 ],[
  ['Every community had identical resources and needs.','The lesson uses differences in resources and needs to explain exchange.'],['All people wanted a product for exactly the same reason.','Uses and reasons can differ between people and settings.'],['Having imported goods proves that local work stopped.','Imported and locally made goods can both be useful.'],['A product\'s appearance supplies every exchange agreement.','Terms of an exchange require their own evidence.']]),
 t('trade-route-evidence','Compare sources for a route','A historical route map is an explanation based on evidence, not a photograph of every voyage.',[
  'A route map can connect places using evidence. It is a modern explanation unless it is identified as an original source. A line is not a photograph of a ship journey.',
  'Compare an object record with a written account. Ask when and where each source was made, what it describes and whether its claim fits the other evidence.',
  'If details differ, explain the difference. Do not report agreement simply by combining incompatible statements.'
 ],[
  ['A route map draws a line between two places. What should explain that line?','The evidence and reasoning used to suggest the connection.','A route line should be supported, not treated as a complete voyage record.'],
  ['An object record and a written account give different details. What should researchers do?','Compare their contexts and explain what is still uncertain.','Differences need investigating rather than silently changing either source.'],
  ['What is a modern historical route map?','An explanation of possible or supported connections.','The map represents an interpretation whose evidence can be examined.'],
  ['One source names a place but does not identify every stop. Which route claim is careful?','Show the supported place and distinguish the unknown steps.','A partial record can support a limited claim without establishing a complete itinerary.'],
  ['Why note a source\'s date when studying a trade route?','It helps us ask which period the source can address.','Sources from different times need not describe the same situation.'],
  ['A writer combines two conflicting details and calls them agreement. What correction is needed?','Keep the difference visible and investigate it.','Combining claims does not make them consistent.']
 ],[
  ['A map line proves that every ship followed that exact path.','A route explanation does not document every voyage.'],['A source with a named author is automatically correct in every detail.','Named authors still have particular perspectives and limits.'],['An object alone answers every question about the route.','Different questions can require other evidence.'],['Two different statements agree once they are copied into one report.','A report must explain differences rather than erase them.']]),
 t('trade-connections','Connect goods with people\'s choices','Exchange could connect goods, people and ideas while local work and different choices continued.',[
  'Goods moving between places can create opportunities for contact. People may also share or adapt ideas through their relationships.',
  'An imported product is not proof that all local production stopped or everyone accepted one practice. Look for evidence about the people and setting.',
  'Build a report with an object, its context and the limited connection it supports. Carry this question forward: how do a product and the skills used to make it differ?'
 ],[
  ['Imported ceramics appear beside locally made objects. Which explanation fits?','Exchange and local production could both be part of community life.','The evidence does not require local work to disappear when imported products arrive.'],
  ['A community adapts an idea encountered through exchange. What should a report recognise?','Contact and local choices can both matter.','Adaptation connects an encountered idea with decisions in a particular community.'],
  ['What can contact through exchange make possible?','Opportunities to share goods and ideas.','Contact can create opportunities without proving an identical response by everyone.'],
  ['A bowl is evidence of contact, but beliefs are not recorded. What should a learner distinguish?','The material connection from claims about everyone\'s beliefs.','An object\'s presence does not establish every user\'s ideas or beliefs.'],
  ['Why include local makers in an exchange story?','Local work can continue alongside wider connections.','A story about imported products alone can miss the work done within communities.'],
  ['A report lists imported goods but says nothing about people or context. What would strengthen it?','Explain the supported connections, uses and choices in their setting.','A list becomes an explanation when evidence is connected to people and circumstances.']
 ],[
  ['Trade meant every community stopped making local products.','Local production and exchange can coexist.'],['An imported object records every user\'s belief.','Material evidence does not automatically establish individual beliefs.'],['Every community accepted every encountered idea unchanged.','People can choose, adapt or respond differently.'],['A fictional teaching case is a documented ancient event.','A model illustrates an idea; historical claims need their own sources.']])
 ]},
 {id:'chapter3-mission3',quiz:'chapter3-quiz3',question:'How do products, techniques and local choices differ?',objectives:['Distinguish an object from the knowledge used to make it.','Explain adaptation using materials, purpose and learned skill.','Use context and comparison before making claims about cultural exchange.'],topics:[
 t('goods-and-needs','Connect an object with its use','Goods are objects people make, use or exchange. Their uses need evidence from particular settings.',[
  'A pot, cloth or basket can be a useful or valued good. An object can have more than one purpose, and similar objects can be used differently.',
  'In our fictional comparison, two jars look alike but have different find settings. Examine each context before deciding how it was used.',
  'An object\'s shape is a clue. It is not a complete record of every owner, purpose or meaning.'
 ],[
  ['Two similar jars have different recorded settings. What should researchers compare?','The context and possible use of each jar.','The settings can help investigate whether their uses were alike or different.'],
  ['A container is valued for storage in a teaching case. What supports that explanation?','The stated use and clues in that case.','A purpose needs support from the particular example, not just a familiar shape.'],
  ['What are goods in this lesson?','Objects people make, use or exchange.','The term describes things such as the containers and cloth in the lesson.'],
  ['Two objects have a similar shape but no use records. Which report is careful?','Compare the objects and seek contextual evidence before assigning one use.','Similarity can prompt investigation without supplying a complete use history.'],
  ['Why examine nearby objects when studying a container?','Their recorded relationships may help interpret its setting.','Context can provide information beyond the container\'s appearance.'],
  ['A report gives every similar jar the same meaning. What should improve it?','Evidence about uses and meanings in the separate settings.','Meaning must not be assigned solely from resemblance.']
 ],[
  ['Objects with similar shapes always had the same use.','Similar forms can have different uses in different settings.'],['The shape identifies every owner.','Shape is not a complete record of ownership.'],['Imported goods were valued while local goods could never be useful.','Both local and imported objects could meet needs or be valued.'],['A fictional use proves the use of every actual find.','Teaching examples do not replace evidence about particular finds.']]),
 t('skills-and-tools','Separate a tool from a technique','A tool is an object used for work. A technique is a learned method; technology includes knowledge and methods.',[
  'Receiving a tool is different from knowing how to use it. A technique is a learned way of doing a task. Knowledge, observation and practice can matter.',
  'The National Museum describes basket making through material selection, preparation and different techniques. Our teaching example connects a material\'s properties with making a suitable container.',
  'This example explains a relationship between skill and materials. It does not describe one identical technique for every community or give permission to copy cultural designs.'
 ],[
  ['A learner receives a weaving tool but has not learned the process. What else is needed?','Knowledge of materials, technique and practice.','A tool does not supply all the knowledge needed to make a suitable object.'],
  ['A maker selects and prepares strands before weaving. What does the sequence show?','Making involves learned work as well as having materials.','Selection and preparation are parts of skilled making.'],
  ['What is a technique?','A learned method of doing a task.','A technique concerns how work is done rather than just an object being owned.'],
  ['A tool moves between two places, but no making process is recorded. What needs further evidence?','Whether and how the relevant technique was learned there.','Evidence of a tool\'s movement does not establish all the knowledge used with it.'],
  ['Can pottery or weaving involve technology without electricity?','Yes; technology includes methods, knowledge and tools.','Technology is not limited to powered devices.'],
  ['A container uses a local material successfully in a teaching case. What helps explain that result?','Knowledge of the material and a technique suited to the purpose.','A useful result depends on choices and skilled work, not availability alone.']
 ],[
  ['A tool makes a finished product without learned work.','People need knowledge and action to use tools effectively.'],['Technology means only electric machines.','Methods, knowledge and non-electric tools are also technology.'],['The prettiest material is automatically best for every purpose.','Suitability depends on relevant material properties and use.'],['One craft example is the method of every Philippine community.','Craft methods and cultural settings differ.']]),
 t('cultural-exchange','Ideas can be shared and adapted','Cultural exchange can involve ideas and practices as well as goods. Responses and adaptations can differ.',[
  'People meeting through travel or exchange may share skills, words, ideas and beliefs. Sharing can happen in more than one direction.',
  'A community can adapt an idea to a local purpose. The people receiving it already have their own knowledge and can make choices.',
  'To describe an actual historical exchange, look for the people, time, setting and evidence of the particular practice. A possibility is not proof of every person\'s response.'
 ],[
  ['A maker learns an idea from visitors and changes it for a local need. What does this illustrate?','Adaptation through contact and local choice.','The maker uses an encountered idea while making a choice about its use.'],
  ['Two groups share skills with each other. What fits this example?','Exchange of knowledge can move in more than one direction.','Both groups contribute in the described relationship.'],
  ['Which can be part of cultural exchange?','Sharing or adapting ideas and practices through contact.','The term includes more than exchanging physical products.'],
  ['A traded object is found but no practice is recorded. What remains a separate question?','Whether people adopted or adapted a related practice.','The object alone does not establish all cultural responses.'],
  ['Why should local knowledge remain in an exchange story?','Receiving an idea does not mean people had no knowledge of their own.','Exchange can connect with existing skills and choices.'],
  ['A report says every resident accepted a new practice immediately. What evidence is needed?','Evidence about responses in that place and time.','A claim about everyone\'s response requires more than knowing contact occurred.']
 ],[
  ['Contact means everyone immediately adopted every practice.','Responses to contact can differ.'],['Sharing an idea proves one society had no ideas of its own.','Communities can bring their own knowledge to an exchange.'],['Cultural exchange involves objects but never ideas.','Skills and practices can also be shared.'],['An encountered idea must remain unchanged in every setting.','People can adapt ideas to their purposes and circumstances.']]),
 t('exchange-and-choice','Explain an adaptation','Adaptation changes an idea or method to suit a purpose. A local choice can retain some features and change others.',[
  'In a fictional making task, a person encounters a useful container idea. They compare a purpose with the properties of local materials before deciding what to use.',
  'Changing a material or feature is an adaptation when it fits a need. Keeping some useful features does not require copying the whole object.',
  'Explain the purpose, observation and choice. This classroom example illustrates reasoning, not a record of a particular ancient maker.'
 ],[
  ['A maker keeps a container\'s purpose but chooses a suitable local material. What happened?','The maker adapted an idea to local needs.','The example connects a retained purpose with a changed material.'],
  ['Two makers choose different suitable materials for the same task. What should a comparison explain?','The relevant properties and choices in each case.','A purpose can be met through different material choices.'],
  ['What is adaptation in this lesson?','Changing an idea or method to fit a need or setting.','Adaptation can involve both continuity and change.'],
  ['A teaching case shows a successful local choice. Which historical claim still needs sources?','That a named ancient community made that exact choice.','The fictional case does not document a particular historical event.'],
  ['What should guide a material choice in the model?','Its observed properties and the intended purpose.','The model asks the learner to connect relevant observations with a need.'],
  ['A report says keeping one feature means copying everything unchanged. What does it miss?','Some features can continue while others are adapted.','Continuity in one aspect can coexist with change in another.']
 ],[
  ['Adaptation means copying every feature without any change.','Adaptation involves fitting something to a purpose or setting.'],['A local choice proves all communities made the same choice.','The example does not establish universal practice.'],['Material properties never affect a making decision.','The task uses observed properties to judge suitability.'],['A fictional making task is an excavated record of an ancient workshop.','A teaching model and archaeological evidence have different roles.']]),
 t('evidence-and-claims','Test a claim about shared techniques','An object, a making method and a cultural meaning are distinct. Historical connections need context and comparison.',[
  'A similar-looking product can invite a question about shared making knowledge. Appearance alone does not settle that question.',
  'Compare dates, materials, techniques and recorded contexts. Ask whether other explanations could fit the similarities.',
  'A supported report identifies what the evidence shows and what remains uncertain. Do not replace missing evidence with a fictional classroom story.'
 ],[
  ['Two containers look similar. What helps investigate whether makers shared a technique?','Compare techniques, dates and recorded contexts.','Resemblance needs investigation alongside evidence about making and setting.'],
  ['A product moved between places but its manufacture was not observed. What should be distinguished?','Evidence of product movement from evidence of skill transfer.','Moving an object is not the same event as learning to make it.'],
  ['What is an alternative explanation?','Another possible account to compare with the evidence.','Considering alternatives helps test how strongly a claim is supported.'],
  ['Two objects have different dates despite similar designs. What should a report preserve?','The time difference while comparing possible connections.','Similarities do not justify erasing differences in date.'],
  ['Why is a fictional case not enough to prove a historical claim?','It illustrates an idea rather than recording that event.','Historical claims require evidence about the actual setting.'],
  ['A report says one maker taught every community because two objects match. What is missing?','Evidence of teaching and its extent beyond the similarity.','The proposed people, process and scale require more support.']
 ],[
  ['Similar appearance proves one maker taught every community.','Appearance alone does not establish the teacher or extent of learning.'],['A modern classroom story supplies missing ancient evidence.','A fictional model cannot document the past.'],['An object automatically reveals every cultural meaning.','Meaning needs evidence from the relevant setting.'],['Dates and contexts can be ignored when designs look alike.','Differences in time and setting remain important.']])
 ]},
 {id:'chapter3-mission4',quiz:'chapter3-quiz4',question:'What work and connections helped maritime communities function?',objectives:['Connect waterways with supporting work, supplies and relationships.','Compare different evidence categories from Butuan without inventing one shared voyage.','Explain change over time and why heritage evidence needs care.'],topics:[
 t('harbors-and-rivers','A landing place needs connections','A harbor offers a place for boats to stop with some shelter. Routes and supporting activities can connect it with other places.',[
  'A harbor is a place where boats can stop with some shelter. A river can also connect inland directions with coastal water.',
  'Our fictional harbor model includes routes, food supplies, making and repair work. These activities help explain how a landing place could support exchange.',
  'Location is not the whole explanation. People, work and relationships matter too. The model does not describe every real port in every period.'
 ],[
  ['A model harbor has a river connection, supplies and repair work. What does it illustrate?','Place and supporting activities can work together.','The model connects location with what people do there.'],
  ['A river connects an inland direction with the coast in a teaching model. What relationship is shown?','A possible waterway connection between places.','The model shows a relationship, not a complete record of ancient journeys.'],
  ['What is a harbor?','A place where boats can stop with some shelter.','The term describes a stopping place rather than an entire trading history.'],
  ['A map shows a river mouth but gives no evidence of local work. What needs investigation?','Whether and how people used the place for exchange.','Location can offer opportunities without proving actual activities.'],
  ['Why include supplies in a harbor model?','Journeys and community life depend on resources as well as routes.','Supplies help explain how activities are supported.'],
  ['Two landing places have different work and relationships. What should explain their differences?','Evidence about the activities and setting of each place.','Similar locations need not have identical histories.']
 ],[
  ['A river mouth guarantees a busy port without people or work.','A useful location alone does not establish all the activities there.'],['Only visiting merchants mattered to a harbor.','Local supplies, repair and other work can also matter.'],['The fictional model is the layout of every real port.','A teaching model illustrates selected relationships.'],['A harbor label records every voyage made from it.','A place label does not provide a complete journey record.']]),
 t('butuan-trading-evidence','Different finds answer different questions','Boat parts and traded ceramics offer different kinds of evidence. Compare their separate settings before linking them.',[
  'Researchers have investigated boat remains and traded ceramic finds in Butuan. These are different evidence categories, not one automatically combined cargo.',
  'A boat part can help investigate construction. A ceramic object can help investigate its production tradition and use or deposition setting.',
  'Compare context and dates before proposing a connection. An older site summary is not the latest count of discoveries, and it does not prove that every pot travelled on every boat.'
 ],[
  ['A report includes a boat plank and a ceramic find from Butuan. How should it connect them?','Explain each kind of evidence and compare its recorded context.','Different evidence categories can strengthen an investigation when their settings remain clear.'],
  ['A plank shows a construction feature. What separate question concerns a ceramic find?','Its production tradition and recorded find context.','The two sources can address different questions.'],
  ['What is an evidence category in this lesson?','A kind of evidence used to investigate particular questions.','The term helps us distinguish what different finds can support.'],
  ['Two objects are described in a site summary but no shared shipment is recorded. What remains uncertain?','Whether the particular objects travelled together.','Being discussed at one site does not establish one shared cargo.'],
  ['Why keep the date of a site summary?','It helps us recognise the period and limits of the report.','An older account should not automatically be presented as the latest discovery count.'],
  ['A report claims Butuan was the only place with wider connections. What would be needed?','Evidence beyond the listed Butuan examples to support that exclusive claim.','Important evidence from one place does not establish that no other place had connections.']
 ],[
  ['Every ceramic find travelled on every recovered boat.','A shared voyage needs specific evidence.'],['An older submission is automatically the newest discovery count.','The date and limits of a source remain relevant.'],['One place\'s evidence proves no other place had connections.','Evidence for one place is not proof of exclusivity.'],['Different evidence categories answer every question identically.','Their material and contexts can support different investigations.']]),
 t('harbor-community-work','People behind an exchange','Boatbuilders, food producers and skilled makers could support maritime life. Contribution and social power are different questions.',[
  'A boat journey depends on more than its visiting trader. Boatbuilders, food producers and skilled makers can support the work and supplies around exchange.',
  'In a fictional work record, identify what each person contributes and which activity depends on it. This connects daily work with a wider network.',
  'Useful work does not by itself prove equal rights or power. A person\'s contribution and their freedom to make choices need separate evidence.'
 ],[
  ['A model shows food producers supplying people who prepare a boat journey. What does this explain?','Local work can support travel and exchange.','Supplies connect daily work with the journey.'],
  ['A worker repairs a boat but has limited choices in the fictional case. What should we distinguish?','The contribution from the worker\'s rights and power.','Being useful to an activity does not establish equal freedom.'],
  ['What is a contribution?','Something a person does to help an activity.','The term focuses on an action and what it supports.'],
  ['A report lists only merchants in a maritime community. What might strengthen it?','Evidence about making, food production and supporting work.','Looking at related activities can reveal connections missed by a list of traders alone.'],
  ['Why connect a repair worker with a journey in the model?','The worker\'s action supports an activity others depend on.','A contribution becomes clearer when its relationship to another activity is explained.'],
  ['A person makes valuable goods. What needs separate evidence?','The person\'s actual rights, choices and social power.','The value of a product does not establish the maker\'s full social position.']
 ],[
  ['Only visiting merchants contribute to maritime life.','Local workers can support activities and supplies.'],['Useful work proves the worker had equal rights and power.','Contribution and social position are distinct questions.'],['One worker represents every person in all communities.','A particular case does not establish universal experience.'],['Limited freedom means no useful work took place.','A contribution can exist even when choices are restricted.']]),
 t('changing-trading-places','Investigate change over time','Trading places can change as conditions, relationships and needs change. A proposed cause needs evidence.',[
  'Routes and trading places can change. Conditions around a place, people\'s relationships and the products they need can all be questions for investigation.',
  'Compare records from before and after a change. First describe the difference. Then ask which evidence supports a proposed reason.',
  'A short source may not settle every cause. State what is known instead of adding a confident but invented story.'
 ],[
  ['Two dated records describe different activities at a trading place. What should we do first?','Describe the supported difference before explaining a cause.','A clear description of change gives a basis for asking why it happened.'],
  ['Someone suggests a port changed because of one condition, but supplies no evidence. What is needed?','Evidence connecting that condition with the particular change.','A possible reason needs support before it is presented as established.'],
  ['What does change over time mean?','A difference between the situations being compared at different times.','A comparison needs information about more than one time.'],
  ['Two sources differ in date and perspective. How can they help investigate change?','Compare what each describes and its limits.','The sources need contextual comparison rather than automatic agreement.'],
  ['Why use dated records when studying a trading place?','They help establish the order and period of the observations.','Knowing when a record was made helps frame a comparison.'],
  ['A report has one possible cause and no supporting link. What wording is careful?','Describe it as a possibility that needs investigation.','The report should match its confidence to the available evidence.']
 ],[
  ['A proposed cause becomes certain when stated confidently.','Confidence in wording does not supply evidence.'],['One modern model records every change at an ancient port.','A teaching model is not a complete historical record.'],['Different activities prove the same cause in every place.','A cause needs evidence for the particular case.'],['A longer invented story replaces missing records.','More invented detail does not strengthen historical evidence.']]),
 t('maritime-heritage-care','Protect evidence for future learning','Heritage care protects objects and their recorded relationships. A game keepsake is not ownership of a real find.',[
  'Boats, products, work and places offer connected questions about maritime history. A strong report explains those connections instead of only listing imported objects.',
  'Protecting finds also protects future learning. A possible find should remain undisturbed while responsible site staff decide what to do.',
  'A classroom model or game collectible helps us remember an idea. It is not an original artifact, permission to remove one, or ownership of cultural heritage.'
 ],[
  ['A learner sees a possible old object at a heritage site. What is the appropriate response?','Leave it undisturbed and inform responsible site staff.','Protecting the object and setting lets specialists investigate appropriately.'],
  ['A student earns a game collectible representing a discovery. What does it mean?','A learning keepsake, not ownership of an original find.','The game token marks learning rather than transferring cultural heritage.'],
  ['Why protect a find\'s context as well as its appearance?','Recorded relationships can help future investigations.','Context includes information that a picture of the object alone does not preserve.'],
  ['A report lists boats and ceramics but gives no context. What should strengthen it?','Explain their separate settings and supported relationships.','A connected explanation requires more than naming objects.'],
  ['Who should guide handling a fragile archaeological find?','Responsible heritage specialists and site staff.','A possible find needs appropriate care rather than untrained experimentation.'],
  ['A visitor has a photograph of an object and wants a small souvenir piece. What should the visitor recognise?','A photograph does not justify damaging or removing evidence.','The object and its relationships are not replaced by a photograph.']
 ],[
  ['A game reward grants ownership of a real archaeological object.','The collectible is a learning token, not a transfer of heritage.'],['A photograph makes removal of a find harmless.','A picture cannot replace the full object and its context.'],['Students should test fragile remains themselves.','Possible finds need appropriate specialist guidance.'],['Listing imported goods alone explains every worker\'s life.','People\'s experiences need further contextual evidence.']])
 ]}
];
module.exports={missions};
