(function (root) {
  "use strict";
  const weekdays = ["Mo","Di","Mi","Do","Fr"];
  const norm = s => String(s || "").trim().toLowerCase();
  function days(value) {
    const tokens=String(value||"").trim().split(/[\s·,+;/]+/).filter(Boolean);
    return tokens.length && tokens.every(x=>weekdays.includes(x)) ? [...new Set(tokens)] : [];
  }
  function time(value) {
    const m=String(value||"").match(/^(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})$/);
    if(!m) return null;
    const [h1,m1,h2,m2]=m.slice(1).map(Number);
    if(h1>23||h2>23||m1>59||m2>59) return null;
    const start=h1*60+m1,end=h2*60+m2;
    return start<end ? {start,end} : null;
  }
  function overlaps(a,b) {
    const x=time(a.time),y=time(b.time);
    return !!(x&&y&&days(a.days).some(d=>days(b.days).includes(d))&&x.start<y.end&&y.start<x.end);
  }
  function count(c,members) {
    if(c.countMode==="manual") return /^\d+$/.test(String(c.studentCount)) ? Number(c.studentCount) : null;
    const selected=Array.isArray(c.studentGroups)&&c.studentGroups.length ? c.studentGroups : [c.name];
    const matches=members.filter(m=>selected.includes(m.group));
    return matches.length || (Array.isArray(c.studentGroups)&&c.studentGroups.length ? 0 : null);
  }
  function available(t,c) {
    const slot=time(c.time),range=time(t.availableTime||"16:00–19:30"),ds=days(c.days),td=days(t.days);
    return !!(!t.availabilityUnconfirmed&&t.status==="Aktiv"&&slot&&range&&ds.length&&ds.every(d=>td.includes(d))&&slot.start>=range.start&&slot.end<=range.end);
  }
  function check(classes,teachers,rooms,members) {
    const issues=[];
    const add=(c,text)=>issues.push({id:c.id,text:c.name+": "+text});
    classes.forEach(c=>{
      const slot=time(c.time),ds=days(c.days),n=count(c,members);
      if(!ds.length||!slot) add(c,"Tage oder Uhrzeit ungültig");
      if(slot&&(slot.start<960||slot.end>1170)) add(c,"außerhalb der Schulzeit 16:00–19:30");
      if(ds.length!==2) add(c,"bitte zwei Unterrichtstage festlegen");
      if(n===null||n<=0) add(c,"Schülerzahl fehlt oder ist 0");
      if(Number(c.capacity)>0&&n>Number(c.capacity)) add(c,"Klassenmaximum überschritten ("+n+" / "+c.capacity+")");
      const ts=teachers.filter(t=>norm(t.name)===norm(c.teacher));
      if(!c.teacher||ts.length!==1) add(c,"Lehrkraft fehlt oder ist nicht eindeutig erfasst");
      else if(!available(ts[0],c)) add(c,"Lehrkraft ist zu dieser Zeit nicht verfügbar");
      const rs=rooms.filter(r=>norm(r.name)===norm(c.room));
      if(!c.room||rs.length!==1) add(c,"Raum fehlt oder ist nicht eindeutig erfasst");
      else if(!(Number(rs[0].capacity)>0)) add(c,"Raumkapazität fehlt");
      else if(n!==null&&n>Number(rs[0].capacity)) add(c,"Raum zu klein ("+n+" Schüler / "+rs[0].capacity+" Plätze)");
    });
    for(let i=0;i<classes.length;i++) for(let j=i+1;j<classes.length;j++) {
      const a=classes[i],b=classes[j];
      if(overlaps(a,b)) {
        if(a.room&&norm(a.room)===norm(b.room)) {add(a,"Raum-Doppelbelegung mit "+b.name);add(b,"Raum-Doppelbelegung mit "+a.name);}
        if(a.teacher&&norm(a.teacher)===norm(b.teacher)) {add(a,"Lehrerüberschneidung mit "+b.name);add(b,"Lehrerüberschneidung mit "+a.name);}
      }
      const ag=Array.isArray(a.studentGroups)?a.studentGroups:[a.name],bg=Array.isArray(b.studentGroups)?b.studentGroups:[b.name];
      if(a.countMode!=="manual"&&b.countMode!=="manual"&&ag.some(g=>bg.includes(g))) add(b,"Schülergruppe ist auch "+a.name+" zugeordnet");
    }
    return issues;
  }
  function allocate(classes,teachers,rooms,members) {
    const result=classes.map(c=>({...c,room:""})),notes=[];
    const order=[...result].sort((a,b)=>(count(b,members)||0)-(count(a,members)||0));
    for(const c of order) {
      const n=count(c,members),slot=time(c.time);
      if(n===null||n<=0||!slot||days(c.days).length!==2||slot.start<960||slot.end>1170) {notes.push(c.name+": erst Schülerzahl und Unterrichtszeiten vervollständigen");continue;}
      const candidates=rooms.filter(r=>Number(r.capacity)>=n&&rooms.filter(x=>norm(x.name)===norm(r.name)).length===1).sort((a,b)=>Number(a.capacity)-Number(b.capacity));
      const room=candidates.find(r=>!result.some(other=>other.id!==c.id&&norm(other.room)===norm(r.name)&&overlaps(c,other)));
      if(room)c.room=room.name;else notes.push(c.name+": kein passender freier Raum gefunden");
      if(!c.teacher) {
        const teacher=teachers.filter(t=>available(t,c)&&teachers.filter(x=>norm(x.name)===norm(t.name)).length===1).sort((a,b)=>result.filter(x=>x.teacher===a.name).length-result.filter(x=>x.teacher===b.name).length).find(t=>!result.some(other=>other.id!==c.id&&norm(other.teacher)===norm(t.name)&&overlaps(c,other)));
        if(teacher)c.teacher=teacher.name;else notes.push(c.name+": keine verfügbare freie Lehrkraft gefunden");
      }
    }
    return {classes:result,notes,issues:check(result,teachers,rooms,members)};
  }
  const api={days,time,overlaps,count,available,check,allocate};
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  root.BilalPlanner=api;
})(typeof window!=="undefined"?window:globalThis);
