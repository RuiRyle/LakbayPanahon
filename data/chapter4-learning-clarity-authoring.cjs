// Editorial source for four Chapter 4 missions. Contextual situations and recurring
// misconceptions are authored practice content, not calibrated test-item statistics.
const t=(id,title,point,paragraphs,items,wrong)=>({id,title,point,paragraphs,items,wrong});
const missions=[
 {id:'chapter4-mission1',quiz:'chapter4-quiz1',question:'How can we read writing sources without mixing up scripts, languages and objects?',objectives:['Distinguish speech, a language and a writing system.','Read the labelled ka example and compare it with the copperplate source.','Explain what source labels and living writing traditions help us understand.'],topics:[
 t('writing-and-speech','Different ways to share a message','Communication can use speech, stories, signs and writing. Different sources need different questions.',[
  'Communication means sharing a message or idea. People can communicate through spoken words, stories, signs and writing. These forms can serve different purposes.',
  'An oral account is shared through speech. An inscription is writing marked on an object or surface. Ask who produced each source, in what setting, and what it can help explain.',
  'A missing written record does not mean a community had no knowledge or history. Compare the sources available instead of ranking people by the records that survive.'
 ],[
  ['A class studies a spoken account. Which question helps it understand the source?','Who shared it, in what setting, and what can it help explain?','The speaker and setting help frame the questions an oral account can address.'],
  ['A museum has a spoken account and an inscribed object. How should a learner approach them?','Identify each form and ask questions suited to its source.','Speech and writing can supply different information that needs contextual study.'],
  ['What is communication?','Sharing a message or idea.','Messages can be shared in several forms, not only on a written page.'],
  ['No written document survives from a community in the supplied records. Which conclusion needs more evidence?','That its people had no knowledge or history.','The absence of a surviving document does not establish an absence of knowledge.'],
  ['A story is passed on through speaking. What kind of source is being described?','An oral account that needs its speaker and setting identified.','Oral means spoken; its context still matters.'],
  ['Two accounts communicate related ideas in different forms. What should a comparison explain?','What each source says, how it was produced and its limits.','A comparison needs more than deciding which form looks more familiar.']
 ],[
  ['Only written messages count as communication.','Speech, stories and signs can also communicate.'],['No surviving document means a community had no history.','Surviving records do not include every form of past knowledge.'],['One account supplies every person\'s view.','An account has a particular source and perspective.'],['A source\'s form makes its context unnecessary.','Form does not replace information about who produced it and why.']]),
 t('baybayin-writing','Read the labelled ka example','A script is a writing system. The modern Baybayin ka card illustrates one syllabic sign, not a whole translated message.',[
  'A script is a system of written signs. A language includes words and grammar. They are related but different: a language can be written using different scripts.',
  'The teaching card labels one Baybayin sign ka. In this basic example it includes a consonant and an a vowel. It is not simply the English letter K.',
  'Read the label, identify ka, and keep the claim small. The modern typeset sign is not an ancient artifact or a translation of an entire inscription. More signs and marks need further learning.'
 ],[
  ['The teaching card labels its Baybayin sign ka. Which description fits?','A modern example of one syllabic sign.','The label supplies one reading; it does not present an entire ancient message.'],
  ['A learner calls the sign only the English letter K. What correction is needed?','The labelled basic reading is ka, including its a vowel.','The example represents more than the English consonant label alone.'],
  ['What is a script?','A system of written signs.','A writing system is different from the language expressed through it.'],
  ['A class knows the ka example but receives an unfamiliar inscription. What else is needed?','Reliable identification and knowledge of the other signs and marks.','Knowing one sign does not allow a complete translation.'],
  ['Why does the card say modern teaching example?','To distinguish the typeset example from an original ancient object.','The label explains the kind of source the student is viewing.'],
  ['A website calls every old Philippine sign Baybayin. What should a learner check?','The source and the particular script being identified.','Baybayin is not an interchangeable label for every Philippine script.']
 ],[
  ['One ka example translates every inscription.','A full reading needs knowledge and evidence beyond one sign.'],['The modern typeset card is an excavated ancient object.','A teaching example and an original find are different.'],['Script and language are always the same thing.','A writing system and a language need distinguishing.'],['Every Philippine writing tradition has one identical script name.','Different traditions must be identified specifically.']]),
 t('copperplate-evidence','Compare the copperplate and the teaching card','The Laguna Copperplate is a specific writing source associated with Kawi and a date read as 900 CE.',[
  'An inscription is writing marked on an object or surface. The Laguna Copperplate Inscription has writing associated with Kawi and a date read as 900 CE.',
  'Compare it with the modern ka card. One is an inscribed object studied by specialists; the other is a teaching example of a Baybayin sign. Their scripts and source histories differ.',
  'An inscription can help investigate writing in its setting. It does not prove that every person could read or that every community used the same script. A replica should be labelled as a replica.'
 ],[
  ['Which caption distinguishes the copperplate from the ka card?','The copperplate has Kawi-related writing; the card teaches a Baybayin sign.','The comparison keeps the sources and script identifications distinct.'],
  ['A label gives 900 CE for the copperplate inscription. What does that date concern?','The historical date read from the inscription, not the age of its modern display.','The calendar label must not be confused with when a display was made.'],
  ['What is an inscription?','Writing marked on an object or surface.','The term describes writing on a material object.'],
  ['A writing source survives from one setting. What broader claim needs separate evidence?','That every community used that script and everyone could read it.','One source does not establish universal script use or literacy.'],
  ['A class sees a newly made copy of an inscribed object. How should it be labelled?','A copy or replica of the source.','The label should distinguish the new representation from the original.'],
  ['Why compare the copperplate with the ka card instead of calling both ancient Baybayin messages?','Their scripts, materials and source histories are different.','A useful comparison identifies those differences before making a claim.']
 ],[
  ['Every old written object is automatically Baybayin.','Age alone does not identify a script.'],['One inscription proves everyone in the islands could read.','A single source cannot establish universal literacy.'],['A modern replica has the same source history as the original.','Copies and originals must be distinguished.'],['A display date and an inscription\'s historical date mean the same thing.','The dates concern different events.']]),
 t('living-script-traditions','Writing knowledge continues','Living traditions are used and passed on by people. Present-day communities have choices and their own descriptions of their knowledge.',[
  'A living tradition is a practice people continue to use and pass on. The National Museum highlights Buhid-Mangyan and Hanunuo-Mangyan writing in Mindoro, and Pala\'wan and Tagbanua writing in Palawan.',
  'Tradition names and community names should be identified carefully. Do not exchange labels or assume every person in a place has one identical practice.',
  'To share an example, check its source, meaning and any sharing conditions. Living people are not displays frozen in the past. Learning and change can occur together.'
 ],[
  ['A learner wants to share a community writing example. What is a responsible first step?','Check its source, meaning and any permission needed.','A reliable example needs attribution and appropriate sharing conditions.'],
  ['A museum describes a continuing writing practice. What makes the practice living?','People use it and pass knowledge to others.','Living refers to continued practice by people, not an unchanged museum object.'],
  ['Which description fits a living tradition?','A practice people continue and teach.','People and learning keep the practice active.'],
  ['A visitor assumes every person on an island uses one script identically. What should be investigated?','The specific communities, practices and sources involved.','Location alone does not establish identical practice by everyone.'],
  ['Why should community descriptions be included when studying a writing tradition?','They help explain the knowledge in its own setting.','A museum summary is useful but does not replace community perspectives.'],
  ['A new way of teaching accompanies an existing script practice. Which comparison is useful?','Identify what continues and what changes with evidence.','New support for learning does not automatically mean either total sameness or disappearance.']
 ],[
  ['Living communities are unchanged examples frozen in the past.','People make choices and practices can change.'],['A museum label replaces every community voice.','A summary does not contain every perspective.'],['All tradition names can be used interchangeably.','Names identify particular traditions and need care.'],['Any visible writing example is automatically free to reproduce without checking.','Source, meaning and sharing conditions still need checking.']]),
 t('checking-writing-sources','Build a reliable source label','A reliable label identifies the object or example, the script and the evidence behind a reading.',[
  'An online picture may show an original object, a replica or a new design. A caption should tell you which and identify a source.',
  'If a picture claims to translate an ancient message, ask who identified the script and what supports the reading. Do not invent missing words because the signs look familiar.',
  'Build a careful label: name the source, distinguish original from copy, give a supported description, and state uncertainty where it matters. This connects writing knowledge with evidence.'
 ],[
  ['An unsourced picture claims to translate an ancient message. What is the best next step?','Check the object history, script identification and basis for the reading.','The claim needs source information rather than a confident guess.'],
  ['A museum label calls a new teaching card an original find. What should be corrected?','Identify it as a modern teaching example.','The kind of source is part of an accurate description.'],
  ['What does a source label help explain?','What an example is and the evidence behind its description.','The label helps connect a description to its source.'],
  ['Two websites give different readings for a picture without naming sources. What should a report do?','Seek the supporting evidence and keep the uncertainty visible.','Repeating one reading does not establish it as verified.'],
  ['A copied sign resembles the ka card. What should a learner avoid assuming?','That resemblance alone translates a complete message.','One familiar feature does not establish the reading of everything around it.'],
  ['Which addition would improve a writing display beyond a list of names?','An explanation linking each example to its source and supported reading.','The explanation makes clear why the source supports the description.']
 ],[
  ['Confident wording replaces missing evidence for a translation.','Confidence does not supply source information.'],['Every online image is an original ancient artifact.','An image can show a copy or a modern design.'],['Recognising one sign gives the meaning of every sign.','Other characters and marks need their own reading knowledge.'],['A source label is unnecessary if the object looks old.','Appearance alone does not establish source history.']])
 ]},
 {id:'chapter4-mission2',quiz:'chapter4-quiz2',question:'How do materials, purpose and learned skills shape what makers create?',objectives:['Choose a material using a stated purpose and observed properties.','Explain preparation, technique and checking as skilled technology.','Connect designs and continuing knowledge with their source and community context.'],topics:[
 t('materials-and-skills','Start with the purpose','A material property is a feature relevant to use. A useful choice connects the intended task with an observation.',[
  'A material property is a feature that affects how something can be used. Makers consider a purpose before choosing and preparing materials.',
  'The National Museum describes bamboo, rattan and pandan among materials used in making mats and baskets. In our fictional task, prepared material A bends for the planned weave while B breaks in the same test.',
  'A fits this model\'s need for flexibility. This does not rank every plant or replace real making knowledge. A complete product also needs decisions about strength, size and use.'
 ],[
  ['The model needs strands that bend. A bends after preparation; B breaks in the test. Which choice fits?','Choose A because its observed flexibility fits the task.','The decision connects the required property with the stated observation.'],
  ['A maker needs a container for a particular purpose. What should be considered before choosing material?','The relevant properties and the intended use.','Purpose gives a reason for examining particular material features.'],
  ['What is a material property?','A feature that affects how a material can be used.','Flexibility in the fictional bending task is one example.'],
  ['A works in one bending task. What still needs checking for a real container?','Other requirements such as strength, preparation and intended contents.','One property does not settle every requirement of a finished product.'],
  ['Why is colour alone not enough in the bending task?','The task requires an observed ability to bend.','A decorative feature does not answer that functional requirement.'],
  ['Two products have different uses. How should their material choices be compared?','Judge each material against its particular purpose.','A material can suit one task without being best for all tasks.']
 ],[
  ['The prettiest colour proves a material fits every task.','Appearance alone does not establish functional suitability.'],['One successful test ranks all materials for all purposes.','The result concerns the stated task and conditions.'],['Available material makes learned preparation unnecessary.','Makers still need knowledge of preparation and use.'],['A fictional test is a measured result for every named plant.','The teaching observations do not document every actual plant.']]),
 t('weaving-knowledge','Prepare, make and check','Making combines suitable preparation, learned technique and checking the result against a purpose.',[
  'A basket does not appear just because plant material is available. Makers select and prepare materials, use learned techniques, and check the result.',
  'Follow the simplified sequence: prepare suitable strands, arrange them with a learned method, then check whether the container suits its purpose. An attractive result may still fail to hold its intended contents.',
  'This is a process model, not a complete weaving tutorial or a copy of a community design. Different makers can use different preparations and techniques.'
 ],[
  ['Which sequence matches the worked model?','Prepare suitable material, use a learned technique, then check the purpose.','The sequence connects preparation, skilled making and evaluation.'],
  ['A model container looks attractive but cannot hold its intended contents. What needs attention?','Whether the result meets its purpose.','Appearance and functional suitability are different considerations.'],
  ['What is preparation in this lesson?','Work that makes materials or tools suitable for the next task.','Preparation is part of making rather than an automatic property of raw material.'],
  ['A finished basket is displayed without showing the process. What would explain its skilled work?','How materials were prepared, arranged and checked.','The process helps connect the product with the maker\'s knowledge.'],
  ['Why does the teaching model label its stages?','To explain how the steps relate to a purpose.','The stages support understanding without claiming to be a universal recipe.'],
  ['A learner calls basket making effortless because plants are available. What is missing?','The planning, practice and decisions involved.','Availability alone does not explain a completed product.']
 ],[
  ['Raw strands are automatically ready for every product.','Preparation depends on the material and intended task.'],['Appearance alone proves a container serves its purpose.','The result must also be checked against its intended use.'],['Every tradition uses the identical making sequence and design.','The model simplifies relationships rather than documenting all traditions.'],['A teaching sequence grants permission to copy any cultural design.','Understanding a process does not settle sharing permissions.']]),
 t('craft-technologies','Technology includes learned methods','Technology includes knowledge, tools and methods used for tasks. It is not limited to electric devices.',[
  'Technology includes methods and tools used with knowledge to solve tasks. Pottery, carving and boatbuilding can involve this practical knowledge without electric machines.',
  'In a fictional pottery label, identify the maker\'s material choice and shaping and firing methods. Firing means heating shaped clay to make pottery. These details explain more skill than a price label alone.',
  'The finished object is material; the making knowledge is another part of its story. Different tools are not a reason to rank a community\'s human worth.'
 ],[
  ['A pottery display gives only a price. What would explain the making skill?','The materials, methods and knowledge used by the maker.','A price does not describe how the object was made.'],
  ['A maker uses a non-electric tool with a learned method. Can this involve technology?','Yes; technology includes tools, methods and knowledge.','Electric power is not the definition of technology.'],
  ['Which explanation fits technology in this mission?','Practical knowledge, methods and tools used for tasks.','The term includes more than modern powered devices.'],
  ['A display includes a woven object and information about how it was made. What distinction is useful?','The material object and the knowledge involved in making it.','Both can matter, but they are different aspects of the example.'],
  ['Why include shaping and firing in the fictional pottery label?','They help explain learned making processes.','The methods connect the object with skilled work.'],
  ['Two communities use different tools. What should a comparison investigate?','The purposes, methods and settings of the tools.','Different tools invite explanation rather than a ranking of people.']
 ],[
  ['Only electric machines count as technology.','Learned methods and non-electric tools can also be technology.'],['A price tag completely explains making knowledge.','Cost is not a full description of method or skill.'],['Different tools prove one community has less human worth.','Tools do not determine human dignity.'],['An object and all the knowledge used to make it are identical things.','A product and its making knowledge should be distinguished.']]),
 t('design-and-meaning','Ask what a design means in its setting','Designs need source and community context. A guessed meaning is not evidence, and sharing conditions need checking.',[
  'A design may have a meaning connected with a community\'s practices. Similar-looking patterns need not have the same meaning.',
  'If a shop assigns an invented meaning to a design, check a reliable description instead of repeating it. Ask who made or identified the example and what setting the description concerns.',
  'Before copying or publishing, check agreed sharing conditions. A classroom task can explore general making skills without reproducing sacred or restricted designs.'
 ],[
  ['A shop gives a design a made-up community meaning. What should a careful account do?','Check reliable sources rather than repeat the invented meaning.','A meaning needs an appropriate basis, not a seller\'s invention.'],
  ['Two patterns look alike. What should be checked before giving them one meaning?','Their sources and the settings in which they are used.','Resemblance alone does not establish a shared meaning.'],
  ['What does context help explain about a design?','Where, when and how it is used.','The setting can help interpret what a particular example means.'],
  ['An image is easy to download. What remains a separate question?','Whether and under what conditions it may be copied or shared.','Availability does not settle appropriate use.'],
  ['How can a classroom explore making without copying a restricted design?','Use a general fictional task and respect the source\'s conditions.','A reasoning activity need not reproduce protected cultural expression.'],
  ['A caption gives a meaning but no source. What would strengthen it?','Attribution and evidence for that particular interpretation.','The description needs a source that can be examined.']
 ],[
  ['Every pattern has the same meaning everywhere.','Meanings can differ with practice and setting.'],['A guessed meaning becomes accurate when printed on a label.','Printing does not create evidence.'],['Anything visible online is automatically appropriate to copy.','Source and sharing conditions still matter.'],['Checking context means ranking traditions by appearance.','Contextual explanation is not a ranking of cultures.']]),
 t('sustaining-craft-knowledge','Knowledge can continue while tools change','Learning and practice can sustain craft knowledge alongside changes in particular tools or methods.',[
  'Knowledge is passed on through people learning and practising. Continuing a craft does not require every tool to remain unchanged.',
  'In our fictional case, a maker uses a different tool while keeping useful knowledge of materials and purpose. Identify the changed part and the continuing skill.',
  'To explain actual historical change, compare dated evidence. The model illustrates a possibility; it does not prove that every tradition followed one path.'
 ],[
  ['A maker changes one tool while retaining material knowledge. What can coexist?','Change in a tool and continuity in knowledge.','A change in one aspect does not require everything else to disappear.'],
  ['A learner practises with an experienced maker. What process can this support?','Passing on craft knowledge through learning.','Knowledge can continue through teaching and practice.'],
  ['What does sustaining craft knowledge involve?','Supporting its continued learning and use.','The focus is knowledge practised by people rather than objects alone.'],
  ['A new tool appears in a teaching case. What evidence would an actual historical claim require?','Dated information about the particular practice and setting.','A fictional example is not a record of every real change.'],
  ['Why distinguish a tool from a skill when comparing change?','They can change or continue in different ways.','The distinction makes the comparison more precise.'],
  ['A display claims one changed tool erased all craft knowledge. What is needed?','Evidence about which knowledge continued and which changed.','An all-or-nothing claim needs more than one changed object.']
 ],[
  ['One new tool proves every earlier skill disappeared.','Tools and knowledge can change in different ways.'],['Continuity means no part of a practice can ever change.','A continuing practice may include particular changes.'],['A fictional example records the history of every craft.','Specific histories need their own evidence.'],['Passing on knowledge requires ignoring community choices about sharing.','Community choices remain part of responsible learning.']])
 ]},
 {id:'chapter4-mission3',quiz:'chapter4-quiz3',question:'How can named examples help us compare traditions without stereotyping people?',objectives:['Identify named source examples and their particular settings.','Connect environment with choices, history and learned knowledge.','Explain a supported similarity or difference without treating a group as identical.'],topics:[
 t('regional-diversity','Begin with named examples','A named practice and its source help us explain diversity more carefully than a claim about every person in a place.',[
  'Diversity means differences among people\'s experiences and practices. Start a comparison with named examples rather than one description for a whole island.',
  'Hudhud is an Ifugao narrative-chant example. For comparison, the National Museum presents Buhid-Mangyan and Hanunuo-Mangyan writing in Mindoro, and Pala\'wan and Tagbanua writing in Palawan. Their forms and source settings differ.',
  'Name the practice, source and setting. A short description does not tell us what every resident knows or does.'
 ],[
  ['A display compares Hudhud and continuing writing traditions. Which introduction is careful?','They are named examples in different contexts.','The examples help a comparison without describing every person in a region.'],
  ['A source names a practice but not every participant. What should a report preserve?','The scope of the source rather than universal participation.','A named practice does not establish everyone\'s experience.'],
  ['What is diversity in this lesson?','Differences among experiences and practices.','The idea helps us recognise variety rather than require sameness.'],
  ['Two community examples concern different periods. What should be included in a comparison?','The time and setting of each example.','A comparison is clearer when it does not erase context.'],
  ['Why name the source of a regional example?','So readers can examine the basis of the description.','Attribution connects the example with its evidence.'],
  ['A poster gives every person on an island one tradition. What should improve it?','Specific examples and limits instead of a universal description.','A more precise claim leaves room for differences within places.']
 ],[
  ['One regional example describes every resident identically.','People within a place can have different experiences.'],['Hudhud is the name of every story in northern Luzon.','The name identifies a particular attributed tradition.'],['A museum summary replaces all community perspectives.','A summary does not contain every voice.'],['Difference requires ranking one community above another.','Recognising diversity is not a ranking of human worth.']]),
 t('environment-and-culture','Surroundings offer possibilities','Surroundings influence resources and activities, while people\'s choices, histories and relationships also matter.',[
  'The environment can offer materials, routes and opportunities. It does not alone explain every belief, livelihood or cultural practice.',
  'In our fictional coastal community, some people fish, weave or repair boats. Living near water helps explain opportunities, not one identical job for everyone.',
  'Compare surroundings with evidence about choices, histories and learning. A complete cultural explanation needs more than a climate or place label.'
 ],[
  ['A report explains a whole culture using climate alone. What is missing?','People\'s choices, histories and other evidence.','Surroundings matter but do not provide the whole explanation.'],
  ['A fictional coastal scene includes fishing, weaving and repair. What does it illustrate?','People can use opportunities in different ways.','Living near the sea does not assign everyone the same activity.'],
  ['How can surroundings matter in community life?','They can influence available resources and routes.','The influence needs connecting with what people do.'],
  ['Two places have similar surroundings but different practices. What should be investigated?','Their histories, relationships and choices as well as environment.','Similar conditions do not require identical cultural practices.'],
  ['Why should a report include local knowledge when explaining a practice?','People\'s learned choices help connect resources with activities.','Resources alone do not describe how people understand or use them.'],
  ['A map labels a place coastal. What claim still needs evidence?','That every resident has the same livelihood or belief.','Location alone does not establish everyone\'s experiences.']
 ],[
  ['Climate alone explains every cultural practice.','People\'s actions and histories also need study.'],['Everyone near the sea must do the same work.','A location offers possibilities rather than identical livelihoods.'],['Similar environments guarantee identical beliefs.','Beliefs cannot be inferred solely from surroundings.'],['Local knowledge is unnecessary if a map is available.','A map does not replace evidence about people\'s knowledge.']]),
 t('oral-tradition-learning','Knowledge can be carried in spoken forms','Oral traditions can carry stories, knowledge and memories. Their forms and sharing conditions need context.',[
  'Oral traditions use spoken forms to pass on knowledge or expression. Stories and chants can be studied as sources in their own settings.',
  'Hudhud is a named Ifugao narrative-chant example. We use a source summary, not an actual chant performance or a request to share private family knowledge.',
  'When accounts differ, ask who shared each and in what setting. Do not invent a single original version or assume all differences mean an account has no value.'
 ],[
  ['Two versions of an account differ. What is a careful next step?','Ask about their sources and settings before explaining the difference.','Context can help investigate how and why accounts differ.'],
  ['A source summary describes Hudhud. What is the student examining?','Information about a named narrative-chant example.','The summary is not the same as performing or recording the chant.'],
  ['What is an oral tradition?','Knowledge or expression passed on through spoken forms.','Oral refers to speaking and related forms of expression.'],
  ['A classroom story is invented for a lesson. What claim needs correction?','That it is automatically an authentic community tradition.','A fictional teaching example needs to be labelled as such.'],
  ['Why check agreed sharing conditions for oral knowledge?','Communities can have choices about what is shared and how.','Studying a source does not remove those choices.'],
  ['A learner is asked to compare two supplied summaries. What is needed?','Use the given sources without claiming to represent a whole community.','A source task does not require disclosing personal background or private knowledge.']
 ],[
  ['Every fictional classroom story is an authentic community tradition.','Invented examples and community sources must be distinguished.'],['Different versions automatically have no historical value.','Differences can be questions for contextual investigation.'],['All spoken knowledge is free to record and publish without checking.','Sharing conditions and community choices still matter.'],['An oral source can only be studied by someone representing the entire community.','A learner can examine supplied sources without making that claim.']]),
 t('continuity-and-change','Name what continues and what differs','Passing on knowledge can continue through different forms and teaching methods. Compare particular aspects.',[
  'Transmission means passing knowledge or expression to others through learning. Both narrative chanting and writing traditions involve learning and practice, but they are different forms.',
  'Compare the supplied source summaries: one concerns Hudhud, another continuing writing traditions. State one supported similarity and one difference.',
  'Documentation and organised teaching can support transmission. To describe a specific change over time, use dated evidence rather than assume every practice changed in the same way.'
 ],[
  ['What similarity fits the two supplied tradition summaries?','Both involve learning and passing on knowledge.','The comparison concerns transmission rather than identical forms.'],
  ['What difference should remain visible between the summaries?','One concerns narrative chanting and another writing traditions.','A shared learning process does not make the forms identical.'],
  ['What is transmission in this lesson?','Passing knowledge or expression to others through learning.','The term concerns people learning and sharing practices.'],
  ['A new teaching method is introduced to support a practice. What needs comparison?','Which knowledge continues and which methods change.','Continuity in knowledge can coexist with changes in how it is taught.'],
  ['Why use dated descriptions when making a change claim?','They help establish which periods are being compared.','A time comparison needs a basis for before and after.'],
  ['A report calls chanting and writing completely identical because both involve learning. What should be corrected?','Keep the shared feature and the difference in form.','A comparison can recognise similarity without erasing differences.']
 ],[
  ['A shared feature means two traditions are identical in every aspect.','Similarity in one aspect does not establish complete sameness.'],['A new teaching method automatically erases all earlier knowledge.','Method and knowledge can change or continue differently.'],['A museum summary describes every individual practice completely.','A short summary has limits.'],['Continuity means nothing can change in any part of a tradition.','Continuity and particular changes can coexist.']]),
 t('respectful-comparison','Compare without stereotypes','A stereotype treats everyone in a group as the same. A useful comparison names examples, evidence and limits.',[
  'A stereotype is an oversimplified description that treats everyone in a group as identical. One example cannot describe all Philippine culture.',
  'Build a four-part report: identify example A, identify example B, explain a supported similarity or difference, and state a limit. Use the sources rather than guesses about appearance or place.',
  'You do not need to share your family background or represent a group to complete this task. Comparing sources is different from ranking communities.'
 ],[
  ['A poster uses one tradition to describe every Philippine community. What improves it?','Name sourced examples and explain their differences and limits.','Specific descriptions are more useful than a universal stereotype.'],
  ['Two examples have a similarity and a difference. How should the report be organised?','Identify each example, explain the comparison and state its limits.','Readers need to know what is being compared and why.'],
  ['What is a stereotype?','An oversimplified claim treating everyone in a group as the same.','The problem is erasing differences among people and experiences.'],
  ['A learner cannot identify a source for a community claim. What should happen?','Check appropriate sources rather than invent details.','A gap in information should not be filled with a guess about a group.'],
  ['What does a source-comparison task require of a student?','Reasoning from supplied evidence, not representing an entire community.','The task can be completed without a claim about personal identity.'],
  ['A display ranks communities by how familiar their clothing looks. What is wrong?','Appearance is being used as a ranking instead of an evidence-based comparison.','A comparison should explain specific examples rather than judge people\'s worth.']
 ],[
  ['One custom defines every member of a group.','A particular practice does not establish identical experience.'],['A fair comparison must rank one community as more valuable.','Explanation is different from ranking human worth.'],['A student must disclose family identity to analyse supplied sources.','The task concerns the sources, not a required personal disclosure.'],['A guessed cultural detail is acceptable if it makes a report longer.','Invented detail does not strengthen evidence.']])
 ]},
 {id:'chapter4-mission4',quiz:'chapter4-quiz4',question:'How can different sources help us explain heritage and our responsibilities today?',objectives:['Connect a named example with a contribution and an evidence limit.','Use two sources to explain different kinds of knowledge.','Recognise diversity and practise responsible heritage care.'],topics:[
 t('heritage-contributions','Connect an example with a contribution','Heritage can include knowledge, objects, skills and practices linked with earlier generations. Explain the contribution, not only its name.',[
  'Heritage includes knowledge, skills, objects and practices linked with earlier generations. A contribution is clearer when you explain what an example helps us understand.',
  'Our portfolio connects Butuan boat evidence with construction knowledge, the copperplate with writing, and craft descriptions with materials and making. The sources have distinct contexts; they are not one shared event.',
  'Name an example, explain its supported contribution and state a limit. A boat join does not record every voyage, and one writing source does not establish universal literacy.'
 ],[
  ['Which plan makes a heritage display more informative?','Connect each sourced example with a contribution and a limit.','An explanation adds meaning beyond a list of names.'],
  ['A boat join is included in a portfolio. What contribution can it help investigate?','Particular construction knowledge.','The feature can support a question about how parts were joined.'],
  ['What can heritage include?','Knowledge, skills, objects and practices linked with earlier generations.','Heritage is not limited to one kind of physical object.'],
  ['A portfolio contains a boat part and a writing source. What should remain distinct?','Their activities, source contexts and supported claims.','Different examples need not come from one event to be compared.'],
  ['Why explain a contribution rather than only naming an object?','The explanation shows how evidence connects with an idea.','A name alone does not show what the source supports.'],
  ['A display calls one example the history of everyone. What would improve it?','Explain the example\'s contribution at the scale its evidence supports.','A particular source does not establish every community\'s history.']
 ],[
  ['One object proves all communities shared identical practices.','A particular example has limits.'],['Every item in a portfolio came from one shared event.','The sources can have different contexts and dates.'],['Admiration alone proves a historical claim.','A positive feeling does not replace evidence.'],['Heritage includes only physical objects and never knowledge.','Skills and practices can also be part of heritage.']]),
 t('identity-and-diversity','Shared identity can include differences','A shared Filipino identity can include different communities and traditions. It does not require identical experiences.',[
  'Identity concerns how people understand and describe who they are. People can share a Filipino identity while belonging to different communities and traditions.',
  'We can value earlier contributions without treating every person in the precolonial islands as using our modern national identity in the same way.',
  'A balanced display can include other relevant voices while preserving differences. One costume, script or custom is not a requirement every person must match.'
 ],[
  ['A display includes only one community\'s voice. What can make it more balanced?','Include other relevant voices without erasing differences.','Shared identity can be explored through varied experiences.'],
  ['Two people share a Filipino identity but practise different traditions. Which explanation fits?','Shared identity and different traditions can coexist.','Identity does not require identical practices.'],
  ['What is identity in this lesson?','How people understand and describe who they are.','Identity concerns people\'s understanding and description of belonging.'],
  ['A report projects one modern national label unchanged onto all earlier communities. What is needed?','Attention to the different historical settings and identities.','Present-day identity should not be assumed identical in every past setting.'],
  ['Why avoid choosing one custom as a test of being Filipino?','A shared identity includes diverse practices and experiences.','No single example describes or defines every person.'],
  ['A comparison finds both shared contributions and different experiences. How should it be presented?','Explain both the connections and the differences.','Neither shared identity nor diversity needs to erase the other.']
 ],[
  ['Shared identity requires everyone to have identical traditions.','People can share belonging while having different practices.'],['One costume defines every Filipino person.','A single cultural example is not a universal identity requirement.'],['Every earlier community used modern national identity exactly as we do.','Historical settings and forms of belonging need distinction.'],['Including another voice means all differences must disappear.','A balanced account can keep differences visible.']]),
 t('evidence-of-heritage','Explain a claim with two sources','An evidence link explains how a particular source supports a claim. Two different examples can show more than one kind of knowledge.',[
  'Try this claim: people developed different forms of practical knowledge. Source A describes a Butuan boat-building feature. Source B describes craft materials and techniques.',
  'Explain each link: A helps investigate construction; B helps explain skilled making. The craft overview concerns living knowledge, not a dated excavation of every ancient method.',
  'A useful report states the claim, what each source supports, and what neither establishes. Listing two objects is not yet an explanation.'
 ],[
  ['Which conclusion fits the boat and craft source summaries?','They illustrate different forms of skilled knowledge, with distinct contexts.','The sources support different examples without proving identical practices everywhere.'],
  ['A report names two objects but does not link them to a claim. What is missing?','An explanation of what each source supports.','The evidence link is the reason the source is relevant to the claim.'],
  ['What is an evidence link?','An explanation of how a source supports a particular claim.','It connects an observation or source detail with an idea.'],
  ['A living-craft overview is compared with an excavated boat part. What should the report recognise?','Their different kinds of source and time settings.','A modern overview is not automatically evidence for every ancient technique.'],
  ['Why include a limit in a two-source report?','To distinguish the supported explanation from claims the sources cannot settle.','Limits help keep the claim matched to the evidence.'],
  ['A learner admires a craft and claims it had one universal origin. What else is needed?','Historical evidence for that origin claim.','Admiration is not evidence of an origin or its extent.']
 ],[
  ['Two objects automatically prove every technique had one origin.','Shared origins need their own evidence.'],['A list of objects fully explains a claim.','The report needs to connect each example with the idea.'],['A living-craft overview dates every ancient making method.','The overview has a particular source setting and limits.'],['More admiration can replace a missing evidence link.','Feelings and historical support are different.']]),
 t('heritage-responsibility','Care is something learners can do','Responsible heritage care includes protecting places and objects, crediting sources and respecting agreed sharing conditions.',[
  'Safeguard means help protect something from loss or harm. Heritage care concerns objects, places and knowledge, with communities involved in decisions about their traditions.',
  'Learners can follow site rules, leave possible finds in place, credit sources and check permissions when needed. These actions help protect information and relationships.',
  'A game collectible is a learning symbol. It does not grant ownership of an original object or permission to publish everything that can be recorded.'
 ],[
  ['A project includes a craftsperson\'s work. Which step is responsible?','Give credit and check agreed sharing conditions.','Attribution and appropriate permission are part of responsible use.'],
  ['A visitor sees a possible old object at a site. What should the visitor do?','Leave it in place and notify responsible staff.','This protects the find and its recorded relationships for appropriate care.'],
  ['What does safeguard mean?','Help protect something from loss or harm.','The idea concerns care, not taking possession.'],
  ['A learner can record a practice but does not know its sharing conditions. What is needed?','Check what may be shared and how.','The ability to record does not settle appropriate publication.'],
  ['A student earns a heritage-themed game token. What does the reward represent?','A learning keepsake rather than ownership of a real artifact.','The game reward does not transfer cultural heritage.'],
  ['Why credit a source in a heritage display?','To acknowledge the basis and contributors behind the information.','Credit connects the display with the people and sources supporting it.']
 ],[
  ['Respect means taking a piece of a site home.','Removing a find can damage heritage and its information.'],['A game token gives ownership of an original cultural object.','A learning reward is not a transfer of heritage.'],['Anything recordable is automatically appropriate to publish.','Sharing conditions still need attention.'],['Giving credit makes every use automatically permitted.','Attribution and permission are related but different questions.']]),
 t('heritage-synthesis','Build a supported heritage story','Synthesis connects several sources and ideas into an explanation. A strong report recognises contributions, diversity and evidence limits.',[
  'Synthesis means connecting ideas and sources into a supported explanation. Bring together the chapter\'s writing, making and tradition examples rather than adding an unsupported grand claim.',
  'Use four parts: a claim, a link to source A, a link to source B, and a limit. Distinguish ancient material evidence, modern teaching models and living practices.',
  'Include a responsible action you can take now, such as crediting sources or following site rules. Completing this chapter does not establish complete Philippine-history knowledge.'
 ],[
  ['Which final heritage report is strongest?','It names sources, explains contributions, recognises diversity and states limits.','The report connects evidence and ideas rather than only listing examples.'],
  ['A report combines an original object and a modern model. What should it make clear?','Which is which and what each can support.','The two sources have different roles in the explanation.'],
  ['What is synthesis?','Connecting several ideas and sources into a supported explanation.','The task requires relationships and reasoning, not only a longer list.'],
  ['A report makes a broad claim but supplies two narrow examples. What should the learner check?','Whether the scale of the claim fits those sources.','Two examples do not automatically establish a universal conclusion.'],
  ['How can heritage learning connect with an action today?','Follow site rules, credit sources and respect sharing conditions.','These are practical responsibilities linked to caring for heritage.'],
  ['A chapter is complete in the game. What does a careful learner recognise?','There is more to investigate beyond the selected chapter topics.','Completion marks this learning sequence, not every possible history topic.']
 ],[
  ['A chapter reward proves complete mastery of all Philippine history.','The chapter covers selected topics, not everything.'],['A modern model and an original artifact have identical source histories.','Their roles and histories need distinction.'],['Two examples make every universal claim valid.','The extent of a claim must fit the evidence.'],['A longer list automatically becomes an explanation.','An explanation needs supported connections.']])
 ]}
];
module.exports={missions};
