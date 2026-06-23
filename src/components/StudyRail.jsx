import React, { useMemo } from 'react';

const EPIC_DIRECTIVES = [
  {
    focus: "THE PRESENT MOMENT",
    text: "FOCUS ONLY ON THE ACT, NEVER ON THE REWARD. DO NOT WORK FOR THE PRIZE, AND DO NOT SINK INTO LAZINESS. THE WORK IS YOURS. DO IT NOW.",
    verse: "BG 2.47"
  },
  {
    focus: "INTERNAL SUPREMACY",
    text: "CONQUER YOUR THOUGHTS BY YOUR OWN WILL; DO NOT ALLOW YOUR REASON TO SINK INTO THE DUST. THE MIND ALONE IS YOUR GREATEST ALLY, AND THE MIND ALONE IS THE ADVERSARY THAT WILL DESTROY YOU.",
    verse: "BG 6.5"
  },
  {
    focus: "THE HIGHEST POWER",
    text: "ACT WITHOUT GREED. DO WHAT IS REQUIRED WITHOUT ASKING 'WHAT IS IN IT FOR ME?' IN PURE ACTION, YOU FIND THE HIGHEST POWER.",
    verse: "BG 3.19"
  },
  {
    focus: "THE DESTINY",
    text: "STAND UP. WIN YOUR GLORY. THE OBSTACLES BEFORE YOU ARE ALREADY DEFEATED BY THE MARCH OF TIME. YOU ARE THE INSTRUMENT. DO NOT WAIT.",
    verse: "BG 11.33"
  },
  {
    focus: "THE SMOKE AND FIRE",
    text: "ALL WORK IS BORN IN SMOKE, JUST AS FIRE IS. DO NOT QUIT BECAUSE THE START IS MESSY OR IMPERFECT. BURN THROUGH THE CLOUD AND FINISH THE TASK.",
    verse: "BG 18.48"
  }
];

export default function StudyRail() {
  const active = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * EPIC_DIRECTIVES.length);
    return EPIC_DIRECTIVES[randomIndex];
  }, []);

  return (
    <div className="w-full max-w-[280px] mx-auto h-full flex flex-col items-center justify-center p-6 text-center min-h-[350px]">
      <div className="space-y-4 max-w-[240px]">
      
      </div>
    </div>
  );
}