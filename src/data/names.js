/* The guest's own family leads. Before a side is chosen -- and on the
   envelope, which is shown before the question -- it falls back to the
   groom-first order the site used throughout. */
const ORDER = {
  groom: { first: 'Sumit', second: 'Vaishali', dev: 'सुमित & वैशाली' },
  bride: { first: 'Vaishali', second: 'Sumit', dev: 'वैशाली & सुमित' },
};

export function namesFor(side) {
  return ORDER[side] ?? ORDER.groom;
}
