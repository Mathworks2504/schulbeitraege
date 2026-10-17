'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),D=require('../public/domain'),P=require('../public/planning-core');
test('CSV round-trip keeps separators, quotation marks and line breaks',()=>{
 const rows=[{Vorname:'A;B',Nachname:'"Name"',Notiz:'Zeile 1\nZeile 2'}];
 const parsed=D.parseCSV(D.csv(rows));assert.deepEqual(parsed,[Object.keys(rows[0]),Object.values(rows[0])]);
 assert.throws(()=>D.parseCSV('Name;Notiz\nA;"nicht geschlossen'));
});
test('source fee and paid months survive changes to family order',()=>{
 const students=[{firstName:'A',guardians:[{phone:'111'}],payments:{September:'Bezahlt'},sourceRaw:{Monatsbeitrag_EUR:45}},{firstName:'B',guardians:[{phone:'111'}]},{firstName:'C',guardians:[{phone:'111'}]}];
 const rows=D.fees(students);assert.equal(rows[0].rate,45);assert.equal(rows[0].paid,45);assert.equal(rows[0].open,405);assert.equal(rows[2].rate,45);
 students[0].feeOverride=0;assert.equal(D.fees(students)[0].rate,0);
});
test('imports contacts, confirmed payments and individual rates from school columns',()=>{
 const result=D.importStudents([['Name_des_Kindes','Klasse','Erziehungsberechtigte','Telefon_Familie','September','Monatsbeitrag_EUR'],['Test Kind','Klasse A','Kontakt','0123','Bezahlt','45,00']]);
 assert.equal(result.length,1);assert.equal(result[0].guardians[0].phone,'0123');assert.equal(result[0].feeOverride,45);assert.equal(result[0].payments.September,'Bezahlt');
});
test('ICS keeps every event, unfolded text and timezone information',()=>{
 const result=D.parseICS('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:one\r\nDTSTART;TZID=Europe/Berlin:20261020T160000\r\nSUMMARY:Eltern\\, Lehrer\r\n und Schüler\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:two\r\nDTSTART;VALUE=DATE:20261022\r\nSUMMARY:Ferien\r\nEND:VEVENT\r\nEND:VCALENDAR');
 assert.equal(result.length,2);assert.equal(result[0].date,'2026-10-20');assert.equal(result[0].timezone,'Europe/Berlin');assert.equal(result[0].title,'Eltern, Lehrerund Schüler');assert.equal(result[1].time,'');
});
test('planning detects room and teacher overlaps and chooses a fitting room',()=>{
 const classes=[{id:1,name:'A',days:'Mo Do',time:'16:00–18:00',room:'R1',teacher:'T1',capacity:20},{id:2,name:'B',days:'Mo Do',time:'17:00–19:00',room:'R1',teacher:'T1',capacity:20}],teachers=[{name:'T1',status:'Aktiv',days:'Mo Do',availableTime:'16:00–19:30'}],rooms=[{name:'R1',capacity:20},{name:'R2',capacity:20}],members=[{group:'A'},{group:'B'}];
 assert(P.check(classes,teachers,rooms,members).some(i=>i.text.includes('Doppelbelegung')));
 assert(P.check(classes,teachers,rooms,members).some(i=>i.text.includes('Lehrerüberschneidung')));
 const result=P.allocate(classes,teachers,rooms,members);assert.notEqual(result.classes[0].room,result.classes[1].room);
});
test('calendar export and reimport retain text, local time and timezone',()=>{
 const events=[{id:'one',title:'Eltern, Lehrer; Team',date:'2026-10-20',time:'16:30',timezone:'Europe/Berlin',note:'Erste Zeile\nZweite Zeile'}];
 const parsed=D.parseICS(D.toICS(events));assert.equal(parsed[0].title,events[0].title);assert.equal(parsed[0].time,'16:30');assert.equal(parsed[0].timezone,'Europe/Berlin');assert.equal(parsed[0].note,events[0].note);
});
test('school database header is detected below title and instruction rows',()=>{
 const rows=[['Bilal-Schule'],[],['Hinweise'],[],['Lfd_Nr','Klasse','Name_des_Kindes','Alter','Telefon_Familie'],[1,'A','Test Kind',7,'0123']];
 assert.equal(D.detectHeader(rows),4);assert.equal(D.importStudents(rows.slice(D.detectHeader(rows)))[0].firstName,'Test Kind');
});
test('CSV export and reimport preserve cached fees and payment states',()=>{
 const original=[{firstName:'Test',lastName:'Kind',group:'A',guardians:[{name:'Kontakt',phone:'111'}],payments:{September:'Bezahlt'},sourceRaw:{Monatsbeitrag_EUR:45},feeOverride:null}];
 const imported=D.importStudents(D.parseCSV(D.csv(original)));assert.equal(D.fees(imported)[0].rate,45);assert.equal(D.fees(imported)[0].paid,45);
});
