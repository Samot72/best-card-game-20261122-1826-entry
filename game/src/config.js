// Emberfall tuning: one place for every number the rules use.
export const CONFIG = {
  startLife: 20,
  maxLife: 20,
  lanes: 3,
  laneSlots: 2,
  startHand: 4,
  drawPerTurn: 2,
  maxHand: 7,
  maxMana: 10,
  startMana: 1,
  resonanceBonus: 1, // +attack/+health while two same-suit creatures share a lane
  winBonusPerLife: 50,
  winBonusPerRound: 25,
};

export const LANE_NAMES = ['Ashen Field', 'Tide Hollow', 'Storm Rise'];
export const LANE_SUBS = ['Ember ground', 'Tide ground', 'Gale ground'];
