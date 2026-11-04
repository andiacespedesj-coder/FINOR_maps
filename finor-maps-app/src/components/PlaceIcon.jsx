import {
  Book, Briefcase, Building2, CreditCard, DoorOpen, Droplets,
  FlaskConical, GraduationCap, HeartPulse, Info, Library, Mic,
  MoreHorizontal, Trophy, Utensils,
} from 'lucide-react';

const iconMap = {
  Book,
  Briefcase,
  Building2,
  CreditCard,
  DoorOpen,
  Droplets,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Info,
  Library,
  Mic,
  Trophy,
  Utensils,
  MoreHorizontal,
};

export default function PlaceIcon({ name, size = 20, strokeWidth = 2 }) {
  const Icon = iconMap[name] || MoreHorizontal;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
