(function(root){
  'use strict';
  const months=['September','Oktober','November','Dezember','Januar','Februar','Maerz','April','Mai','Juni'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const norm=v=>String(v??'').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
  const name=m=>[m.firstName,m.lastName].filter(Boolean).join(' ');
  function fees(members){
    const families=new Map();
    return members.map(m=>{
      const phone=norm(m.guardians?.[0]?.phone).replace(/[^0-9+]/g,'');
      const ordinal=phone?(families.get(phone)||0)+1:1;if(phone)families.set(phone,ordinal);
      const raw=m.sourceRaw||{},fromSource=m.feeMode!=='auto'&&Number.isFinite(raw.Monatsbeitrag_EUR);
      const base=fromSource?raw.Monatsbeitrag_EUR:ordinal>=3?45:50;
      const rate=m.feeOverride!==undefined&&m.feeOverride!==null&&m.feeOverride!==''?Number(m.feeOverride):base;
      const paidMonths=months.filter(mon=>norm(m.payments?.[mon])==='bezahlt').length;
      return {member:m,rate,ordinal,paidMonths,annual:rate*10,paid:rate*paidMonths,open:rate*(10-paidMonths)};
    });
  }
  function csv(rows){
    if(!rows.length)return '';const keys=[...new Set(rows.flatMap(Object.keys))];
    const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    return '\ufeff'+[keys,...rows.map(r=>keys.map(k=>typeof r[k]==='object'?JSON.stringify(r[k]):r[k]))].map(r=>r.map(cell).join(';')).join('\r\n');
  }
  function parseCSV(text){
    text=String(text).replace(/^\ufeff/,'');const first=text.split(/\r?\n/)[0];
    const delimiter=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';
    const rows=[];let row=[],value='',quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
      else if(c===delimiter&&!quoted){row.push(value);value='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}
      else value+=c;
    }
    if(quoted)throw Error('CSV: Ein Anführungszeichen wurde nicht geschlossen.');
    row.push(value);if(row.some(Boolean))rows.push(row);return rows;
  }
  function importStudents(rows,group=''){
    if(!rows.length)return [];
    const headers=rows[0].map(norm),get=(r,...keys)=>{for(const key of keys){const i=headers.indexOf(norm(key));if(i>=0&&r[i]!==undefined)return String(r[i]).trim();}return '';};
    return rows.slice(1).filter(r=>r.some(v=>v!==null&&v!==undefined&&String(v).trim())).map((r,i)=>{
      const firstName=get(r,'firstName','Vorname','Name_des_Kindes','Name','Schüler');
      if(!firstName)return null;
      let guardians=[];const raw=get(r,'guardians');if(raw){try{guardians=JSON.parse(raw);}catch(_){throw Error('Ungültige Kontakte in Importzeile '+(i+2));}if(!Array.isArray(guardians))throw Error('Kontakte müssen eine Liste sein.');}
      if(!guardians.length){const g={name:get(r,'Erziehungsberechtigte','Eltern','Kontaktname'),phone:get(r,'Telefon_Familie','Telefon','phone'),email:get(r,'Email','E-Mail'),relationship:get(r,'Rolle','Beziehung')};if(Object.values(g).some(Boolean))guardians.push(g);}
      let storedPayments={};const jsonPayments=get(r,'payments');if(jsonPayments){try{storedPayments=JSON.parse(jsonPayments);}catch(_){throw Error('Ungültige Zahlungen in Importzeile '+(i+2));}}
      const payments={};months.forEach(mon=>payments[mon]=norm(get(r,mon)||storedPayments[mon])==='bezahlt'?'Bezahlt':'Offen');
      const monthly=get(r,'Monatsbeitrag_EUR','Monatsbeitrag','feeOverride').replace(',','.');
      let sourceRaw;const rawSource=get(r,'sourceRaw');if(rawSource){try{sourceRaw=JSON.parse(rawSource);}catch(_){throw Error('Ungültige Quelldaten in Importzeile '+(i+2));}}
      return {firstName,lastName:get(r,'lastName','Nachname'),arabicName:get(r,'arabicName','Arabischer Name'),age:get(r,'Alter','age'),birthdate:get(r,'Geburtsdatum','birthdate'),group:get(r,'group','Klasse','Gruppe')||group,days:get(r,'days','Unterrichtstage','Unterricht'),city:get(r,'city','Ort'),street:get(r,'street','Straße'),postalCode:get(r,'postalCode','PLZ'),email:get(r,'email','Email'),guardians,payments,sourceRaw,feeOverride:monthly!==''&&Number.isFinite(Number(monthly))?Number(monthly):null,emergencyName:get(r,'emergencyName','Notfallkontakt'),emergencyPhone:get(r,'emergencyPhone','Notfall_Telefon'),allergies:get(r,'allergies','Allergien'),notes:get(r,'Notizen','notes'),importOriginal:Object.fromEntries(rows[0].map((key,j)=>[String(key),r[j]??'']))};
    }).filter(Boolean);
  }
  function parseICS(text){
    const lines=String(text).replace(/\r?\n[ \t]/g,'').split(/\r?\n/);const events=[];let item=null;
    const unescape=v=>v.replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
    for(const line of lines){if(line==='BEGIN:VEVENT'){item={};continue;}if(line==='END:VEVENT'){if(item?.date)events.push(item);item=null;continue;}if(!item)continue;
      const at=line.indexOf(':');if(at<0)continue;const key=line.slice(0,at).split(';')[0],value=line.slice(at+1);
      if(key==='SUMMARY')item.title=unescape(value);if(key==='UID')item.icsUid=value;if(key==='LOCATION')item.location=unescape(value);if(key==='DESCRIPTION')item.note=unescape(value);
      if(key==='DTSTART'){const m=value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))/)||value.match(/^(\d{4})(\d{2})(\d{2})$/);if(m){item.date=m.slice(1,4).join('-');item.time=m[4]?m[4]+':'+m[5]:'';item.timezone=line.match(/TZID=([^:;]+)/)?.[1]||(value.endsWith('Z')?'UTC':'');}}
      if(key==='RRULE')item.recurrence=value;
    }
    return events;
  }
  function duplicates(members){const groups=new Map();members.forEach(m=>{const key=norm(name(m));if(!key)return;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);});return [...groups.values()].filter(g=>g.length>1);}
  function detectHeader(rows){let best=0,score=0;rows.slice(0,40).forEach((r,i)=>{const cells=r.map(norm);const name=cells.some(c=>['firstname','vorname','name_des_kindes','name','schüler'].includes(c));const value=(name?10:0)+cells.filter(c=>['lastname','nachname','klasse','gruppe','telefon_familie','email','e-mail','erziehungsberechtigte','alter','september'].includes(c)).length;if(value>score){score=value;best=i;}});return best;}
  function toICS(events){
    const escape=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bilal-Schule//Verwaltung//DE','CALSCALE:GREGORIAN'];
    for(const e of events){if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date||''))continue;lines.push('BEGIN:VEVENT','UID:'+escape(e.icsUid||String(e.id)+'@bilal-schule'));
      const stamp=e.date.replace(/-/g,'');if(/^\d{2}:\d{2}$/.test(e.time||'')){const timezone=e.timezone&&e.timezone!=='UTC'&&/^[A-Za-z0-9_/+-]+$/.test(e.timezone)?';TZID='+e.timezone:'';lines.push('DTSTART'+timezone+':'+stamp+'T'+e.time.replace(':','')+'00'+(e.timezone==='UTC'?'Z':''));}else lines.push('DTSTART;VALUE=DATE:'+stamp);
      lines.push('SUMMARY:'+escape(e.title),'LOCATION:'+escape(e.location),'DESCRIPTION:'+escape(e.note));if(e.recurrence&&/^[-A-Z0-9=;,]+$/i.test(e.recurrence))lines.push('RRULE:'+e.recurrence);lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n';
  }
  const api={months,clone,norm,name,fees,csv,parseCSV,importStudents,parseICS,toICS,detectHeader,duplicates};
  root.BilalDomain=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
