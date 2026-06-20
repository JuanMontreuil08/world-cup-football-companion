// Primary and secondary colors extracted from each nation's flag/kit
// Used to generate animated mesh gradient backgrounds on match cards
// World Cup 2026 — all 48 group stage nations

export interface TeamColors {
  primary: string
  secondary: string
}

export const TEAM_COLORS: Record<string, TeamColors> = {
  // GROUP A
  Mexico:          { primary: '#006847', secondary: '#CE1126' },
  'South Korea':   { primary: '#C60C30', secondary: '#003478' },
  Czechia:         { primary: '#D7141A', secondary: '#11457E' },
  'South Africa':  { primary: '#007A4D', secondary: '#FFB81C' },

  // GROUP B
  Canada:          { primary: '#FF0000', secondary: '#FFFFFF' },
  Switzerland:     { primary: '#FF0000', secondary: '#FFFFFF' },
  'Bosnia-Herzegovina':     { primary: '#002395', secondary: '#FFCD00' },
  Qatar:           { primary: '#8D1B3D', secondary: '#FFFFFF' },

  // GROUP C
  Brazil:          { primary: '#009C3B', secondary: '#FFDF00' },
  Morocco:         { primary: '#C1272D', secondary: '#006233' },
  Scotland:        { primary: '#003F87', secondary: '#FFFFFF' },
  Haiti:           { primary: '#00209F', secondary: '#D21034' },

  // GROUP D
  'United States':  { primary: '#B22234', secondary: '#3C3B6E' },
  Australia:       { primary: '#012169', secondary: '#E8112D' },
  Paraguay:        { primary: '#D52B1E', secondary: '#FFFFFF' },
  'Türkiye':       { primary: '#E30A17', secondary: '#FFFFFF' },

  // GROUP E
  Germany:         { primary: '#000000', secondary: '#DD0000' },
  'Ivory Coast':   { primary: '#F77F00', secondary: '#009A00' },
  Ecuador:         { primary: '#FFD100', secondary: '#003DA5' },
  'Curaçao':       { primary: '#002B7F', secondary: '#F9E300' },

  // GROUP F
  Sweden:          { primary: '#006AA7', secondary: '#FECC02' },
  Netherlands:     { primary: '#AE1C28', secondary: '#FF6600' },
  Japan:           { primary: '#BC002D', secondary: '#FFFFFF' },
  Tunisia:         { primary: '#E70013', secondary: '#FFFFFF' },

  // GROUP G
  Belgium:         { primary: '#000000', secondary: '#F00000' },
  Egypt:           { primary: '#CE1126', secondary: '#000000' },
  Iran:            { primary: '#239F40', secondary: '#DA0000' },
  'New Zealand':   { primary: '#00247D', secondary: '#CC0000' },

  // GROUP H
  Spain:           { primary: '#AA151B', secondary: '#F1BF00' },
  'Cape Verde':    { primary: '#003893', secondary: '#CF2027' },
  'Saudi Arabia':  { primary: '#006C35', secondary: '#FFFFFF' },
  Uruguay:         { primary: '#5EB6E4', secondary: '#FFFFFF' },

  // GROUP I
  France:          { primary: '#002395', secondary: '#ED2939' },
  Norway:          { primary: '#EF2B2D', secondary: '#002868' },
  Senegal:         { primary: '#00853F', secondary: '#FDEF42' },
  Iraq:            { primary: '#007A3D', secondary: '#CE1126' },

  // GROUP J
  Argentina:       { primary: '#74ACDF', secondary: '#FFFFFF' },
  Austria:         { primary: '#ED2939', secondary: '#FFFFFF' },
  Jordan:          { primary: '#007A3D', secondary: '#CE1126' },
  Algeria:         { primary: '#006233', secondary: '#D21034' },

  // GROUP K
  Colombia:        { primary: '#FCD116', secondary: '#003087' },
  'Congo DR':      { primary: '#007FFF', secondary: '#F7D918' },
  Portugal:        { primary: '#006600', secondary: '#FF0000' },
  Uzbekistan:      { primary: '#1EB53A', secondary: '#FFFFFF' },

  // GROUP L
  England:         { primary: '#CF0A2C', secondary: '#FFFFFF' },
  Ghana:           { primary: '#006B3F', secondary: '#FCD116' },
  Panama:          { primary: '#DA121A', secondary: '#002B7F' },
  Croatia:         { primary: '#FF0000', secondary: '#003DA5' },
}

// Group stage assignments — 12 groups × 4 teams
export const GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'South Korea', 'Czechia', 'South Africa'],
  B: ['Canada', 'Switzerland', 'Bosnia-Herzegovina', 'Qatar'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['United States', 'Australia', 'Paraguay', 'Türkiye'],
  E: ['Germany', 'Ivory Coast', 'Ecuador', 'Curaçao'],
  F: ['Sweden', 'Netherlands', 'Japan', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Norway', 'Senegal', 'Iraq'],
  J: ['Argentina', 'Austria', 'Jordan', 'Algeria'],
  K: ['Colombia', 'Congo DR', 'Portugal', 'Uzbekistan'],
  L: ['England', 'Ghana', 'Panama', 'Croatia'],
}

// Get colors for a match card — falls back to neutral if team not found
export function getMatchColors(homeTeam: string, awayTeam: string): {
  home: TeamColors
  away: TeamColors
} {
  return {
    home: TEAM_COLORS[homeTeam] ?? { primary: '#1a1a2e', secondary: '#16213e' },
    away: TEAM_COLORS[awayTeam] ?? { primary: '#0f3460', secondary: '#533483' },
  }
}
