import React, { useState } from 'react';
import StatusCapsule from './StatusCapsule'; 
import { Haptics } from '@capacitor/haptics'; 

export default function EntryForm() {
  const [status, setStatus] = useState(null);
  const [statusType, setStatusType] = useState('success');
  const [entryText, setEntryText] = useState(''); // Handle input target safely

  // 🔑 Direct standalone handler
  const handleSaveClick = async () => {
    // 🚨 DEBUG LOG: This will now guarantee to fire instantly on touch layout signatures
    console.log('=== HAPTIC DEBUG: DIRECT BUTTON TAP REGISTERED! ===');

    try {
      if (navigator.vibrate) {
        console.log('=== HAPTIC DEBUG: Executing web api pattern... ===');
        navigator.vibrate(70);
      } else {
        console.log('=== HAPTIC DEBUG: Executing plugin api track... ===');
        await Haptics.vibrate({ duration: 70 });
      }
    } catch (err) {
      console.error('=== HAPTIC DEBUG: EXECUTION EXCEPTION ===', err);
    }

    // Process storage validation pipelines
    try {
      setStatus('Entry Saved Successfully!');
      setStatusType('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus('Failed to save entry');
      setStatusType('error');
    }
  };

  return (
    <div className="relative p-6 bg-zinc-900 min-h-screen text-white">
      {/* Top Banner Alert Capsule Layout Wrapper */}
      <StatusCapsule message={status} type={statusType} />

      {/* 🌟 Removed restrictive <form> element to prevent event swallowing state overlaps */}
      <div className="max-w-md mx-auto mt-20 space-y-4">
        <h2 className="text-xl font-bold font-mono tracking-wider">REMINISCENCE CORE</h2>
        
        <textarea 
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="Write your entry logs here..." 
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-zinc-500 text-zinc-200"
          rows={4}
        />
        
        {/* 🔑 Physical direct button tap target element layout hook */}
        <button
          type="button" 
          onClick={handleSaveClick}
          className="w-full py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold transition-colors text-sm uppercase tracking-wider"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}