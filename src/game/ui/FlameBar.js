import { FLAME } from '../constants.js';
import { GlobalState } from '../GlobalState.js';

/**
 * DOM-based flame bar: [icon] [████████░░░░]
 */
export class FlameBar {
    constructor() {
        this.el = document.createElement('div');
        this.el.style.cssText = 'display:flex;align-items:center;gap:4px;width:100%;height:100%;padding:0 2px;';

        // Flame icon
        this.icon = document.createElement('span');
        this.icon.className = 'hud-icon';
        this.icon.textContent = '\u25C6'; // ◆
        this.icon.style.cssText = 'color:#FF6600;font-size:21px;';

        // Bar background
        this.barBg = document.createElement('div');
        this.barBg.className = 'hud-bar-bg';
        this.barBg.style.cssText = 'flex:1;height:21px;';

        // Bar fill
        this.barFill = document.createElement('div');
        this.barFill.className = 'hud-bar-fill';
        this.barFill.style.cssText = 'width:100%;height:100%;background:#FF6600;';

        this.barBg.appendChild(this.barFill);
        this.el.appendChild(this.icon);
        this.el.appendChild(this.barBg);
    }

    update() {
        const pct = GlobalState.flame / GlobalState.maxFlame;
        this.barFill.style.width = `${(pct * 100).toFixed(1)}%`;

        // Color interpolation: orange (#FF6600) at full → red (#FF0000) at empty
        const g = Math.floor(0x66 * pct);
        this.barFill.style.background = `rgb(255, ${g}, 0)`;
        this.icon.style.color = `rgb(255, ${g}, 0)`;

        // Urgency pulse when flame is low
        this.el.classList.toggle('hud-flame-low', pct < 0.2);
    }
}
