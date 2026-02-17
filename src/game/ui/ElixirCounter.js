import { GlobalState } from '../GlobalState.js';

/**
 * DOM-based elixir counter: [icon] [count]
 */
export class ElixirCounter {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'hud-stats-item';

        // Gem icon
        this.icon = document.createElement('span');
        this.icon.className = 'hud-icon';
        this.icon.textContent = '\u25C6'; // ◆
        this.icon.style.cssText = 'color:#00FFCC;font-size:14px;';

        // Count text
        this.text = document.createElement('span');
        this.text.className = 'hud-value';
        this.text.textContent = '0';
        this.text.style.cssText = 'color:#00FFCC;font-size:16px;';

        this.el.appendChild(this.icon);
        this.el.appendChild(this.text);
    }

    update() {
        this.text.textContent = String(GlobalState.elixir);
    }

    pop() {
        this.el.classList.remove('hud-pop');
        // Force reflow to restart animation
        void this.el.offsetWidth;
        this.el.classList.add('hud-pop');
    }
}
