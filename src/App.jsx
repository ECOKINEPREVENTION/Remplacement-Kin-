import React, { useEffect, useMemo, useState } from 'react';

const ADMIN_SECRET = 'MY_ADMIN_SECRET'; // change avant déploiement
const STORAGE_KEY = 'kine_proto_admin';
const DEFAULT_ZONE = 'Hendaye';
const MAIL_TO = 'gabi.badoch@gmail.com';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateSlots(days = 365) {
  const arr = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    arr.push({
      date: formatDate(d),
      status: 'available', // available | unavailable | offer | confirmed
      zone: DEFAULT_ZONE,
      offers: [],
      confirmedOfferId: null,
    });
  }
  return arr;
}

export default function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isAdmin = params.get('admin') === ADMIN_SECRET;

  const [slots, setSlots] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const generated = generateSlots(365);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));
    return generated;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  function updateSlot(date, patch) {
    setSlots(prev => prev.map(s => (s.date === date ? { ...s, ...patch } : s)));
  }

  function addOffer(date, offer) {
    setSlots(prev => prev.map(s => s.date === date ? {...s, offers: [...s.offers, {...offer, id: Date.now()+Math.random()}], status: 'offer'} : s));
    fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        to: MAIL_TO,
        subject: `Nouvelle offre ${offer.name} pour ${date}`,
        message: JSON.stringify(offer, null, 2)
      })
    });
  }

  function acceptOffer(date, offerId) {
    setSlots(prev => prev.map(s => s.date === date ? {...s, confirmedOfferId: offerId, status: 'confirmed'} : s));
  }

  return (
    <div className="min-h-screen bg-[#F8F9F9] p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Kinésithérapeute Remplaçante Badoch Gabrielle</h1>
          <p className="text-sm text-gray-600">Vue {isAdmin ? 'admin' : 'publique'}</p>
        </header>

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarGrid slots={slots} isAdmin={isAdmin} updateSlot={updateSlot} addOffer={addOffer} acceptOffer={acceptOffer} />
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Récap semaine</h3>
              <p className="mt-2 text-sm text-gray-700">Nombre d’offres reçues : {slots.filter(s => s.offers.length>0).length}</p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function CalendarGrid({ slots, isAdmin, updateSlot, addOffer, acceptOffer }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthSlots = slots.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {monthSlots.map(slot => (
        <DayCard key={slot.date} slot={slot} isAdmin={isAdmin} updateSlot={updateSlot} addOffer={addOffer} acceptOffer={acceptOffer} />
      ))}
    </div>
  );
}

function DayCard({ slot, isAdmin, updateSlot, addOffer, acceptOffer }) {
  const colorClass = slot.status === 'available' ? 'bg-[#A8E6CF]' : slot.status === 'unavailable' ? 'bg-[#FFAAA5]' : slot.status === 'offer' ? 'bg-[#FFD3B6]' : 'bg-[#B0E0E6]';

  function handleOffer() {
    const name = prompt('Nom du kiné');
    if(!name) return;
    const percent = prompt('Rétrocession : 80/20, 70/30, 70/30 plafonné');
    const amount = prompt('Montant (optionnel)');
    const patients = prompt('Nombre de patients/semaine (optionnel)');
    const ca = prompt('Chiffre d’affaire/mois (optionnel)');
    const charges = prompt('Charges du cabinet (optionnel)');
    const message = prompt('Message libre (optionnel)');
    addOffer(slot.date, {name, percent, amount, patients, ca, charges, message});
  }

  return (
    <div className={`${colorClass} p-3 rounded shadow-sm`}>
      <div className="flex justify-between">
        <div>{slot.date}</div>
        <div>{slot.status}</div>
      </div>
      {isAdmin ? (
        <div>
          {slot.offers.map(o => <div key={o.id}>{o.name} - {o.percent} - {o.amount}€</div>)}
          <button className="mt-2 px-2 py-1 bg-green-600 text-white rounded" onClick={()=>slot.offers.forEach(o=>acceptOffer(slot.date,o.id))}>Accepter une offre</button>
        </div>
      ) : (
        <div>
          {(slot.status==='available' || slot.status==='offer') && <button className="mt-2 px-2 py-1 bg-green-600 text-white rounded" onClick={handleOffer}>Proposer / Surenchérir</button>}
        </div>
      )}
    </div>
  );
}
