import { FlameBar } from './FlameBar.js';
import { ElixirCounter } from './ElixirCounter.js';
import { UIWindow } from './UIWindow.js';
import { Settings } from '../systems/Settings.js';
import { LORE_SCROLL, WINDOW_DEFS } from '../constants.js';
import { SkillManager } from '../systems/SkillManager.js';
import { AchievementManager } from '../systems/AchievementManager.js';

const HIGHSCORE_KEY = 'elixirs-shadow-highscore';

export class HUD {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.scale;
        const pos = Settings.data.windows;

        // ─── DOM-based draggable windows ───
        this.windows = {};

        // --- Flame window ---
        this.flameBar = new FlameBar();
        this.windows.flame = new UIWindow({
            id: 'flame',
            x: pos.flame.x, y: pos.flame.y,
            w: WINDOW_DEFS.flame.w, h: WINDOW_DEFS.flame.h
        });
        this.windows.flame.add(this.flameBar.el);

        // --- Cooldowns window ---
        this.windows.cooldowns = new UIWindow({
            id: 'cooldowns',
            x: pos.cooldowns.x, y: pos.cooldowns.y,
            w: WINDOW_DEFS.cooldowns.w, h: WINDOW_DEFS.cooldowns.h
        });

        const cdContainer = document.createElement('div');
        cdContainer.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;height:100%;padding:0 2px;';

        // SHIFT dash cooldown
        this._dashGroup = this._createCooldownBar('SHIFT', '#FFCC00');
        cdContainer.appendChild(this._dashGroup.el);

        // E flame burst cooldown
        this._burstGroup = this._createCooldownBar('E', '#FF6600');
        cdContainer.appendChild(this._burstGroup.el);

        // Q class attack cooldown (hidden until class chosen)
        this._classGroup = this._createCooldownBar('Q', '#FF4444');
        this._classGroup.el.style.display = 'none';

        // Class attack name label
        this._classNameLabel = document.createElement('span');
        this._classNameLabel.className = 'hud-label';
        this._classNameLabel.style.cssText = 'color:#FFCC00;font-size:10px;font-weight:bold;display:none;';

        cdContainer.appendChild(this._classGroup.el);
        cdContainer.appendChild(this._classNameLabel);
        this.windows.cooldowns.add(cdContainer);

        // --- Stats window ---
        this.windows.stats = new UIWindow({
            id: 'stats',
            x: pos.stats.x, y: pos.stats.y,
            w: WINDOW_DEFS.stats.w, h: WINDOW_DEFS.stats.h
        });

        const statsContainer = document.createElement('div');
        statsContainer.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;padding:2px;';

        // Top row: elixir + level
        const statsRow1 = document.createElement('div');
        statsRow1.className = 'hud-stats-row';

        this.elixirCounter = new ElixirCounter();
        statsRow1.appendChild(this.elixirCounter.el);

        this._levelText = document.createElement('span');
        this._levelText.className = 'hud-value';
        this._levelText.textContent = 'Lv.0';
        this._levelText.style.cssText = 'color:#FFCC00;font-size:14px;';
        statsRow1.appendChild(this._levelText);

        // Bottom row: scroll icon + count
        const statsRow2 = document.createElement('div');
        statsRow2.className = 'hud-stats-row';

        const scrollItem = document.createElement('div');
        scrollItem.className = 'hud-stats-item';
        this._scrollIcon = document.createElement('span');
        this._scrollIcon.className = 'hud-icon';
        this._scrollIcon.textContent = '\u25A3'; // ▣
        this._scrollIcon.style.cssText = 'color:#E8D8B0;font-size:12px;';
        this._scrollText = document.createElement('span');
        this._scrollText.className = 'hud-value';
        this._scrollText.textContent = '0';
        this._scrollText.style.cssText = 'color:#E8D8B0;font-size:12px;';
        scrollItem.appendChild(this._scrollIcon);
        scrollItem.appendChild(this._scrollText);
        statsRow2.appendChild(scrollItem);

        this.scrollCount = 0;

        statsContainer.appendChild(statsRow1);
        statsContainer.appendChild(statsRow2);
        this.windows.stats.add(statsContainer);

        // --- Distance window ---
        this.windows.distance = new UIWindow({
            id: 'distance',
            x: pos.distance.x, y: pos.distance.y,
            w: WINDOW_DEFS.distance.w, h: WINDOW_DEFS.distance.h
        });

        this._distText = document.createElement('span');
        this._distText.className = 'hud-value';
        this._distText.textContent = '0m';
        this._distText.style.cssText = 'color:#999;font-size:13px;width:100%;text-align:center;';
        this.windows.distance.add(this._distText);

        // ─── Transient Phaser overlays (stay in-canvas) ───
        const u = (sx, sy) => this._uiXY(sx, sy);

        const wt = u(width / 2, 60);
        this.warningText = scene.add.text(wt.x, wt.y, 'IN THE SHROUD!', {
            fontSize: '18px', color: '#FF0000', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
        this._warningTween = null;

        // Lore Scroll overlay
        const lo = u(width / 2, height - 80);
        this.loreBg = scene.add.rectangle(lo.x, lo.y, 700, 60, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(180).setVisible(false);
        this.loreBorder = scene.add.rectangle(lo.x, lo.y, 704, 64, 0xD4A04A)
            .setScrollFactor(0).setDepth(179).setVisible(false).setFillStyle(0x000000, 0);
        this.loreBorder.setStrokeStyle(1, 0xD4A04A);

        const lq = u(width / 2, height - 88);
        this.loreQuote = scene.add.text(lq.x, lq.y, '', {
            fontSize: '12px', color: '#CCCCCC', fontFamily: 'monospace',
            wordWrap: { width: 680 }, align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(181).setVisible(false);

        const la = u(width / 2, height - 62);
        this.loreAuthor = scene.add.text(la.x, la.y, '', {
            fontSize: '11px', color: '#D4A04A', fontFamily: 'monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(181).setVisible(false);

        this.loreTimer = null;

        // Game over overlay — elements created dynamically in showGameOver
        this._gameOverElements = [];

        // Controls hint
        const ch = u(width / 2, height - 20);
        this.controlsHint = scene.add.text(ch.x, ch.y,
            '[WASD] Move  [SPACE] Jump  [SHIFT] Dash  [S] Slam  [E] Burst  [Q] Class  [ESC] Pause  Stand on Wells to mine', {
            fontSize: '12px', color: '#AAAAAA', fontFamily: 'monospace',
            backgroundColor: '#00000088', padding: { x: 12, y: 4 },
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(1);

        scene.time.delayedCall(8000, () => {
            scene.tweens.add({
                targets: this.controlsHint,
                alpha: 0.3,
                duration: 1500
            });
        });

        // ─── Scene shutdown cleanup ───
        scene.events.once('shutdown', () => this.destroy());
    }

    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    // ─── Helper: create a cooldown bar group (label + bar) ───

    _createCooldownBar(label, readyColor) {
        const el = document.createElement('div');
        el.className = 'hud-cd-group';

        const labelEl = document.createElement('span');
        labelEl.className = 'hud-label';
        labelEl.textContent = label;
        labelEl.style.fontSize = '9px';

        const barBg = document.createElement('div');
        barBg.className = 'hud-bar-bg';
        barBg.style.cssText = 'width:58px;height:10px;';

        const barFill = document.createElement('div');
        barFill.className = 'hud-bar-fill';
        barFill.style.cssText = `width:0%;height:100%;background:${readyColor};`;

        barBg.appendChild(barFill);
        el.appendChild(labelEl);
        el.appendChild(barBg);

        return { el, barFill, readyColor };
    }

    // ─── Public: reposition all windows from Settings ───

    repositionAllWindows() {
        const pos = Settings.data.windows;
        for (const [id, win] of Object.entries(this.windows)) {
            win.screenX = pos[id].x;
            win.screenY = pos[id].y;
            win.el.style.left = `${pos[id].x}px`;
            win.el.style.top = `${pos[id].y}px`;
        }
    }

    // ─── Update ───

    update(player, distanceMeters) {
        this.flameBar.update();
        this.elixirCounter.update();

        if (player) {
            // SHIFT dash cooldown
            const dashPct = player.dashCooldownPct;
            this._dashGroup.barFill.style.width = `${(dashPct * 100).toFixed(1)}%`;
            this._dashGroup.barFill.style.background = dashPct >= 1 ? '#FFCC00' : '#444';

            // E flame burst cooldown
            const burstPct = player.flameBurstCooldownPct;
            this._burstGroup.barFill.style.width = `${(burstPct * 100).toFixed(1)}%`;
            this._burstGroup.barFill.style.background = burstPct >= 1 ? '#FF6600' : '#444';

            // Q class attack cooldown
            if (SkillManager.hasClassAttack()) {
                const classPct = player.classAttackCooldownPct;
                this._classGroup.barFill.style.width = `${(classPct * 100).toFixed(1)}%`;
                this._classGroup.barFill.style.background = classPct >= 1 ? '#FF4444' : '#444';
            }
        }

        if (distanceMeters !== undefined) {
            this._distText.textContent = `${Math.floor(distanceMeters)}m`;
        }
    }

    showShroudWarning(visible) {
        if (visible && !this.warningText.visible) {
            this.warningText.setVisible(true).setAlpha(1).setScale(1);
            this._warningTween = this.scene.tweens.add({
                targets: this.warningText,
                alpha: { from: 1, to: 0.3 },
                scaleX: { from: 1, to: 1.1 },
                scaleY: { from: 1, to: 1.1 },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (!visible && this.warningText.visible) {
            if (this._warningTween) {
                this._warningTween.destroy();
                this._warningTween = null;
            }
            this.warningText.setVisible(false).setAlpha(1).setScale(1);
        }
    }

    showLoreScroll(entry) {
        this.scrollCount++;
        this._scrollText.textContent = String(this.scrollCount);

        // Pop animation on scroll icon
        this._scrollIcon.classList.remove('hud-pop');
        void this._scrollIcon.offsetWidth;
        this._scrollIcon.classList.add('hud-pop');

        this.loreQuote.setText(`"${entry.text}"`);
        this.loreAuthor.setText(`\u2014 ${entry.author}`);
        this.loreBg.setVisible(true);
        this.loreBorder.setVisible(true);
        this.loreQuote.setVisible(true);
        this.loreAuthor.setVisible(true);

        if (this.loreTimer) this.loreTimer.destroy();
        this.loreTimer = this.scene.time.delayedCall(LORE_SCROLL.DISPLAY_DURATION, () => {
            this.scene.tweens.add({
                targets: [this.loreBg, this.loreBorder, this.loreQuote, this.loreAuthor],
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    this.loreBg.setVisible(false).setAlpha(1);
                    this.loreBorder.setVisible(false).setAlpha(1);
                    this.loreQuote.setVisible(false).setAlpha(1);
                    this.loreAuthor.setVisible(false).setAlpha(1);
                }
            });
        });
    }

    showGameOver(elixir, distance, scrolls, runStats) {
        const scene = this.scene;
        const { width, height } = scene.scale;
        const u = (sx, sy) => this._uiXY(sx, sy);
        const d = 201;

        // High score
        let bestDist = 0;
        try { bestDist = parseFloat(localStorage.getItem(HIGHSCORE_KEY)) || 0; } catch {}
        const dist = Math.floor(distance);
        const isNewBest = dist > bestDist;
        if (isNewBest) {
            try { localStorage.setItem(HIGHSCORE_KEY, String(dist)); } catch {}
            bestDist = dist;
        }

        // Dark backdrop
        const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
            .setScrollFactor(0).setDepth(200);
        scene.tweens.add({ targets: bg, fillAlpha: 0.8, duration: 800 });
        this._gameOverElements.push(bg);

        const _t = (sx, sy, text, style) => {
            const p = u(sx, sy);
            const t = scene.add.text(p.x, p.y, text, {
                fontFamily: 'monospace', ...style
            }).setOrigin(0.5).setScrollFactor(0).setDepth(d).setAlpha(0);
            this._gameOverElements.push(t);
            return t;
        };
        const _tl = (sx, sy, text, style) => {
            const p = u(sx, sy);
            const t = scene.add.text(p.x, p.y, text, {
                fontFamily: 'monospace', ...style
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d).setAlpha(0);
            this._gameOverElements.push(t);
            return t;
        };
        const _tr = (sx, sy, text, style) => {
            const p = u(sx, sy);
            const t = scene.add.text(p.x, p.y, text, {
                fontFamily: 'monospace', ...style
            }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(d).setAlpha(0);
            this._gameOverElements.push(t);
            return t;
        };

        // Header
        const header = _t(width / 2, height * 0.12, 'THE SHROUD CLAIMS ALL', {
            fontSize: '28px', color: '#00BFFF', fontStyle: 'bold'
        });
        const lore = _t(width / 2, height * 0.18, '"The Flame watches over the fallen land..."', {
            fontSize: '11px', color: '#666666', fontStyle: 'italic'
        });

        // Divider
        const divP = u(width / 2, height * 0.23);
        const div1 = scene.add.rectangle(divP.x, divP.y, 360, 1, 0x444444)
            .setScrollFactor(0).setDepth(d).setAlpha(0);
        this._gameOverElements.push(div1);

        // Best distance
        const bestColor = isNewBest ? '#FFCC00' : '#888888';
        const bestLabel = isNewBest ? `NEW BEST!  ${dist}m` : `Best: ${Math.floor(bestDist)}m`;
        const best = _t(width / 2, height * 0.27, bestLabel, {
            fontSize: isNewBest ? '16px' : '13px', color: bestColor, fontStyle: isNewBest ? 'bold' : ''
        });

        // Stats — two columns
        const lx = width / 2 - 140;
        const rx = width / 2 + 140;
        const sy = height * 0.33;
        const lineH = 22;
        const stats = runStats || {};
        const survMin = Math.floor((stats.survivalTime || 0) / 60);
        const survSec = Math.floor((stats.survivalTime || 0) % 60);

        const rows = [
            ['Distance',        `${dist}m`,                     'Enemies Banished', `${stats.enemiesBanished || 0}`],
            ['Survival Time',   `${survMin}:${String(survSec).padStart(2, '0')}`, 'Max Combo',        `x${stats.maxCombo || 0}`],
            ['Elixir Mined',    `${stats.elixirMined || 0}`,    'Wisps Collected',  `${stats.wispsCollected || 0}`],
            ['Skills Acquired', `${stats.skillsAcquired || 0}`, 'Lore Found',       `${stats.loreScrollsFound || 0}`],
            ['Ground Slams',    `${stats.slamCount || 0}`,      'Wall Jumps',       `${stats.wallJumpCount || 0}`],
        ];

        for (let i = 0; i < rows.length; i++) {
            const [lLabel, lVal, rLabel, rVal] = rows[i];
            _tl(lx, sy + i * lineH, lLabel, { fontSize: '12px', color: '#888888' });
            _tr(width / 2 - 10, sy + i * lineH, lVal, { fontSize: '12px', color: '#DDDDDD' });
            _tl(width / 2 + 10, sy + i * lineH, rLabel, { fontSize: '12px', color: '#888888' });
            _tr(rx, sy + i * lineH, rVal, { fontSize: '12px', color: '#DDDDDD' });
        }

        // Divider 2
        const div2P = u(width / 2, sy + rows.length * lineH + 8);
        const div2 = scene.add.rectangle(div2P.x, div2P.y, 360, 1, 0x444444)
            .setScrollFactor(0).setDepth(d).setAlpha(0);
        this._gameOverElements.push(div2);

        // Achievements summary
        const achY = sy + rows.length * lineH + 24;
        const achCount = AchievementManager.getUnlockedCount();
        const achTotal = AchievementManager.getTotalCount();
        _t(width / 2, achY, `Achievements: ${achCount} / ${achTotal}`, {
            fontSize: '13px', color: '#FFCC00'
        });

        // Restart prompt
        const restart = _t(width / 2, height * 0.88, 'Press SPACE to awaken again', {
            fontSize: '14px', color: '#D4A04A'
        });

        // Fade everything in with stagger
        const allEls = this._gameOverElements;
        for (let i = 0; i < allEls.length; i++) {
            scene.tweens.add({
                targets: allEls[i],
                alpha: 1,
                duration: 400,
                delay: 200 + i * 40,
                ease: 'Power2'
            });
        }

        // Pulse restart text
        scene.time.delayedCall(800, () => {
            if (restart.active) {
                scene.tweens.add({
                    targets: restart,
                    alpha: { from: 1, to: 0.3 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }

    updateSkills() {
        this._levelText.textContent = `Lv.${SkillManager.level}`;

        if (SkillManager.hasClassAttack()) {
            const cls = SkillManager.activeClass;
            this._classGroup.el.style.display = '';
            this._classNameLabel.style.display = '';
            this._classNameLabel.textContent = cls.attackName;
        } else {
            this._classGroup.el.style.display = 'none';
            this._classNameLabel.style.display = 'none';
        }
    }

    popElixir() {
        this.elixirCounter.pop();
    }

    // ─── Cleanup DOM on scene shutdown/restart ───

    destroy() {
        for (const win of Object.values(this.windows)) {
            win.destroy();
        }
    }
}
