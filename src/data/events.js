/* The wedding day itself is the countdown target: barat reception, 5 Dec 2026. */
export const WEDDING_DATE = '2026-12-05T16:00:00+05:30';

export const SIDES = {
  bride: 'Bride side',
  groom: 'Groom side',
};

const BOTH = ['bride', 'groom'];

/* `sides` drives the filter under "The festivities". Only the two Mehendis are
   side-specific; everything else is shared. Getting this wrong sends guests to
   the wrong house, so change it deliberately. */
export const events = [
  {
    mark: '✧',
    name: 'Engagement',
    when: 'Mon · 30 Nov · 8:00 PM onwards',
    where: 'Wonderland Farms, Jalandhar',
    dress: 'Evening elegance',
    sides: BOTH,
  },
  {
    mark: '✺',
    name: 'Groom Mehendi & Jago',
    when: 'Wed · 2 Dec · 12:00 PM onwards',
    where: 'Manchanda Darbar, Jalandhar',
    dress: 'Fresh greens & yellows',
    sides: ['groom'],
  },
  {
    mark: '♪',
    name: 'Bride Mehendi & Dholki',
    when: 'Thu · 3 Dec · 6:00 PM onwards',
    where: '16, Gulmohar Block, Dhakoli, Punjab',
    dress: 'Traditional Folk, Bright Colours',
    sides: ['bride'],
  },
  {
    mark: '☀',
    name: 'Haldi Milan',
    when: 'Fri · 4 Dec · 11:00 AM onwards',
    where: 'Sohi Banquets, Zirakpur, Punjab',
    dress: 'Pastels and florals',
    sides: BOTH,
  },
  {
    mark: '♫',
    name: 'Dawat-e-DJ',
    when: 'Fri · 4 Dec · 8:00 PM onwards',
    where: 'Clarion Inn, Dhakoli, Punjab',
    dress: 'Dress to dance',
    sides: BOTH,
  },
  {
    mark: '✸',
    name: 'The Wedding',
    when: 'Sat · 5 Dec · Reception of Barat 4:00 PM · Dinner 8:00 PM · Doli 4:00 AM',
    where: 'The Grandeur, Zirakpur, Punjab',
    dress: 'Traditional finery',
    sides: BOTH,
    full: true,
  },
];
