import MoneyManagement from "./MoneyManagement";
import "./money-management.css";
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GraduationCap, Users, Receipt, Settings, Database, IndianRupee, LogOut, Printer, Trash2, Save, Upload, FileText, MessageSquare, CalendarDays } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './style.css';
import ChildSchoolHome from './ChildSchoolHome.jsx';

const API = '/api';
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const roleName = r => ({ masteradmin: 'Master-admin', admin: 'Admin', coadmin: 'Co-admin' }[r] || r);
const canFee = u => ['masteradmin', 'admin'].includes(u?.role);
const canUsers = u => ['masteradmin', 'admin'].includes(u?.role);
function tok() { return sessionStorage.getItem('token'); }
async function api(p, o = {}) {
  const r = await fetch(API + p, { ...o, cache: 'no-store', headers: { 'Content-Type': 'application/json', Authorization: tok() ? `Bearer ${tok()}` : '', ...(o.headers || {}) } });
  const text = await r.text(); let d = {};
  try { d = text ? JSON.parse(text) : {}; } catch { d = { error: text || 'Request failed' }; }
  if (!r.ok) throw new Error(d.error || d.message || `Request failed (${r.status})`);
  return d;
}
function withYear(path, year) { return path + (path.includes('?') ? '&' : '?') + 'year=' + encodeURIComponent(year); }
const age = dob => { if (!dob) return ''; const b = new Date(dob), t = new Date(); let a = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--; return a; };
function photoFile(e, setForm, form) { const f = e.target.files?.[0]; if (!f) return; const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 300; c.height = 380; const ctx = c.getContext('2d'); const s = Math.min(img.width / 300, img.height / 380); const sw = 300 * s, sh = 380 * s, sx = (img.width - sw) / 2, sy = (img.height - sh) / 2; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 300, 380); ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 300, 380); setForm({ ...form, photo_url: c.toDataURL('image/jpeg', .72) }); }; img.src = URL.createObjectURL(f); }

class Boundary extends React.Component { constructor(p){ super(p); this.state={e:null}; } static getDerivedStateFromError(e){ return {e}; } componentDidUpdate(prev){ if(prev.children!==this.props.children && this.state.e) this.setState({e:null}); } render(){ return this.state.e ? <main className="card"><h2>Page loading problem</h2><p className="error alert">{String(this.state.e.message || this.state.e)}</p><button onClick={() => location.reload()}>Reload App</button></main> : this.props.children; } }
function Home({ onLogin }) { return <ChildSchoolHome onLogin={onLogin} />; }
function Login({ setUser, onBack }) { const [email, setE] = useState(''); const [password, setP] = useState(''); const [err, setErr] = useState(''); async function sub(){ try{ const d = await api('/login', {method:'POST', body:JSON.stringify({email,password})}); sessionStorage.setItem('token', d.token); setUser(d.user); } catch(e){ setErr(e.message); } } return <div className="loginPage"><div className="loginCard"><h1>School Admin Login</h1>{err && <div className="alert error">{err}</div>}<div className="grid"><input value={email} onChange={e=>setE(e.target.value)} placeholder="Email"/><input value={password} onChange={e=>setP(e.target.value)} placeholder="Password" type="password"/><button onClick={sub}>Login</button><button className="secondary" onClick={onBack}>Back to Home</button></div><p className="muted">Login is valid for current browser session only.</p></div></div>; }
function YearSelect({ setYear, user, setUser }) { return <main><div className="card"><h1><CalendarDays/> Select School Year</h1><p>Choose the working year. Students, admissions, fees and reports load separately for that year.</p><div className="yearGrid">{YEARS.map(y => <button key={y} onClick={()=>{sessionStorage.setItem('selectedYear', String(y)); setYear(y);}}>{y}</button>)}</div><p className="muted">Logged in as {user.email} ({roleName(user.role)})</p><button className="danger" onClick={()=>{sessionStorage.clear(); setUser(null);}}>Logout</button></div></main>; }
function Students({ year }) { const [rows,setRows]=useState([]), [classes,setClasses]=useState([]); const [form,setForm]=useState({sex:'Male',class_name:'Nursery',status:'active'}); const [msg,setMsg]=useState(''); const load=async()=>{setRows(await api(withYear('/students',year))); setClasses(await api('/classes'));}; useEffect(()=>{load().catch(e=>setMsg(e.message));},[year]); async function save(){ await api(withYear(form.id?'/students/'+form.id:'/students',year), {method:form.id?'PUT':'POST', body:JSON.stringify({...form, academic_year:year})}); setForm({sex:'Male',class_name:'Nursery',status:'active'}); setMsg('Student saved successfully'); load(); } return <section className="card"><h2>Student Database - {year}</h2>{msg&&<div className="alert">{msg}</div>}<div className="grid formGrid"><input placeholder="Student Name" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/><select value={form.sex||'Male'} onChange={e=>setForm({...form,sex:e.target.value})}><option>Male</option><option>Female</option></select><select value={form.class_name||''} onChange={e=>setForm({...form,class_name:e.target.value})}>{classes.map(c=><option key={c.id||c.name}>{c.name}</option>)}</select><input placeholder="Guardian Name" value={form.guardian_name||''} onChange={e=>setForm({...form,guardian_name:e.target.value})}/><input placeholder="Address" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/><input type="date" value={form.dob||''} onChange={e=>setForm({...form,dob:e.target.value})}/><input placeholder="Contact No" value={form.contact_no||''} onChange={e=>setForm({...form,contact_no:e.target.value})}/><input type="file" accept="image/*" onChange={e=>photoFile(e,setForm,form)}/></div><button onClick={save}><Save size={16}/>Save Student</button>{form.photo_url && <button className="secondary" onClick={()=>{const w=window.open(''); w.document.write(`<img src="${form.photo_url}" style="max-width:100%">`);}}>Preview Photo</button>}<table><thead><tr><th>Photo</th><th>Name</th><th>Sex</th><th>Class</th><th>Guardian</th><th>DOB</th><th>Age</th><th>Contact</th><th>Action</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.photo_url&&<img onClick={()=>{const w=window.open(''); w.document.write(`<img src="${s.photo_url}" style="max-width:100%">`);}} className="thumb" src={s.photo_url}/>}</td><td>{s.name}</td><td>{s.sex}</td><td>{s.class_name}</td><td>{s.guardian_name}</td><td>{String(s.dob||'').slice(0,10)}</td><td>{s.age??age(s.dob)}</td><td>{s.contact_no}</td><td><button className="small" onClick={()=>setForm({...s,dob:String(s.dob||'').slice(0,10)})}>Edit</button><button className="small danger" onClick={async()=>{if(confirm('Delete student?')){await api('/students/'+s.id,{method:'DELETE'}); load();}}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>; }
function Admissions({ year }) { const [rows,setRows]=useState([]), [classes,setClasses]=useState([]); const [form,setForm]=useState({sex:'Male',class_name:'Nursery',payment_mode:'Cash'}); const [msg,setMsg]=useState(''); const load=async()=>{setRows(await api(withYear('/admissions',year))); setClasses(await api('/classes'));}; useEffect(()=>{load().catch(e=>setMsg(e.message));},[year]); async function save(){ await api(withYear('/admissions',year), {method:'POST', body:JSON.stringify({...form, academic_year:year})}); setForm({sex:'Male',class_name:'Nursery',payment_mode:'Cash'}); setMsg('Admission saved and automatically added to Student Database'); load(); } return <section className="card"><h2>Admission Form - {year}</h2>{msg&&<div className="alert">{msg}</div>}<div className="grid formGrid"><input placeholder="Student Name" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/><select value={form.sex||'Male'} onChange={e=>setForm({...form,sex:e.target.value})}><option>Male</option><option>Female</option></select><select value={form.class_name||''} onChange={e=>setForm({...form,class_name:e.target.value})}>{classes.map(c=><option key={c.id||c.name}>{c.name}</option>)}</select><input placeholder="Guardian Name" value={form.guardian_name||''} onChange={e=>setForm({...form,guardian_name:e.target.value})}/><input placeholder="Address" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/><input type="date" value={form.dob||''} onChange={e=>setForm({...form,dob:e.target.value})}/><input placeholder="Contact No" value={form.contact_no||''} onChange={e=>setForm({...form,contact_no:e.target.value})}/><input type="file" accept="image/*" onChange={e=>photoFile(e,setForm,form)}/><select value={form.payment_mode||'Cash'} onChange={e=>setForm({...form,payment_mode:e.target.value})}><option>Cash</option><option>Online</option></select></div><button onClick={save}><Save size={16}/>Save Admission</button>{form.photo_url && <button className="secondary" onClick={()=>{const w=window.open(''); w.document.write(`<img src="${form.photo_url}" style="max-width:100%">`);}}>Preview Photo</button>}<table><thead><tr><th>Name</th><th>Class</th><th>Guardian</th><th>DOB</th><th>Age</th><th>Contact</th><th>Action</th></tr></thead><tbody>{rows.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.class_name}</td><td>{a.guardian_name}</td><td>{String(a.dob||'').slice(0,10)}</td><td>{a.age??age(a.dob)}</td><td>{a.contact_no}</td><td><button className="small danger" onClick={async()=>{if(confirm('Delete admission record?')){await api('/admissions/'+a.id,{method:'DELETE'}); load();}}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>; }
function printReceipt(type, r) {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const total = Number(r.base_fee || 0) + Number(r.misc_fee || 0);
    const paid = Number(r.paid_amount || 0);
    const bal = total - paid;
    const dt = type === 'Monthly Fee Receipt' ? (r.fee_month || '') : new Date().toLocaleDateString();

    const drawCopy = (xOffset, label) => {
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text('Bright Future Primary School', xOffset + 10, 20);
      doc.setFontSize(14);
      doc.text(`${type} - ${label}`, xOffset + 10, 30);

      const data = [
        ['Student Name', r.name || ''],
        ['Class', r.class_name || ''],
        ['Guardian/Father', r.guardian_name || ''],
        ['Contact No', r.contact_no || ''],
        ['DOB / Age', `${String(r.dob || '').slice(0, 10)} / ${r.age ?? age(r.dob)}`],
        ['Date/Month', dt],
        ['Payment Mode', `${r.payment_mode || 'Cash'} ${r.transaction_id ? (' / ' + r.transaction_id) : ''}`],
        ['Base Fee', `Rs. ${Number(r.base_fee || 0).toFixed(2)}`],
        ['Misc Fee', `Rs. ${Number(r.misc_fee || 0).toFixed(2)}`],
        ['Note', r.misc_note || ''],
        ['Total Amount', `Rs. ${total.toFixed(2)}`],
        ['Paid Amount', `Rs. ${paid.toFixed(2)}`],
        ['Balance Due', `Rs. ${bal.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: 35,
        margin: { left: xOffset + 10 },
        tableWidth: 120,
        body: data,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
      });

      doc.setFontSize(10);
      doc.text('Authorized Signature: __________________', xOffset + 10, doc.lastAutoTable.finalY + 15);
    };

    drawCopy(0, 'Student Copy');
    doc.setLineDashPattern([2, 2], 0);
    doc.line(148, 10, 148, 200);
    drawCopy(148, 'Office Copy');
    doc.save(`${type.replace(/\s+/g, '_')}_${r.name || 'Receipt'}.pdf`);
  } catch (err) {
    console.error('PDF Error:', err);
    alert('Could not generate PDF: ' + err.message);
  }
}
function MonthlyFees({ year }) { const [month,setMonth]=useState(`${year}-01`), [rows,setRows]=useState([]), [msg,setMsg]=useState(''); const load=()=>api(withYear('/monthly-fees?month='+month,year)).then(setRows).catch(e=>setMsg(e.message)); useEffect(()=>{setMonth(`${year}-01`);},[year]); useEffect(()=>{load();},[month,year]); async function gen(){await api(withYear('/monthly-fees/generate',year),{method:'POST',body:JSON.stringify({month,academic_year:year})}); setMsg('Monthly fees generated'); load();} async function upd(r,k,v){ const n={...r,[k]:v}; await api('/monthly-fees/'+r.id,{method:'PUT',body:JSON.stringify(n)}); load(); } async function sms(r){ try{await api('/sms/fees-due',{method:'POST',body:JSON.stringify({contact_no:r.contact_no,message:`Fee due for ${r.name}. Month: ${month}. Please pay soon.`})}); alert('SMS sent');}catch(e){alert(e.message);} } return <section className="card"><h2>Monthly Fee - {year}</h2>{msg&&<div className="alert">{msg}</div>}<div className="toolbar"><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/><button onClick={gen}>Auto Generate Monthly Fee</button></div><table><thead><tr><th>Student</th><th>Class</th><th>Base</th><th>Misc</th><th>Note</th><th>Paid</th><th>Mode</th><th>Txn ID</th><th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.class_name}</td><td>{r.base_fee}</td><td><input value={r.misc_fee||0} onChange={e=>upd(r,'misc_fee',e.target.value)}/></td><td><input value={r.misc_note||''} onChange={e=>upd(r,'misc_note',e.target.value)}/></td><td><input value={r.paid_amount||0} onChange={e=>upd(r,'paid_amount',e.target.value)}/></td><td><select value={r.payment_mode||'Cash'} onChange={e=>upd(r,'payment_mode',e.target.value)}><option>Cash</option><option>Online</option></select></td><td><input value={r.transaction_id||''} onChange={e=>upd(r,'transaction_id',e.target.value)}/></td><td><button className="small" onClick={()=>printReceipt('Monthly Fee Receipt',r)}><Printer size={14}/></button><button className="small" onClick={()=>sms(r)}><MessageSquare size={14}/></button><button className="small danger" onClick={async()=>{if(confirm('Delete this monthly fee?')){await api('/monthly-fees/'+r.id,{method:'DELETE'}); load();}}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>; }
function AdmissionFees({ year }) { const [adms,setAdms]=useState([]),[rows,setRows]=useState([]),[pay,setPay]=useState({base_fee:0,misc_fee:0,paid_amount:0,misc_note:'',payment_mode:'Cash'}),[msg,setMsg]=useState(''); const load=async()=>{setAdms(await api(withYear('/admissions',year))); setRows(await api(withYear('/admission-fees',year)));}; useEffect(()=>{load().catch(e=>setMsg(e.message));},[year]); function sel(v){const a=adms.find(x=>String(x.id)===String(v)); setPay(a?{admission_id:a.id,student_id:a.student_id,base_fee:a.admission_fee||0,misc_fee:0,paid_amount:0,misc_note:'',payment_mode:'Cash',transaction_id:'',...a}:{base_fee:0,misc_fee:0,paid_amount:0,misc_note:'',payment_mode:'Cash'});} async function save(){ if(!pay.admission_id)return alert('Select admission first'); await api(withYear('/admission-fees',year),{method:'POST',body:JSON.stringify({...pay,academic_year:year})}); setMsg('Admission fee saved successfully'); load(); } return <section className="card"><h2>Admission Fees - {year}</h2>{msg&&<div className="alert">{msg}</div>}<div className="grid formGrid"><select onChange={e=>sel(e.target.value)}><option>Select admission</option>{adms.map(a=><option value={a.id} key={a.id}>{a.name} - {a.class_name||'No Class'} - {a.contact_no}</option>)}</select><input value={pay.base_fee||0} onChange={e=>setPay({...pay,base_fee:e.target.value})} placeholder="Base Fee"/><input value={pay.misc_fee||0} onChange={e=>setPay({...pay,misc_fee:e.target.value})} placeholder="Misc Fee"/><input value={pay.misc_note||''} onChange={e=>setPay({...pay,misc_note:e.target.value})} placeholder="Misc Note"/><input value={pay.paid_amount||0} onChange={e=>setPay({...pay,paid_amount:e.target.value})} placeholder="Paid Amount"/><select value={pay.payment_mode||'Cash'} onChange={e=>setPay({...pay,payment_mode:e.target.value})}><option>Cash</option><option>Online</option></select><input value={pay.transaction_id||''} onChange={e=>setPay({...pay,transaction_id:e.target.value})} placeholder="Transaction ID"/></div><button onClick={save}>Save Fee</button><button className="secondary" onClick={()=>printReceipt('Admission Fee Receipt',pay)}>Print Receipt</button><table><thead><tr><th>Name</th><th>Class</th><th>Base</th><th>Misc</th><th>Paid</th><th>Mode</th><th>Print</th><th>Delete</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.class_name}</td><td>{r.base_fee}</td><td>{r.misc_fee}</td><td>{r.paid_amount}</td><td>{r.payment_mode}</td><td><button className="small" onClick={()=>printReceipt('Admission Fee Receipt',r)}><Printer size={14}/></button></td><td><button className="small danger" onClick={async()=>{await api('/admission-fees/'+r.id,{method:'DELETE'}); load();}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>; }
function ReportCards({ year }) { const [students,setStudents]=useState([]),[rows,setRows]=useState([]); const [form,setForm]=useState({exam_name:'Annual Exam',subjects:[{name:'English',marks:0,total:100},{name:'Math',marks:0,total:100}]}); const [msg,setMsg]=useState(''); const load=async()=>{setStudents(await api(withYear('/students',year))); setRows(await api(withYear('/report-cards',year)));}; useEffect(()=>{load().catch(e=>setMsg(e.message));},[year]); function setSub(i,k,v){const s=[...form.subjects]; s[i]={...s[i],[k]:v}; setForm({...form,subjects:s});} async function save(){const st=students.find(x=>String(x.id)===String(form.student_id)); await api(withYear('/report-cards',year),{method:'POST',body:JSON.stringify({...form,academic_year:year,class_name:st?.class_name})}); setMsg('Report card saved'); load();} function printReport(r) {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(22);
    doc.text('Bright Future Primary School', 148, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`Progress Report Card - Academic Year ${year}`, 148, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Student Name: ${r.name}`, 20, 45);
    doc.text(`Class: ${r.class_name}`, 20, 52);
    doc.text(`Guardian: ${r.guardian_name || ''}`, 148, 45);
    doc.text(`Exam: ${r.exam_name}`, 148, 52);

    const subs = typeof r.subjects === 'string' ? JSON.parse(r.subjects || '[]') : (r.subjects || []);
    const body = subs.map(x => [x.name, x.marks, x.total, ((Number(x.marks) / Number(x.total)) * 100).toFixed(2) + '%']);

    autoTable(doc, {
      startY: 60,
      head: [['Subject', 'Marks Obtained', 'Total Marks', 'Percentage']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 11, halign: 'center' },
      columnStyles: { 0: { halign: 'left' } }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Final Result: ${r.obtained_marks} / ${r.total_marks} (${Number(r.percentage).toFixed(2)}%)`, 20, finalY);
    doc.text(`Grade: ${r.grade}`, 148, finalY);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(`Remarks: ${r.remarks || 'Satisfactory'}`, 20, finalY + 10);

    doc.text('Class Teacher Signature', 40, finalY + 30);
    doc.text('_______________________', 40, finalY + 32);
    doc.text('Principal Signature', 200, finalY + 30);
    doc.text('_______________________', 200, finalY + 32);

    doc.save(`Report_Card_${r.name}_${r.exam_name}.pdf`);
  } catch (err) {
    console.error('PDF Error:', err);
    alert('Could not generate PDF: ' + err.message);
  }
} return <section className="card"><h2>Report Cards PDF - {year}</h2>{msg&&<div className="alert">{msg}</div>}<div className="grid formGrid"><select value={form.student_id||''} onChange={e=>setForm({...form,student_id:e.target.value})}><option>Select Student</option>{students.map(s=><option value={s.id} key={s.id}>{s.name} - {s.class_name}</option>)}</select><input value={form.exam_name||''} onChange={e=>setForm({...form,exam_name:e.target.value})}/><input value={form.remarks||''} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Remarks"/></div><h3>Subjects</h3>{form.subjects.map((s,i)=><div className="grid formGrid" key={i}><input value={s.name} onChange={e=>setSub(i,'name',e.target.value)}/><input type="number" value={s.marks} onChange={e=>setSub(i,'marks',e.target.value)}/><input type="number" value={s.total} onChange={e=>setSub(i,'total',e.target.value)}/><button className="danger" onClick={()=>setForm({...form,subjects:form.subjects.filter((_,x)=>x!==i)})}>Remove</button></div>)}<button onClick={()=>setForm({...form,subjects:[...form.subjects,{name:'',marks:0,total:100}]})}>Add Subject</button><button onClick={save}>Save Report Card</button><table><thead><tr><th>Student</th><th>Class</th><th>Exam</th><th>%</th><th>Grade</th><th>Print</th><th>Delete</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.class_name}</td><td>{r.exam_name}</td><td>{Number(r.percentage).toFixed(2)}</td><td>{r.grade}</td><td><button className="small" onClick={()=>printReport(r)}><Printer size={14}/></button></td><td><button className="small danger" onClick={async()=>{await api('/report-cards/'+r.id,{method:'DELETE'}); load();}}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>; }
function SettingsPage({ user }) { const [fees,setFees]=useState([]),[classes,setClasses]=useState([]),[users,setUsers]=useState([]); const [newClass,setNewClass]=useState(''),[newUser,setNewUser]=useState({role:'coadmin'}),[msg,setMsg]=useState(''); const load=()=>{api('/fee-structures').then(setFees).catch(e=>setMsg(e.message)); api('/classes').then(setClasses).catch(e=>setMsg(e.message)); if(canUsers(user)) api('/users').then(setUsers).catch(e=>setMsg(e.message));}; useEffect(load,[]); async function saveFee(f){await api('/fee-structures/'+encodeURIComponent(f.class_name),{method:'PUT',body:JSON.stringify(f)}); setMsg('Fee structure saved'); load();} return <section className="card"><h2>Settings & Roles</h2>{msg&&<div className="alert">{msg}</div>}<p className="muted">Current role: {roleName(user.role)}. Co-admin has all power except fee structure and user role changes.</p><h3>Class List</h3><div className="toolbar"><input value={newClass} onChange={e=>setNewClass(e.target.value)} placeholder="New class name"/><button onClick={async()=>{await api('/classes',{method:'POST',body:JSON.stringify({name:newClass})}); setNewClass(''); load();}}>Add Class</button></div><div className="chips">{classes.map(c=><span key={c.id||c.name}>{c.name}</span>)}</div><h3>Fee Structure</h3>{!canFee(user)&&<div className="alert error">Co-admin cannot change fee structure.</div>}<table><thead><tr><th>Class</th><th>Monthly Fee</th><th>Admission Fee</th><th>Save</th></tr></thead><tbody>{fees.map(f=><tr key={f.class_name}><td>{f.class_name}</td><td><input disabled={!canFee(user)} defaultValue={f.monthly_fee} onChange={e=>f.monthly_fee=e.target.value}/></td><td><input disabled={!canFee(user)} defaultValue={f.admission_fee} onChange={e=>f.admission_fee=e.target.value}/></td><td><button disabled={!canFee(user)} onClick={()=>saveFee(f)}>Save</button></td></tr>)}</tbody></table>{canUsers(user)&&<><h3>Master-admin / Admin / Co-admin</h3><div className="grid formGrid"><input placeholder="Email" value={newUser.email||''} onChange={e=>setNewUser({...newUser,email:e.target.value})}/><input placeholder="Password" value={newUser.password||''} onChange={e=>setNewUser({...newUser,password:e.target.value})}/><select value={newUser.role||'coadmin'} onChange={e=>setNewUser({...newUser,role:e.target.value})}><option value="coadmin">Co-admin</option><option value="admin">Admin</option>{user.role==='masteradmin'&&<option value="masteradmin">Master-admin</option>}</select><button onClick={async()=>{await api('/users',{method:'POST',body:JSON.stringify(newUser)}); setMsg('User saved'); load();}}>Create / Update</button></div><table><tbody>{users.map(u=><tr key={u.id}><td>{u.email}</td><td>{roleName(u.role)}</td><td>{u.role!=='masteradmin'&&<button className="danger small" onClick={async()=>{await api('/users/'+u.id,{method:'DELETE'}); load();}}>Delete</button>}</td></tr>)}</tbody></table></>}</section>; }
function Backup({ year }) { const [status,setStatus]=useState({}),[msg,setMsg]=useState(''); useEffect(()=>{api('/backup/status').then(setStatus).catch(e=>setMsg(e.message));},[]); async function download(selected=year){const data=await api('/backup/download?year='+selected); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`school-backup-${selected}-encrypted.json`; a.click(); URL.revokeObjectURL(url);} async function gd(){try{const r=await api('/backup/google-drive',{method:'POST',body:JSON.stringify({year})}); alert('Uploaded encrypted backup to Google Drive: '+r.fileId);}catch(e){alert(e.message);}} async function restoreFile(e){const f=e.target.files?.[0]; if(!f)return; if(!confirm('Restore this backup into database? Existing matching records may be updated.'))return; const text=await f.text(); const payload=JSON.parse(text); const r=await api('/backup/upload',{method:'POST',body:JSON.stringify(payload)}); setMsg(r.ok?'Encrypted backup uploaded/restored successfully.':'Restore completed.');} return <section className="card"><h2>Backup - {year}</h2>{msg&&<div className="alert">{msg}</div>}<p>Google Drive status: <b>{status.configured_google_login||status.configured_service_account?'Configured':'Not configured yet'}</b></p><p>Backup encryption: <b>{status.encryption||'AES-256-GCM'}</b> {status.backup_secret_set?'(BACKUP_SECRET set)':'(using JWT_SECRET fallback)'}</p><button onClick={()=>download(year)}><Database size={16}/>Download Encrypted Backup ({year})</button><button onClick={()=>download('all')}>Download Encrypted Backup (All Years)</button><label className="uploadBtn"><Upload size={16}/>Upload/Restore Encrypted Backup<input type="file" accept=".json,application/json" onChange={restoreFile}/></label><button onClick={gd}>Upload to Google Drive</button><p className="muted">Add Railway variable BACKUP_SECRET for stable encrypted backups. Keep the same BACKUP_SECRET to restore old backups.</p>
<hr/>
<h3>Migrate Students</h3>
<p>Copy all active students from a previous year to the current year ({year}).</p>
<div className="toolbar">
  <select id="migrateFrom">
    <option value="">Select Previous Year</option>
    {YEARS.filter(y => y < year).map(y => <option key={y} value={y}>{y}</option>)}
  </select>
  <button onClick={async()=>{
    const from = document.getElementById('migrateFrom').value;
    if(!from) return alert('Select year');
    if(confirm(`Migrate students from ${from} to ${year}?`)){
      try {
        const r = await api('/students/migrate', {method:'POST', body:JSON.stringify({fromYear:from, toYear:year})});
        alert(`Successfully migrated ${r.migrated} students.`);
      } catch(e) { alert(e.message); }
    }
  }}>Migrate to {year}</button>
</div>
</section>; }
function AdminApp({ user, setUser, year, setYear }) { const [tab,setTab]=useState(()=>sessionStorage.getItem('activeTab')||'students'); const items=[['students','Students',Users],['admission','Admission',GraduationCap],['monthly','Monthly Fee',Receipt],['adfee','Admission Fee',Receipt],['reports','Report Cards',FileText],['money','Money Mgmt',IndianRupee],['settings','Settings',Settings],['backup','Backup',Database]]; function open(id){sessionStorage.setItem('activeTab',id); setTab(id);} return <Boundary><header><h1><GraduationCap/> School Admin</h1><div className="topInfo"><span>{user.email}</span><span>{roleName(user.role)}</span><button className="secondary" onClick={()=>{sessionStorage.removeItem('selectedYear'); setYear(null);}}>Year: {year}</button><button className="danger" onClick={()=>{sessionStorage.clear(); setUser(null);}}><LogOut size={16}/> Logout</button></div></header><nav>{items.map(([id,l,Icon])=><button key={id} onClick={()=>open(id)} className={tab===id?'active':''}><Icon size={16}/> {l}</button>)}</nav><main>{tab==='students'?<Students year={year}/>:tab==='admission'?<Admissions year={year}/>:tab==='monthly'?<MonthlyFees year={year}/>:tab==='adfee'?<AdmissionFees year={year}/>:tab==='reports'?<ReportCards year={year}/>:tab==='money'?<MoneyManagement year={year}/>:tab==='settings'?<SettingsPage user={user}/>:<Backup year={year}/>}</main></Boundary>; }
function App(){ const [user,setUser]=useState(null),[screen,setScreen]=useState('home'),[checking,setChecking]=useState(true); const [year,setYear]=useState(()=>{const y=Number(sessionStorage.getItem('selectedYear')); return YEARS.includes(y)?y:null;}); useEffect(()=>{const t=tok(); if(!t){setChecking(false); return;} api('/me').then(r=>setUser(r.user)).catch(()=>sessionStorage.clear()).finally(()=>setChecking(false));},[]); if(checking) return <main>Loading...</main>; if(user&&!year) return <YearSelect setYear={setYear} user={user} setUser={setUser}/>; if(user&&year) return <AdminApp user={user} setUser={setUser} year={year} setYear={setYear}/>; return screen==='login'?<Login setUser={setUser} onBack={()=>setScreen('home')}/>:<Home onLogin={()=>setScreen('login')}/>; }

createRoot(document.getElementById('root')).render(<App/>);
