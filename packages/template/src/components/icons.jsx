import React from 'react'
import {
  Sparkles, Hand, Footprints, Palette, Heart, Leaf, ShieldCheck, Clock, Award,
  Users, Baby, Scissors, Droplet, Gem, Brush, Flower2, Sun, Smile, BadgeCheck,
  CalendarCheck, Star, Wind, Eye, Zap, Accessibility, CreditCard, Car, Wifi,
} from 'lucide-react'

/** String keys in salon.config.json map to real components here. */
export const ICONS = {
  sparkles: Sparkles, hand: Hand, footprints: Footprints, palette: Palette,
  heart: Heart, leaf: Leaf, shield: ShieldCheck, clock: Clock, award: Award,
  users: Users, baby: Baby, scissors: Scissors, droplet: Droplet, gem: Gem,
  brush: Brush, flower: Flower2, sun: Sun, smile: Smile, verified: BadgeCheck,
  calendar: CalendarCheck, star: Star, wind: Wind, eye: Eye, zap: Zap,
  accessible: Accessibility, card: CreditCard, parking: Car, wifi: Wifi,
}

export const Icon = ({ name, ...props }) => {
  const C = ICONS[name] || Sparkles
  return <C {...props} />
}
