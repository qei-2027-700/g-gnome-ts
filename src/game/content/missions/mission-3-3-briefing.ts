import type {BriefingPresentation} from './types.ts';
const reference=new URL('../../../../assets/ui/mission-console.png',import.meta.url).href;
export const BRIEFING_3_3:BriefingPresentation={
 title:'Raid on Ur-Ulit',
 mapPreview:{src:reference,width:1442,height:1034,viewBox:'305 102 447 420',label:{ja:'Ur-Ulit terrain preview',en:'Ur-Ulit terrain preview'}},
 vehiclePreview:{src:reference,width:1442,height:1034,viewBox:'768 102 389 420',label:{ja:'Armored Support Vehicle',en:'Armored Support Vehicle'}},
 entries:[
  {
    "label": {
      "ja": "Primary: Instruct wingmen to occupy Scorp Vehicles",
      "en": "Primary: Instruct wingmen to occupy Scorp Vehicles"
    },
    "detail": {
      "ja": "Q／Tabで無人のScorp機を選択し、キリーはF2→F4、ターンはF3→F4、シェリダンはF4→F4。3人全員の搭乗で任務完了。",
      "en": "Select an empty Scorp vehicle with Q / Tab. Kylie: F2, F4. Thane: F3, F4. Sheridan: F4, F4. Board all three to complete the mission."
    }
  },
  {
    "label": {
      "ja": "Lure Armored Support Vehicle into the open",
      "en": "Lure Armored Support Vehicle into the open"
    },
    "detail": {
      "ja": "同じ敵ASVにVISOMを2発命中させ、基地の外へ誘い出す。",
      "en": "Hit the same enemy ASV twice with VISOM to lure it into the open."
    }
  },
  {
    "label": {
      "ja": "Use Visom Missiles",
      "en": "Use Visom Missiles"
    },
    "detail": {
      "ja": "武器2でVISOMを発射。矢印キーで誘導し、Spaceで機体ビューへ戻る。",
      "en": "Fire weapon 2. Steer VISOM with the arrow keys; Space returns to the vehicle view."
    }
  },
  {
    "label": {
      "ja": "Use Egger to kill Scorp pilot",
      "en": "Use Egger to kill Scorp pilot"
    },
    "detail": {
      "ja": "原作画像の指示。現在の試作ではGASHRで敵パイロットを排出し、無人機を奪える。",
      "en": "Instruction from the reference. This prototype uses GASHR to eject an enemy pilot and capture the empty vehicle."
    }
  },
  {
    "label": {
      "ja": "Destroy Union HAWC before entering depot",
      "en": "Destroy Union HAWC before entering depot"
    },
    "detail": {
      "ja": "原作画像の指示。現在の試作ではUnion HAWCの破壊はクリア条件に含まれない。",
      "en": "Instruction from the reference. Destroying the Union HAWC is not a completion condition in this prototype."
    }
  },
  {
    "label": {
      "ja": "Destroy Scorp Depot of Ur-Ulit",
      "en": "Destroy Scorp Depot of Ur-Ulit"
    },
    "detail": {
      "ja": "原作画像の指示。現在の試作では基地施設の破壊はクリア条件に含まれない。",
      "en": "Instruction from the reference. Destroying depot buildings is not a completion condition in this prototype."
    }
  }
],
};
