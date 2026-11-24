function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .toLowerCase();
}

console.log('Building2:', toKebab('Building2'));
console.log('BarChart2:', toKebab('BarChart2'));
console.log('Trash2:', toKebab('Trash2'));
console.log('CheckCircle2:', toKebab('CheckCircle2'));
