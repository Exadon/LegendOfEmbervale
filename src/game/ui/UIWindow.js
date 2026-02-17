import { Settings } from '../systems/Settings.js';

/**
 * DOM-based draggable HUD window.
 * Appended to #hud-layer, lives outside the Phaser canvas.
 */
export class UIWindow {
    constructor({ id, x, y, w, h }) {
        this.id = id;
        this.w = w;
        this.h = h;
        this.screenX = x;
        this.screenY = y;

        // Create DOM element
        this.el = document.createElement('div');
        this.el.className = 'hud-window';
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
        this.el.style.width = `${w}px`;
        this.el.style.height = `${h}px`;

        // Append to hud-layer
        const layer = document.getElementById('hud-layer');
        if (layer) layer.appendChild(this.el);

        // Drag state
        this._dragging = false;
        this._dragOffX = 0;
        this._dragOffY = 0;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this.el.addEventListener('mousedown', this._onMouseDown);
    }

    /** Append an HTML element as a child of this window. Returns self for chaining. */
    add(element) {
        this.el.appendChild(element);
        return this;
    }

    /** Move window to (sx, sy) with grid snap + clamping, persist to Settings. */
    moveTo(sx, sy) {
        // Grid snap
        if (Settings.data.gridSnap) {
            const gs = Settings.data.gridSize;
            sx = Math.round(sx / gs) * gs;
            sy = Math.round(sy / gs) * gs;
        }

        // Clamp: allow partial overflow but keep at least 20px visible
        const layer = document.getElementById('hud-layer');
        const maxW = layer ? layer.clientWidth : 960;
        const maxH = layer ? layer.clientHeight : 600;
        sx = Math.max(-this.w + 20, Math.min(sx, maxW - 20));
        sy = Math.max(-this.h + 20, Math.min(sy, maxH - 20));

        this.screenX = sx;
        this.screenY = sy;
        this.el.style.left = `${sx}px`;
        this.el.style.top = `${sy}px`;
        Settings.setWindowPos(this.id, sx, sy);
    }

    /** Remove the DOM element entirely. */
    destroy() {
        this.el.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    // ─── Drag handlers ───

    _onMouseDown(e) {
        if (e.button !== 0) return;
        this._dragging = true;
        this._dragOffX = e.clientX - this.el.getBoundingClientRect().left;
        this._dragOffY = e.clientY - this.el.getBoundingClientRect().top;
        this.el.classList.add('dragging');
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        e.preventDefault();
    }

    _onMouseMove(e) {
        if (!this._dragging) return;
        // Convert client coords to hud-layer-relative coords
        const layer = document.getElementById('hud-layer');
        if (!layer) return;
        const rect = layer.getBoundingClientRect();
        const sx = e.clientX - rect.left - this._dragOffX;
        const sy = e.clientY - rect.top - this._dragOffY;
        this.moveTo(sx, sy);
    }

    _onMouseUp() {
        if (!this._dragging) return;
        this._dragging = false;
        this.el.classList.remove('dragging');
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }
}
