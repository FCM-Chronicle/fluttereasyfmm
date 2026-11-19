/* ==========================================================================
   icons.js - 라인 아이콘 (Lucide 스타일, 24x24 stroke) / 모노톤 벡터 아이콘 시스템
   사용:
     createIcon('squad')        → <svg class="ui-icon">...</svg> (DOM Node)
     iconSVG('trophy', 'sm')    → '<svg class="ui-icon sm" ...>...</svg>' (HTML String)
     <span data-icon="trophy"></span> → 자동 SVG 치환
   ========================================================================== */
(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // 요소 정의: [태그, ...속성값]
    const ICONS = {
        squad: [['path', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'], ['circle', 9, 7, 4], ['path', 'M22 21v-2a4 4 0 0 0-3-3.87'], ['path', 'M16 3.13a4 4 0 0 1 0 7.75']],
        stadium: [['path', 'M2 10c0-3.31 4.48-6 10-6s10 2.69 10 6v4c0 3.31-4.48 6-10 6s-10-2.69-10-6v-4z'], ['ellipse', 12, 10, 6, 2], ['line', 12, 12, 12, 20]],
        match: [['path', 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'], ['line', 4, 22, 4, 15]],
        league: [['line', 12, 20, 12, 10], ['line', 18, 20, 18, 4], ['line', 6, 20, 6, 16]],
        tactics: [['rect', 8, 2, 8, 4, 1], ['path', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'], ['path', 'M9 12h6'], ['path', 'M9 16h4']],
        transfer: [['path', 'M8 3 4 7l4 4'], ['path', 'M4 7h16'], ['path', 'm16 21 4-4-4-4'], ['path', 'M20 17H4']],
        growth: [['polyline', '22 7 13.5 15.5 8.5 10.5 2 17'], ['polyline', '16 7 22 7 22 13']],
        transfer_news: [['path', 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2'], ['path', 'M18 14h-8'], ['path', 'M15 18h-5'], ['path', 'M10 6h8v4h-8V6Z']],
        finance: [['line', 3, 22, 21, 22], ['line', 6, 18, 6, 11], ['line', 10, 18, 10, 11], ['line', 14, 18, 14, 11], ['line', 18, 18, 18, 11], ['polygon', '12 2 20 7 4 7']],
        sponsor: [['circle', 12, 8, 6], ['path', 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11']],
        records: [['path', 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6'], ['path', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18'], ['path', 'M4 22h16'], ['path', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'], ['path', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'], ['path', 'M18 2H6v7a6 6 0 0 0 12 0V2Z']],
        youth: [['path', 'M7 20h10'], ['path', 'M10 20c5.5-2.5.8-6.4 3-10'], ['path', 'M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z'], ['path', 'M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z']],
        sns: [['circle', 12, 12, 4], ['path', 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8']],
        mail: [['rect', 2, 4, 20, 16, 2], ['path', 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7']],
        chat: [['path', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']],
        settings: [['line', 21, 4, 14, 4], ['line', 10, 4, 3, 4], ['line', 21, 12, 12, 12], ['line', 8, 12, 3, 12], ['line', 21, 20, 16, 20], ['line', 12, 20, 3, 20], ['line', 14, 2, 14, 6], ['line', 8, 10, 8, 14], ['line', 16, 18, 16, 22]],
        trophy: [['path', 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6'], ['path', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18'], ['path', 'M4 22h16'], ['path', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'], ['path', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'], ['path', 'M18 2H6v7a6 6 0 0 0 12 0V2Z']],
        facup: [['path', 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6'], ['path', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18'], ['path', 'M4 22h16'], ['path', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'], ['path', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'], ['path', 'M18 2H6v7a6 6 0 0 0 12 0V2Z']],
        crown: [['path', 'm2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14']],
        zap: [['polygon', '13 2 3 14 12 14 11 22 21 10 12 10 13 2']],
        sparkles: [['path', 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z'], ['path', 'M5 3v4'], ['path', 'M3 5h4']],
        star: [['polygon', '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2']],
        shield: [['path', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']],
        target: [['circle', 12, 12, 10], ['circle', 12, 12, 6], ['circle', 12, 12, 2]],
        user: [['path', 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'], ['circle', 12, 7, 4]],
        briefcase: [['rect', 2, 7, 20, 14, 2], ['path', 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16']],
        folder: [['path', 'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z']],
        save: [['path', 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'], ['polyline', '17 21 17 13 7 13 7 21'], ['polyline', '7 3 7 8 15 8']],
        trash: [['path', 'M3 6h18'], ['path', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'], ['path', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2']],
        lightbulb: [['path', 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'], ['path', 'M9 18h6'], ['path', 'M10 22h4']],
        clapperboard: [['path', 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z'], ['path', 'm6.2 5.3 3.1 3.9'], ['path', 'm12.4 3.4 3.1 4'], ['path', 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z']],
        rocket: [['path', 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'], ['path', 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'], ['path', 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0'], ['path', 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5']],
        palette: [['circle', 13.5, 6.5, 0.5], ['circle', 17.5, 10.5, 0.5], ['circle', 8.5, 7.5, 0.5], ['circle', 6.5, 12.5, 0.5], ['path', 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z']],
        flame: [['path', 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z']],
        globe: [['circle', 12, 12, 10], ['line', 2, 12, 22, 12], ['path', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z']],
        handshake: [['path', 'm11 17 2 2a1 1 0 1 0 3-3'], ['path', 'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4'], ['path', 'm21 3 1 11h-2'], ['path', 'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3'], ['path', 'M3 4h8']],
        check: [['polyline', '20 6 9 17 4 12']],
        alert: [['path', 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'], ['line', 12, 9, 12, 13], ['line', 12, 17, 12.01, 17]],
        arrow_down: [['line', 12, 5, 12, 19], ['polyline', '19 12 12 19 5 12']],
        arrow_right: [['line', 5, 12, 19, 12], ['polyline', '12 5 19 12 12 19']],
        arrow_left: [['line', 19, 12, 5, 12], ['polyline', '12 19 5 12 12 5']],
        refresh: [['path', 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'], ['path', 'M21 3v5h-5'], ['path', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'], ['path', 'M8 16H3v5']],
        music: [['path', 'M9 18V5l12-2v13'], ['circle', 6, 18, 3], ['circle', 18, 16, 3]],
        lock: [['rect', 3, 11, 18, 11, 2], ['path', 'M7 11V7a5 5 0 0 1 10 0v4']],
        camera: [['path', 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'], ['circle', 12, 13, 3]],
        heart: [['path', 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z']],
        search: [['circle', 11, 11, 8], ['line', 21, 21, 16.65, 16.65]],
        calendar: [['rect', 3, 4, 18, 18, 2], ['line', 16, 2, 16, 6], ['line', 8, 2, 8, 6], ['line', 3, 10, 21, 10]],
        award: [['circle', 12, 8, 6], ['path', 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11']],
        coins: [['circle', 8, 8, 6], ['path', 'M18.09 10.37A6 6 0 1 1 10.34 18'], ['path', 'M7 6h1v4'], ['path', 'm16.71 13.88.7.71-2.82 2.82']]
    };

    // 탭 id 별칭 (월드컵 모드에서 transfer 버튼이 callup 으로 바뀜)
    const ALIAS = {
        callup: 'transfer',
        clipboard: 'tactics',
        chart: 'league',
        trending: 'growth',
        megaphone: 'sponsor',
        newspaper: 'transfer_news',
        users: 'squad',
        flag: 'match',
        seedling: 'youth'
    };

    const ATTRS = {
        path: ['d'],
        polyline: ['points'],
        polygon: ['points'],
        circle: ['cx', 'cy', 'r'],
        ellipse: ['cx', 'cy', 'rx', 'ry'],
        line: ['x1', 'y1', 'x2', 'y2'],
        rect: ['x', 'y', 'width', 'height', 'rx']
    };

    function createIcon(name, extraClass) {
        const def = ICONS[ALIAS[name] || name] || ICONS.sparkles;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('class', extraClass ? `ui-icon ${extraClass}` : 'ui-icon');
        svg.setAttribute('aria-hidden', 'true');
        if (!def) return svg;
        def.forEach(([tag, ...vals]) => {
            const el = document.createElementNS(SVG_NS, tag);
            const attrs = ATTRS[tag];
            if (attrs) {
                attrs.forEach((attr, i) => {
                    if (vals[i] !== undefined) el.setAttribute(attr, vals[i]);
                });
            }
            svg.appendChild(el);
        });
        return svg;
    }

    function iconSVG(name, extraClass) {
        const def = ICONS[ALIAS[name] || name] || ICONS.sparkles;
        const cls = extraClass ? `ui-icon ${extraClass}` : 'ui-icon';
        if (!def) return `<svg viewBox="0 0 24 24" class="${cls}"aria-hidden="true"></svg>`;
        const children = def.map(([tag, ...vals]) => {
            const attrs = ATTRS[tag]
                .map((attr, i) => (vals[i] !== undefined ? `${attr}="${vals[i]}"` : ''))
                .filter(Boolean)
                .join(' ');
            return `<${tag} ${attrs}></${tag}>`;
        }).join('');
        return `<svg viewBox="0 0 24 24" class="${cls}"aria-hidden="true">${children}</svg>`;
    }

    function hydrateIcons(root = document) {
        root.querySelectorAll('[data-icon]').forEach(holder => {
            const iconName = holder.getAttribute('data-icon');
            const extraCls = holder.getAttribute('data-icon-class') || '';
            if (iconName) {
                holder.replaceChildren(createIcon(iconName, extraCls));
            }
        });
    }

    // 사이드바 탭 버튼에 아이콘 채우기
    function fillTabIcons() {
        document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
            const holder = btn.querySelector('.tab-ico');
            if (holder) holder.replaceChildren(createIcon(btn.dataset.tab));
        });
        hydrateIcons(document);
    }

    window.createIcon = createIcon;
    window.iconSVG = iconSVG;
    window.hydrateIcons = hydrateIcons;
    window.fillTabIcons = fillTabIcons;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fillTabIcons);
    } else {
        fillTabIcons();
    }
})();
