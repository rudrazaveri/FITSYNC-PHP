const fs = require('fs');
const lucide = require('../js/lucide.min.js');

// Precise PascalCase to kebab-case (including numbers like Building2 -> building-2)
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

// Build map of kebab-name -> SVG inner HTML
const iconMap = {};
for (const [pascalName, children] of Object.entries(lucide.icons)) {
  const kebab = toKebab(pascalName);
  const svgInner = childrenToSvg(children);
  iconMap[kebab] = svgInner;
  iconMap[pascalName.toLowerCase()] = svgInner;
  // Also store without hyphens just in case
  iconMap[kebab.replace(/-/g, '')] = svgInner;
}

// Manual common aliases
iconMap['buildings'] = iconMap['building-2'] || iconMap['building'];
iconMap['building2'] = iconMap['building-2'];
iconMap['barchart2'] = iconMap['bar-chart-2'];
iconMap['trash2'] = iconMap['trash-2'];
iconMap['checkcircle2'] = iconMap['check-circle-2'];

console.log(`Indexed ${Object.keys(iconMap).length} icon variations.`);

// Generate the standalone js/icons.js file
const outputJs = `/**
 * FitSync AI — Instant Standalone SVG Icon Engine
 * Pure offline, zero-latency vector icon provider.
 * Renders all FitSync interface icons instantly without CDN reliance or DOM delay.
 */
(function() {
  'use strict';

  var SVG_NS = "http://www.w3.org/2000/svg";

  var ICONS = ${JSON.stringify(iconMap, null, 2)};

  /**
   * Return raw SVG string for a given icon name.
   */
  function getIconSvg(name, opts) {
    opts = opts || {};
    var key = (name || '').toLowerCase().trim();
    var inner = ICONS[key] || ICONS[key.replace(/_/g, '-')] || ICONS[key.replace(/-/g, '')] || '';
    if (!inner) {
      console.warn('[FitSync Icons] Unknown icon: "' + name + '"');
      return '<svg width="' + (opts.width || 18) + '" height="' + (opts.height || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (opts.className || '') + '"></svg>';
    }

    var w = opts.width || 24;
    var h = opts.height || 24;
    var cls = opts.className ? ' class="' + opts.className + '"' : '';
    var st = opts.style ? ' style="' + opts.style + '"' : '';
    var sw = opts.strokeWidth || 2;

    return '<svg xmlns="' + SVG_NS + '" width="' + w + '" height="' + h + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"' + cls + st + '>' + inner + '</svg>';
  }

  /**
   * Replace all <i data-lucide="..."> tags in a container with inline SVGs.
   */
  function renderFitSyncIcons(root) {
    root = root || document;
    var elements = root.querySelectorAll ? root.querySelectorAll('[data-lucide]') : [];
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var name = el.getAttribute('data-lucide');
      if (!name) continue;

      var key = name.toLowerCase().trim();
      var inner = ICONS[key] || ICONS[key.replace(/_/g, '-')] || ICONS[key.replace(/-/g, '')];
      if (!inner) continue;

      var existingStyle = el.getAttribute('style') || '';
      var existingClass = el.getAttribute('class') || '';

      var w = el.getAttribute('width') || 24;
      var h = el.getAttribute('height') || 24;
      if (existingStyle) {
        var mw = existingStyle.match(/width\s*:\s*([0-9]+)px/);
        var mh = existingStyle.match(/height\s*:\s*([0-9]+)px/);
        if (mw) w = mw[1];
        if (mh) h = mh[1];
      }

      var svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('xmlns', SVG_NS);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');

      if (existingClass) {
        svg.setAttribute('class', existingClass);
      }
      if (existingStyle) {
        svg.setAttribute('style', existingStyle);
      }

      for (var a = 0; a < el.attributes.length; a++) {
        var attr = el.attributes[a];
        if (attr.name.startsWith('data-') && attr.name !== 'data-lucide') {
          svg.setAttribute(attr.name, attr.value);
        }
      }

      svg.innerHTML = inner;

      if (el.parentNode) {
        el.parentNode.replaceChild(svg, el);
      }
    }
  }

  // Global Exports
  window.FITSYNC_ICONS = ICONS;
  window.getFitSyncSvg = getIconSvg;
  window.getIconSvg = getIconSvg;
  window.renderFitSyncIcons = renderFitSyncIcons;

  // Seamless Lucide Compatibility Bridge
  window.lucide = window.lucide || {};
  var origCreate = window.lucide.createIcons;
  window.lucide.createIcons = function(options) {
    var root = (options && options.root) ? options.root : document;
    renderFitSyncIcons(root);
    if (typeof origCreate === 'function' && origCreate !== window.lucide.createIcons) {
      try { origCreate(options); } catch (e) {}
    }
  };

  // Immediate Execution & Mutation Observer
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    renderFitSyncIcons();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      renderFitSyncIcons();
    });
  }

  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      var needsRender = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.addedNodes && m.addedNodes.length > 0) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var node = m.addedNodes[j];
            if (node.nodeType === 1) {
              if (node.hasAttribute && node.hasAttribute('data-lucide')) {
                needsRender = true;
                break;
              }
              if (node.querySelector && node.querySelector('[data-lucide]')) {
                needsRender = true;
                break;
              }
            }
          }
        }
        if (needsRender) break;
      }
      if (needsRender) {
        renderFitSyncIcons();
      }
    });

    function startObserver() {
      var target = document.body || document.documentElement;
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
      } else {
        setTimeout(startObserver, 20);
      }
    }
    startObserver();
  }
})();
`;

fs.writeFileSync('js/icons.js', outputJs, 'utf8');
console.log('js/icons.js written successfully.');
