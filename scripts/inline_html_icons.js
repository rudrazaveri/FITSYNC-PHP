const fs = require('fs');
const path = require('path');
const lucide = require('../js/lucide.min.js');

function toKebab(str) {
  return str
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .toLowerCase();
}

function childrenToSvg(children) {
  return children.map(([tag, attrs]) => {
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<${tag} ${attrStr}></${tag}>`;
  }).join('');
}

const iconMap = {};
for (const [pascalName, children] of Object.entries(lucide.icons)) {
  const kebab = toKebab(pascalName);
  const svgInner = childrenToSvg(children);
  iconMap[kebab] = svgInner;
  iconMap[pascalName.toLowerCase()] = svgInner;
  iconMap[kebab.replace(/-/g, '')] = svgInner;
}
iconMap['buildings'] = iconMap['building-2'] || iconMap['building'];
iconMap['building2'] = iconMap['building-2'];
iconMap['barchart2'] = iconMap['bar-chart-2'];
iconMap['trash2'] = iconMap['trash-2'];
iconMap['checkcircle2'] = iconMap['check-circle-2'];

function convertIToSvg(html) {
  return html.replace(/<i\s+([^>]*?)data-lucide=["']([^"']+)["']([^>]*?)>(.*?)<\/i>/gis, (match, preAttrs, iconName, postAttrs) => {
    // If it's a dynamic template string like ${icon}, don't convert statically
    if (iconName.includes('$') || iconName.includes('{')) {
      return match;
    }

    const allAttrs = (preAttrs + ' ' + postAttrs).trim();
    const key = iconName.toLowerCase().trim();
    const inner = iconMap[key] || iconMap[key.replace(/_/g, '-')] || iconMap[key.replace(/-/g, '')];
    if (!inner) {
      console.warn('Icon not found in map:', iconName);
      return match;
    }

    const styleMatch = allAttrs.match(/style=["']([^"']+)["']/i);
    const classMatch = allAttrs.match(/class=["']([^"']+)["']/i);

    let style = styleMatch ? styleMatch[1] : '';
    let className = classMatch ? classMatch[1] : '';

    let width = '18';
    let height = '18';
    if (style) {
      const wm = style.match(/width\s*:\s*([0-9]+)px/i);
      const hm = style.match(/height\s*:\s*([0-9]+)px/i);
      if (wm) width = wm[1];
      if (hm) height = hm[1];
    } else {
      const wm2 = allAttrs.match(/width=["']?([0-9]+)["']?/i);
      const hm2 = allAttrs.match(/height=["']?([0-9]+)["']?/i);
      if (wm2) width = wm2[1];
      if (hm2) height = hm2[1];
    }

    let classAttr = className ? ` class="${className}"` : '';
    let styleAttr = style ? ` style="${style}"` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${classAttr}${styleAttr}>${inner}</svg>`;
  });
}

const targetFiles = [
  'index.html',
  'gym_owner/index.html',
  'trainer/index.html',
  'fitsync/index.html',
  'fitsync/gym_owner/index.html',
  'fitsync/trainer/index.html'
];

for (const relPath of targetFiles) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Ensure <script src="js/icons.js"></script> is included in <head>
  if (!content.includes('js/icons.js')) {
    content = content.replace(/<\/head>/i, '  <script src="js/icons.js"></script>\n</head>');
  }

  // 2. Fix dashboard welcome date flash of "Loading..."
  if (content.includes('id="dashboardWelcomeDate">Loading...</div>')) {
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    content = content.replace(
      'id="dashboardWelcomeDate">Loading...</div>',
      `id="dashboardWelcomeDate">${todayStr}</div>`
    );
  }

  // 3. Convert all static <i> tags to inline SVGs
  const originalCount = (content.match(/data-lucide=/g) || []).length;
  content = convertIToSvg(content);
  const remainingCount = (content.match(/data-lucide=/g) || []).length;

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Processed ${relPath}: Converted ${originalCount - remainingCount} icons. (Remaining: ${remainingCount})`);
}
