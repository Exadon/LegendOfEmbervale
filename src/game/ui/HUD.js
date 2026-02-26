import { FlameBar } from './FlameBar.js';
import { ElixirCounter } from './ElixirCounter.js';
import { LORE_SCROLL, WORLD, BIOMES, PROGRESSION_BAR, DIFFICULTIES, LORE_ENTRIES, FLAME_STEP } from '../constants.js';
import { SkillManager } from '../systems/SkillManager.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { FlameAltar } from '../systems/FlameAltar.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { CLASS_MASTERIES } from '../systems/ClassMasteries.js';
import { DailyRun } from '../systems/DailyRun.js';
import { GlobalState } from '../GlobalState.js';
import { Settings } from '../systems/Settings.js';

const HIGHSCORE_KEY = 'elixirs-shadow-highscore';

export class HUD {
    constructor(scene) {
        this.scene = scene;
        const { width, height } = scene.scale;

        // ─── DOM-based fixed top bar ───
        this._bar = document.createElement('div');
        this._bar.id = 'hud-bar';

        const layer = document.getElementById('hud-layer');
        if (layer) layer.appendChild(this._bar);

        // ─── Shared ability tooltip (reuses relic tooltip pattern) ───
        this._abilityTooltip = document.createElement('div');
        this._abilityTooltip.style.cssText =
            'position:fixed;display:none;background:#121222;border:1px solid #446688;' +
            'padding:6px 10px;color:#CCDDEE;font-family:monospace;font-size:11px;' +
            'z-index:1000;pointer-events:none;max-width:260px;line-height:1.6;border-radius:4px;';
        document.body.appendChild(this._abilityTooltip);

        // === Section 1: Cooldowns ===
        const cdSection = this._makeSection();
        cdSection.classList.add('hud-section-cooldowns');

        // SHIFT dash cooldown
        this._dashGroup = this._createCooldownBar('[SHIFT] - Flame Step', '#FFCC00');
        cdSection.appendChild(this._dashGroup.el);
        this._wireAbilityTooltip(this._dashGroup.el, () => {
            const cd = (FLAME_STEP.COOLDOWN / 1000).toFixed(1);
            return `<b style="color:#FFCC00">Flame Step</b>` +
                   `<span style="color:#777;font-size:10px"> · ${cd}s cooldown</span><br>` +
                   `Dash forward, becoming invincible for 200ms. Passes through enemies.`;
        });

        // E flame burst cooldown
        this._burstGroup = this._createCooldownBar('[E] - ' + this._getEAbilityName(), '#FF6600');
        cdSection.appendChild(this._burstGroup.el);
        this._wireAbilityTooltip(this._burstGroup.el, () => {
            const cls = SkillManager.activeClass;
            if (!cls || !cls.eAbility) return '<b>[E] Ability</b>';
            const cd = (cls.eAbility.cooldown / 1000).toFixed(1);
            return `<b style="color:#FF6600">${this._getEAbilityName()}</b>` +
                   `<span style="color:#777;font-size:10px"> · ${cd}s cooldown</span><br>` +
                   `${cls.eAbility.desc}<br>` +
                   `<span style="color:#AAFFAA;font-size:10px">&#9889; Primes Q!</span>`;
        });

        // Q class attack cooldown
        const qName = SkillManager.hasClassAttack() ? SkillManager.activeClass.attackName : 'Class Attack';
        this._classGroup = this._createCooldownBar(`[Q] - ${qName}`, '#FF4444');
        if (!SkillManager.hasClassAttack()) {
            this._classGroup.el.style.display = 'none';
        }

        // S1b: Primed countdown span (shows remaining time on primed window)
        const primedEl = document.createElement('span');
        primedEl.id = 'q-primed-timer';
        primedEl.style.cssText = 'display:none;color:#FFD700;font-size:10px;margin-left:6px';
        this._classGroup.el.appendChild(primedEl);
        this._qPrimedTimerEl = primedEl;

        cdSection.appendChild(this._classGroup.el);
        this._wireAbilityTooltip(this._classGroup.el, () => {
            const cls = SkillManager.activeClass;
            if (!cls) return '<b>[Q] Class Attack</b>';
            const cd = (cls.attackCooldown / 1000).toFixed(1);
            return `<b style="color:#FF4444">${cls.attackName}</b>` +
                   `<span style="color:#777;font-size:10px"> · ${cd}s cooldown</span><br>` +
                   `${cls.attackDesc}`;
        });

        // S class ability cooldown
        const sName = this._getSAbilityName();
        this._sAbilityGroup = this._createCooldownBar(`[S] - ${sName}`, '#44AAFF');
        cdSection.appendChild(this._sAbilityGroup.el);
        this._wireAbilityTooltip(this._sAbilityGroup.el, () => {
            const cls = SkillManager.activeClass;
            if (!cls || !cls.sAbility) return '<b>[S] Ability</b>';
            const cd = (cls.sAbility.cooldown / 1000).toFixed(1);
            return `<b style="color:#44AAFF">${this._getSAbilityName()}</b>` +
                   `<span style="color:#777;font-size:10px"> · ${cd}s cooldown</span><br>` +
                   `${cls.sAbility.desc}<br>` +
                   `<span style="color:#AAFFAA;font-size:10px">&#9889; Primes Q!</span>`;
        });

        // Active buff indicator
        this._buffGroup = document.createElement('div');
        this._buffGroup.className = 'hud-cd-group';
        this._buffGroup.style.display = 'none';

        const buffLabel = document.createElement('span');
        buffLabel.className = 'hud-label';
        buffLabel.style.fontSize = '13px';
        this._buffLabel = buffLabel;

        const buffBarBg = document.createElement('div');
        buffBarBg.className = 'hud-bar-bg';
        buffBarBg.style.cssText = 'width:87px;height:15px;';

        this._buffFill = document.createElement('div');
        this._buffFill.className = 'hud-bar-fill';
        this._buffFill.style.cssText = 'width:100%;height:100%;background:#44FF44;';

        buffBarBg.appendChild(this._buffFill);
        this._buffGroup.appendChild(buffLabel);
        this._buffGroup.appendChild(buffBarBg);
        cdSection.appendChild(this._buffGroup);

        // Passive class label
        this._passiveTag = document.createElement('div');
        this._passiveTag.style.cssText = 'font-size:9px;color:#99DDAA;font-family:monospace;opacity:0.75;padding:2px 0 0;line-height:1.3;max-width:140px;display:none;';
        this._passiveTag.textContent = '';
        cdSection.appendChild(this._passiveTag);
        this._wireAbilityTooltip(this._passiveTag, () => {
            const cls = SkillManager.activeClass;
            if (!cls || !cls.passive) return '<b>Passive</b>';
            const name = cls.passive.id.replace(/_/g, ' ');
            return `<b style="color:#99DDAA">Passive: ${name}</b><br>${cls.passive.description}`;
        });

        this._bar.appendChild(cdSection);
        this._bar.appendChild(this._makeSeparator());

        // === Section 2: Flame bar + corruption ===
        const flameSection = this._makeSection();
        flameSection.classList.add('hud-section-flame');
        flameSection.style.flexDirection = 'column';
        flameSection.style.gap = '1px';
        flameSection.style.justifyContent = 'center';

        this.flameBar = new FlameBar();
        flameSection.appendChild(this.flameBar.el);

        // Corruption bar (hidden when 0)
        this._corruptBarWrap = document.createElement('div');
        this._corruptBarWrap.style.cssText = 'display:none;align-items:center;gap:4px;width:100%;padding:0 2px;';
        const corruptIcon = document.createElement('span');
        corruptIcon.className = 'hud-icon';
        corruptIcon.textContent = '\u2623'; // ☣
        corruptIcon.style.cssText = 'color:#9933FF;font-size:15px;';
        const corruptBg = document.createElement('div');
        corruptBg.className = 'hud-bar-bg';
        corruptBg.style.cssText = 'flex:1;height:12px;';
        this._corruptFill = document.createElement('div');
        this._corruptFill.className = 'hud-bar-fill';
        this._corruptFill.style.cssText = 'width:0%;height:100%;background:#9933FF;';
        corruptBg.appendChild(this._corruptFill);
        this._corruptBarWrap.appendChild(corruptIcon);
        this._corruptBarWrap.appendChild(corruptBg);
        flameSection.appendChild(this._corruptBarWrap);

        // Drain rate label
        this._drainRateLabel = document.createElement('span');
        this._drainRateLabel.style.cssText = 'font-size:9px;color:#FF6644;font-family:monospace;opacity:0.8;align-self:flex-end;padding:0 3px 1px;line-height:1;';
        this._drainRateLabel.textContent = '';
        flameSection.appendChild(this._drainRateLabel);

        this._bar.appendChild(flameSection);
        this._bar.appendChild(this._makeSeparator());

        // === Section 3: Stats (elixir, level, scrolls, relics) ===
        const statsSection = this._makeSection();
        statsSection.style.flexDirection = 'column';
        statsSection.style.gap = '1px';
        statsSection.style.alignItems = 'flex-start';

        // Top row: elixir + level
        const statsRow1 = document.createElement('div');
        statsRow1.className = 'hud-stats-row';

        this.elixirCounter = new ElixirCounter();
        statsRow1.appendChild(this.elixirCounter.el);

        this._levelText = document.createElement('span');
        this._levelText.className = 'hud-value';
        this._levelText.textContent = 'Lv.0';
        this._levelText.style.cssText = 'color:#FFCC00;font-size:19px;';
        statsRow1.appendChild(this._levelText);

        // Scroll icon + count
        const scrollItem = document.createElement('div');
        scrollItem.className = 'hud-stats-item';
        this._scrollIcon = document.createElement('span');
        this._scrollIcon.className = 'hud-icon';
        this._scrollIcon.textContent = '\u25A3'; // ▣
        this._scrollIcon.style.cssText = 'color:#E8D8B0;font-size:16px;';
        this._scrollText = document.createElement('span');
        this._scrollText.className = 'hud-value';
        this._scrollText.textContent = '0';
        this._scrollText.style.cssText = 'color:#E8D8B0;font-size:16px;';
        scrollItem.appendChild(this._scrollIcon);
        scrollItem.appendChild(this._scrollText);
        statsRow1.appendChild(scrollItem);

        this.scrollCount = 0;

        // Relic icons
        this._relicRow = document.createElement('div');
        this._relicRow.className = 'hud-stats-row';
        this._relicRow.style.gap = '4px';

        statsSection.appendChild(statsRow1);
        statsSection.appendChild(this._relicRow);

        this._bar.appendChild(statsSection);
        this._bar.appendChild(this._makeSeparator());

        // === Section 4: Distance ===
        const distSection = this._makeSection();

        const distWrapper = document.createElement('div');
        distWrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;line-height:1;';

        this._distText = document.createElement('span');
        this._distText.className = 'hud-value';
        this._distText.textContent = '0m';
        this._distText.style.cssText = 'color:#CCDDEE;font-size:19px;letter-spacing:1px;';

        const distLabel = document.createElement('span');
        distLabel.className = 'hud-label';
        distLabel.textContent = 'DIST';
        distLabel.style.cssText = 'font-size:9px;color:#556677;margin-top:1px;';

        // Biome label (current biome + distance to next)
        this._biomeLabel = document.createElement('span');
        this._biomeLabel.style.cssText = 'font-size:9px;color:#88AABB;margin-top:2px;letter-spacing:0.5px;white-space:nowrap;';
        this._biomeLabel.textContent = '';

        distWrapper.appendChild(this._distText);
        distWrapper.appendChild(distLabel);
        distWrapper.appendChild(this._biomeLabel);
        distSection.appendChild(distWrapper);

        // Loop counter (hidden until loop 1)
        this._loopText = document.createElement('span');
        this._loopText.className = 'hud-value';
        this._loopText.style.cssText = 'color:#FF44FF;font-size:18px;font-weight:bold;display:none;margin-left:9px;';
        distSection.appendChild(this._loopText);

        // Modifier badge (hidden by default)
        this._modifierBadge = document.createElement('span');
        this._modifierBadge.style.cssText = 'display:none;font-size:16px;margin-left:9px;padding:1px 4px;border-radius:3px;';
        distSection.appendChild(this._modifierBadge);

        this._bar.appendChild(distSection);

        // S1c: Persistent combo badge (shows COMBO ×N when active)
        const comboBadge = document.createElement('span');
        comboBadge.id = 'hud-combo-badge';
        comboBadge.style.cssText = 'display:none;color:#FFD700;font-weight:bold;margin-left:10px;font-size:11px;align-self:center;';
        this._bar.appendChild(comboBadge);
        this._comboBadgeEl = comboBadge;

        // ─── Relic tooltip (DOM overlay) ───
        this._relicTooltip = document.createElement('div');
        this._relicTooltip.style.cssText = 'position:fixed;display:none;background:#121222;border:1px solid #446688;padding:6px 10px;color:#CCDDEE;font-family:monospace;font-size:11px;z-index:1000;pointer-events:none;max-width:210px;line-height:1.5;border-radius:4px;';
        document.body.appendChild(this._relicTooltip);

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

        // Survivor dialogue overlay (reuses lore scroll pattern)
        const sd = u(width / 2, height - 80);
        this.survivorBg = scene.add.rectangle(sd.x, sd.y, 700, 60, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(180).setVisible(false);
        this.survivorBorder = scene.add.rectangle(sd.x, sd.y, 704, 64, 0x000000, 0)
            .setScrollFactor(0).setDepth(179).setVisible(false);
        this.survivorBorder.setStrokeStyle(1, 0x44FF44);

        const sq = u(width / 2, height - 90);
        this.survivorQuote = scene.add.text(sq.x, sq.y, '', {
            fontSize: '12px', color: '#FFFFFF', fontFamily: 'monospace',
            fontStyle: 'italic', wordWrap: { width: 680 }, align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(181).setVisible(false);

        const sb = u(width / 2, height - 68);
        this.survivorBuffText = scene.add.text(sb.x, sb.y, '', {
            fontSize: '12px', color: '#44FF44', fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(181).setVisible(false);

        this._survivorTimer = null;

        // Game over overlay — elements created dynamically in showGameOver
        this._gameOverElements = [];

        // Controls hint
        const ch = u(width / 2, height - 20);
        this.controlsHint = scene.add.text(ch.x, ch.y,
            '[WASD] Move  [SPACE] Jump  [SHIFT] Dash  [S] Ability  [E] Burst  [Q] Class  [M] Mine Veins  [J] Lore  [ESC] Pause', {
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

        // ─── Progress bar (top of screen) ───
        this._progressGfx = scene.add.graphics().setScrollFactor(0).setDepth(PROGRESSION_BAR.DEPTH);
        this._progressPct = 0;

        // ─── Shroud proximity warning (left edge red overlay) ───
        const swp = u(0, height / 2);
        this.shroudWarnRect = scene.add.rectangle(swp.x, swp.y, 60, height, 0xFF0000, 0)
            .setScrollFactor(0).setDepth(99).setOrigin(0, 0.5);
        this._shroudWarnTween = null;

        // ─── Sprint 9e: Combo glow border (screen-edge red ring at x5+) ───
        const cg = u(width / 2, height / 2);
        this._comboGlowRect = scene.add.rectangle(cg.x, cg.y, width, height, 0xFF2222, 0)
            .setScrollFactor(0).setDepth(98).setStrokeStyle(8, 0xFF2222);
        this._comboGlowRect.setAlpha(0);
        this._comboGlowTween = null;
        this._comboVignette = scene.add.rectangle(cg.x, cg.y, width, height, 0xFF0000, 0)
            .setScrollFactor(0).setDepth(98);

        // ─── Shroud minimap (bottom-right corner) ───
        const mmW = 160;
        const mmH = 14;
        const mmX = width - mmW / 2 - 12;
        const mmY = height - 28;
        const mmBgPos = u(mmX, mmY);
        scene.add.rectangle(mmBgPos.x, mmBgPos.y, mmW, mmH, 0x000000, 0.75)
            .setStrokeStyle(1, 0x333344).setScrollFactor(0).setDepth(110);

        // Shroud fill — grows from the left as shroud approaches
        const mmFillPos = u(mmX - mmW / 2, mmY);
        this._mmFill = scene.add.rectangle(mmFillPos.x, mmFillPos.y, 0, mmH - 2, 0x8833AA, 0.9)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(111);

        // Player pip — fixed at right edge
        const mmPipPos = u(mmX + mmW / 2 - 3, mmY);
        scene.add.rectangle(mmPipPos.x, mmPipPos.y, 4, mmH - 2, 0xFFDD00)
            .setScrollFactor(0).setDepth(112);

        // Distance label
        const mmLabelPos = u(mmX, mmY - mmH / 2 - 8);
        this._mmLabel = scene.add.text(mmLabelPos.x, mmLabelPos.y, 'Shroud', {
            fontSize: '9px', color: '#AA66CC', fontFamily: 'monospace',
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(112);

        // Store left anchor x for fill updates
        this._mmFillOriginX = mmFillPos.x;
        this._mmW = mmW;

        // ─── Cooldown-ready ping tracking ───
        this._prevDashPct = 1;
        this._prevBurstPct = 1;
        this._prevSPct = 1;
        this._prevClassPct = 1;

        // ─── Scene shutdown cleanup ───
        scene.events.once('shutdown', () => this.destroy());
    }

    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    _makeSection() {
        const el = document.createElement('div');
        el.className = 'hud-section';
        return el;
    }

    _makeSeparator() {
        const el = document.createElement('div');
        el.className = 'hud-separator';
        return el;
    }

    _getSAbilityName() {
        const cls = SkillManager.activeClass;
        if (!cls || !cls.sAbility) return 'Smoke Bomb';
        const names = {
            smoke_bomb: 'Smoke Bomb',
            war_cry: 'War Cry',
            arcane_mine: 'Arcane Mine',
            volley: 'Volley',
            iron_stance: 'Iron Stance',
            mend: 'Mend',
            vanish: 'Vanish',
            chi_wave: 'Chi Wave',
            blade_storm: 'Blade Storm',
            inferno: 'Inferno',
        };
        return names[cls.sAbility.type] || cls.sAbility.type;
    }

    _getEAbilityName() {
        const cls = SkillManager.activeClass;
        if (!cls || !cls.eAbility) return 'Flame Burst';
        const names = {
            flame_burst: 'Flame Burst', war_howl: 'War Howl',
            mana_shield: 'Mana Shield', eagle_eye: 'Eagle Eye',
            fortify: 'Fortify', regen_pulse: 'Regen Pulse',
            lethal_mark: 'Lethal Mark', chi_strike: 'Chi Strike',
            parry_stance: 'Parry Stance', combustion_burst: 'Combustion Burst',
        };
        return names[cls.eAbility.type] || 'Flame Burst';
    }

    // ─── Helper: wire mouseenter/mousemove/mouseleave for ability tooltips ───

    _wireAbilityTooltip(el, getContent) {
        el.style.cursor = 'help';
        el.addEventListener('mouseenter', (e) => {
            this._abilityTooltip.innerHTML = getContent();
            this._abilityTooltip.style.display = 'block';
            this._abilityTooltip.style.left = (e.clientX + 14) + 'px';
            this._abilityTooltip.style.top  = (e.clientY - 12) + 'px';
        });
        el.addEventListener('mousemove', (e) => {
            this._abilityTooltip.style.left = (e.clientX + 14) + 'px';
            this._abilityTooltip.style.top  = (e.clientY - 12) + 'px';
        });
        el.addEventListener('mouseleave', () => {
            this._abilityTooltip.style.display = 'none';
        });
    }

    // ─── Helper: create a cooldown bar group (label + bar) ───

    _createCooldownBar(label, readyColor) {
        const el = document.createElement('div');
        el.className = 'hud-cd-group';

        const labelEl = document.createElement('span');
        labelEl.className = 'hud-label';
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:13px;color:#ccc;';

        const barBg = document.createElement('div');
        barBg.className = 'hud-bar-bg';
        barBg.style.cssText = 'width:102px;height:12px;';

        const barFill = document.createElement('div');
        barFill.className = 'hud-bar-fill';
        barFill.style.cssText = `width:0%;height:100%;background:${readyColor};`;

        barBg.appendChild(barFill);
        el.appendChild(labelEl);
        el.appendChild(barBg);

        return { el, labelEl, barFill, readyColor };
    }

    // ─── Update ───

    update(player, distanceMeters) {
        this.flameBar.update();
        this.elixirCounter.update();
        this._updateMinimap(player);

        if (player) {
            // SHIFT dash cooldown
            const dashPct = player.dashCooldownPct;
            this._dashGroup.barFill.style.width = `${(dashPct * 100).toFixed(1)}%`;
            this._dashGroup.barFill.style.background = dashPct >= 1 ? '#FFCC00' : '#444';
            if (this._prevDashPct < 1 && dashPct >= 1) this._pingLabel(this._dashGroup.labelEl);
            this._prevDashPct = dashPct;

            // E class ability cooldown
            const burstPct = player.eAbilityCooldownPct;
            this._burstGroup.barFill.style.width = `${(burstPct * 100).toFixed(1)}%`;
            this._burstGroup.barFill.style.background = burstPct >= 1 ? '#FF6600' : '#444';
            if (this._prevBurstPct < 1 && burstPct >= 1) this._pingLabel(this._burstGroup.labelEl);
            this._prevBurstPct = burstPct;

            // Q class attack cooldown
            if (SkillManager.hasClassAttack()) {
                const classPct = player.classAttackCooldownPct;
                this._classGroup.barFill.style.width = `${(classPct * 100).toFixed(1)}%`;
                this._classGroup.barFill.style.background = classPct >= 1 ? '#FF4444' : '#444';
                if (this._prevClassPct < 1 && classPct >= 1) this._pingLabel(this._classGroup.labelEl);
                this._prevClassPct = classPct;
            }

            // S ability cooldown
            const sPct = player.sAbilityCooldownPct;
            this._sAbilityGroup.barFill.style.width = `${(sPct * 100).toFixed(1)}%`;
            this._sAbilityGroup.barFill.style.background = sPct >= 1 ? '#44AAFF' : '#444';
            if (this._prevSPct < 1 && sPct >= 1) this._pingLabel(this._sAbilityGroup.labelEl);
            this._prevSPct = sPct;

            // S1b: Primed countdown timer
            if (this._qPrimedTimerEl) {
                const s = this.scene;
                if (s._qPrimed && s._qPrimedExpiry) {
                    const rem = Math.max(0, (s._qPrimedExpiry - s.time.now) / 1000);
                    this._qPrimedTimerEl.textContent = `▶ ${rem.toFixed(1)}s`;
                    this._qPrimedTimerEl.style.display = 'inline';
                } else {
                    this._qPrimedTimerEl.style.display = 'none';
                }
            }
        }

        if (distanceMeters !== undefined) {
            this._distText.textContent = `${Math.floor(distanceMeters).toLocaleString()}m`;
            // Update progress bar
            const pct = Math.min(1, (distanceMeters * 10) / WORLD.WIDTH);
            this._drawProgressBar(pct);
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

    showSurvivorDialogue(dialogue, buff) {
        // Dismiss lore scroll if showing
        if (this.loreTimer) {
            this.loreTimer.destroy();
            this.loreTimer = null;
            this.loreBg.setVisible(false).setAlpha(1);
            this.loreBorder.setVisible(false).setAlpha(1);
            this.loreQuote.setVisible(false).setAlpha(1);
            this.loreAuthor.setVisible(false).setAlpha(1);
        }

        // Cancel previous survivor dialogue if any
        if (this._survivorTimer) {
            this._survivorTimer.destroy();
            this._survivorTimer = null;
        }

        this.survivorQuote.setText(dialogue);
        this.survivorBuffText.setText(`${buff.name}: ${buff.desc}`);
        this.survivorBg.setVisible(true).setAlpha(1);
        this.survivorBorder.setVisible(true).setAlpha(1);
        this.survivorQuote.setVisible(true).setAlpha(1);
        this.survivorBuffText.setVisible(true).setAlpha(1);

        this._survivorTimer = this.scene.time.delayedCall(4000, () => {
            this.scene.tweens.add({
                targets: [this.survivorBg, this.survivorBorder, this.survivorQuote, this.survivorBuffText],
                alpha: 0,
                duration: 800,
                onComplete: () => {
                    this.survivorBg.setVisible(false).setAlpha(1);
                    this.survivorBorder.setVisible(false).setAlpha(1);
                    this.survivorQuote.setVisible(false).setAlpha(1);
                    this.survivorBuffText.setVisible(false).setAlpha(1);
                }
            });
        });
    }

    updateBuff(buffType, remaining, total) {
        if (!buffType || remaining <= 0) {
            this._buffGroup.style.display = 'none';
            return;
        }
        this._buffGroup.style.display = '';
        const names = { flame_regen: 'REGEN', speed: 'SWIFT', shroud_slow: 'WARD', rescue: 'RESCUE' };
        this._buffLabel.textContent = names[buffType] || 'BUFF';
        const pct = Math.max(0, remaining / total) * 100;
        this._buffFill.style.width = `${pct.toFixed(1)}%`;
        this._buffFill.style.background = pct > 30 ? '#44FF44' : '#FFCC00';
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
        scene.tweens.add({ targets: bg, fillAlpha: 0.85, duration: 800 });
        this._gameOverElements.push(bg);

        // Game-over stinger — exists in AudioManager but was never called
        if (scene.audio) scene.audio.playGameOverStinger();

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

        // Context sub-header: class, difficulty, prestige, relics
        const _ctxClass = (runStats && runStats.className) || 'Adventurer';
        const _ctxDiff = DIFFICULTIES[Settings.data.difficulty || 'standard']?.label || 'Standard';
        const _ctxPrestige = MetaProgression.prestigeCount > 0 ? '  ·  ' + '\u2605'.repeat(MetaProgression.prestigeCount) : '';
        const _ctxRelics = (runStats && runStats.relicsCollected && runStats.relicsCollected.length > 0)
            ? `  ·  ${runStats.relicsCollected.length} Relics` : '';
        _t(width / 2, height * 0.165, `${_ctxClass}  ·  ${_ctxDiff}${_ctxPrestige}${_ctxRelics}`, {
            fontSize: '11px', color: '#888888'
        });

        const lore = _t(width / 2, height * 0.21, '"The Flame watches over the fallen land..."', {
            fontSize: '11px', color: '#666666', fontStyle: 'italic'
        });

        // Divider
        const divP = u(width / 2, height * 0.23);
        const div1 = scene.add.rectangle(divP.x, divP.y, 360, 1, 0x444444)
            .setScrollFactor(0).setDepth(d).setAlpha(0);
        this._gameOverElements.push(div1);

        // Best distance
        const bestColor = isNewBest ? '#FFCC00' : '#888888';
        const bestLabel = isNewBest ? `NEW BEST!  ${dist.toLocaleString()}m` : `Best: ${Math.floor(bestDist).toLocaleString()}m`;
        const best = _t(width / 2, height * 0.27, bestLabel, {
            fontSize: isNewBest ? '16px' : '13px', color: bestColor, fontStyle: isNewBest ? 'bold' : ''
        });

        // NEW BEST celebration
        if (isNewBest) {
            scene.time.delayedCall(600, () => {
                if (!best.active) return;
                // Pulsing glow
                scene.tweens.add({
                    targets: best,
                    scaleX: { from: 1, to: 1.05 },
                    scaleY: { from: 1, to: 1.05 },
                    alpha: { from: 1, to: 0.8 },
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                // Gold particle burst
                if (scene.textures.exists('pixel')) {
                    const bp = u(width / 2, height * 0.27);
                    const emitter = scene.add.particles(bp.x, bp.y, 'pixel', {
                        speed: { min: 30, max: 100 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 2, end: 0 },
                        alpha: { start: 1, end: 0 },
                        lifespan: { min: 500, max: 1000 },
                        tint: [0xFFCC00, 0xFFAA00, 0xFFEE44],
                        blendMode: 'ADD',
                        quantity: 20,
                        emitting: false
                    }).setDepth(d + 1).setScrollFactor(0);
                    emitter.explode(20);
                    this._gameOverElements.push(emitter);
                }
                // Achievement stinger
                if (scene.audio) scene.audio.playAchievement();
            });
        }

        // Stats — two columns
        const lx = width / 2 - 140;
        const rx = width / 2 + 140;
        const sy = height * 0.33;
        const lineH = 22;
        const stats = runStats || {};
        const survMin = Math.floor((stats.survivalTime || 0) / 60);
        const survSec = Math.floor((stats.survivalTime || 0) % 60);

        const rows = [
            ['Distance',        `${dist.toLocaleString()}m`,    'Enemies Banished', `${stats.enemiesBanished || 0}`],
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

        // Sprint 10b: Class best comparison + medals
        const compY = sy + rows.length * lineH + 18;
        const className = (runStats && runStats.className) || 'adventurer';
        const classBest = MetaProgression.getPersonalBest(className);
        const overallBest = MetaProgression.getOverallBest();
        if (classBest && classBest.distance > 0) {
            const beatClass = dist >= classBest.distance;
            const medal = beatClass ? '\u{1F947}' : (dist >= (overallBest ? overallBest.distance * 0.9 : 0) ? '\u{1F948}' : '');
            const _classRunCount = MetaProgression.getRunHistory().filter(r => r.class === className).length + 1;
            _t(width / 2, compY, `${medal} Your best as ${className}: ${Math.floor(classBest.distance).toLocaleString()}m  (${_classRunCount} run${_classRunCount !== 1 ? 's' : ''})`, {
                fontSize: '12px', color: beatClass ? '#FFCC00' : '#888888'
            });
        }

        // Sprint 10b: Run history (last 3 runs)
        const historyY = compY + 22;
        const history = MetaProgression.getRunHistory().slice(0, 3);
        if (history.length > 1) {
            _t(width / 2, historyY, '─ RECENT RUNS ─', { fontSize: '10px', color: '#444444' });
            for (let i = 0; i < Math.min(3, history.length); i++) {
                const run = history[i];
                const runLabel = `${run.class} — ${Math.floor(run.distance).toLocaleString()}m — ${run.kills} kills`;
                _t(width / 2, historyY + 14 + i * 14, runLabel, { fontSize: '10px', color: '#555555' });
            }
        }

        // Achievements summary
        const achY = historyY + (history.length > 1 ? 60 : 0) + 10;
        const achCount = AchievementManager.getUnlockedCount();
        const achTotal = AchievementManager.getTotalCount();
        _t(width / 2, achY, `Achievements: ${achCount} / ${achTotal}`, {
            fontSize: '13px', color: '#FFCC00'
        });

        // Flame Altar meta-progression
        const altarY = achY + 24;
        const altarLevel = FlameAltar.level;
        const altarMax = FlameAltar.maxLevel;
        const prestigeCount = MetaProgression.prestigeCount;
        const prestigeStar = prestigeCount > 0 ? ' ' + '\u2605'.repeat(prestigeCount) : '';
        _t(width / 2, altarY, `Flame Level ${altarLevel} / ${altarMax}${prestigeStar}`, {
            fontSize: '13px', color: '#FF8800'
        });

        // Flame Altar progress bar
        if (altarLevel < altarMax) {
            const prog = FlameAltar.getProgressToNext();
            const barY = altarY + 16;
            const bp = u(width / 2, barY);
            const barW = 200;
            const barH = 8;
            const barBg = scene.add.rectangle(bp.x, bp.y, barW, barH, 0x333333)
                .setScrollFactor(0).setDepth(d).setAlpha(0);
            const fillW = Math.max(2, barW * prog.pct);
            const barFill = scene.add.rectangle(bp.x - barW / 2 + fillW / 2, bp.y, fillW, barH, 0xFF8800)
                .setScrollFactor(0).setDepth(d).setAlpha(0);
            this._gameOverElements.push(barBg, barFill);
            _t(width / 2, barY + 12, `${prog.current} / ${prog.needed} elixir to next level`, {
                fontSize: '10px', color: '#888888'
            });
        } else if (MetaProgression.canPrestige && MetaProgression.canPrestige()) {
            _t(width / 2, altarY + 16, '\u2605 MAX — Press [P] to Prestige at the Altar \u2605', {
                fontSize: '10px', color: '#FFD700', fontStyle: 'italic'
            });
        } else {
            _t(width / 2, altarY + 16, 'MAX LEVEL \u2014 The Flame burns eternal', {
                fontSize: '10px', color: '#FF8800', fontStyle: 'italic'
            });
        }

        // Relic upgrade hints
        const upgradeable = MetaProgression.seenRelics.filter(id => !MetaProgression.hasUpgrade(id));
        if (upgradeable.length > 0) {
            const avail = MetaProgression.getAvailableElixir();
            const canAfford = avail >= 20;
            _t(width / 2, altarY + 40,
                canAfford ? `\u2B06 ${upgradeable.length} relic(s) upgradeable for 20 elixir each` : `\u2B06 Relic upgrades available (need 20 elixir)`, {
                fontSize: '10px', color: canAfford ? '#FFCC44' : '#666666', fontStyle: 'italic'
            });
        }

        // Daily run share card
        if (runStats && runStats.isDaily) {
            const shareData = {
                distance: dist,
                className: (runStats && runStats.className) || 'adventurer',
                kills: (runStats && runStats.enemiesBanished) || 0,
                time: (runStats && runStats.survivalTime) || 0,
                hasDied: (runStats && runStats.hasDied) || false,
                relics: (runStats && runStats.relicsCollected) || [],
            };
            DailyRun.saveDailyResult(shareData);
            const shareText = DailyRun.generateShareText(shareData);

            const dY = height * 0.76;
            const dDivP = u(width / 2, dY - 10);
            const dDiv = scene.add.rectangle(dDivP.x, dDivP.y, 360, 1, 0x446644)
                .setScrollFactor(0).setDepth(d).setAlpha(0);
            this._gameOverElements.push(dDiv);

            _t(width / 2, dY + 4, 'DAILY RESULT', { fontSize: '12px', color: '#FFDD00', fontStyle: 'bold' });

            const lines = shareText.split('\n');
            for (let li = 0; li < lines.length; li++) {
                _t(width / 2, dY + 18 + li * 13, lines[li], { fontSize: '9px', color: '#AAAAAA' });
            }

            const copyHint = _t(width / 2, dY + 18 + lines.length * 13 + 6,
                '[C] Copy to Clipboard', { fontSize: '10px', color: '#667766' });

            const copyHandler = (e) => {
                if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && copyHint.active) {
                    navigator.clipboard.writeText(shareText).catch(() => {});
                    copyHint.setText('COPIED!');
                    copyHint.setColor('#44FF44');
                    scene.tweens.add({
                        targets: copyHint,
                        alpha: { from: 0.5, to: 1.0 },
                        duration: 300,
                        ease: 'Linear'
                    });
                    scene.time.delayedCall(1500, () => {
                        if (copyHint.active) {
                            copyHint.setText('[C] Copy to Clipboard');
                            copyHint.setColor('#667766');
                        }
                    });
                }
            };
            scene.input.keyboard.on('keydown', copyHandler);
        }

        // Near-miss achievement + win path progress (non-daily runs only)
        if (!runStats || !runStats.isDaily) {
            const nearMisses = AchievementManager.getNearMisses(stats, 1);
            if (nearMisses.length > 0) {
                const nm = nearMisses[0];
                const filled = Math.round(nm.pct * 8);
                const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(8 - filled);
                _t(width / 2, height * 0.860,
                    `\u25B6 SO CLOSE \u2014 ${nm.icon} ${nm.name}: ${nm.label}  [${bar}]`, {
                    fontSize: '11px', color: '#FF8844'
                });
            }

            // Win path progress
            const _bosses = runStats && runStats.bossesDefeated;
            const _bossCount = _bosses ? (_bosses.size ?? _bosses.length ?? 0) : 0;
            const _loreCount = stats.loreScrollsFound || 0;
            const _loreTotal = LORE_ENTRIES ? LORE_ENTRIES.length : 58;
            const _hasMaw = _bosses && (_bosses.has ? _bosses.has('shroud_maw') : false);

            const _mkBar = (pct, len = 8) => {
                const f = Math.round(Math.min(pct, 1) * len);
                return '\u2588'.repeat(f) + '\u2591'.repeat(len - f);
            };
            _t(width / 2, height * 0.880, '\u2500\u2500 WIN PATHS \u2500\u2500', { fontSize: '9px', color: '#445555' });
            _t(width / 2, height * 0.893,
                `\u2694\uFE0F Boss Conquest: ${_bossCount}/6  [${_mkBar(_bossCount / 6)}]`, {
                fontSize: '10px', color: _bossCount >= 6 ? '#FFD700' : '#667788'
            });
            _t(width / 2, height * 0.906,
                `\u25A3 Lore Master: ${_loreCount}/${_loreTotal}  [${_mkBar(_loreCount / _loreTotal)}]`, {
                fontSize: '10px', color: _loreCount >= _loreTotal ? '#FFD700' : '#667788'
            });
            const _shroudPct = Math.min(dist / 50000, 1);
            const _shroudDone = _shroudPct >= 1 && _hasMaw;
            _t(width / 2, height * 0.919,
                `\u{1F311} Shroud Conquest: ${Math.floor(_shroudPct * 100)}%${_hasMaw ? '+\u2605' : ''}  [${_mkBar(_shroudPct)}]`, {
                fontSize: '10px', color: _shroudDone ? '#FFD700' : '#667788'
            });

            // W3: "Next Up" strategic hint — closest actionable milestone
            {
                const _avail = MetaProgression.getAvailableElixir();
                let _nextUpMsg = null;
                // 1. Affordable mastery for this class
                const _mEntries = CLASS_MASTERIES && CLASS_MASTERIES[className];
                if (_mEntries) {
                    for (const _me of _mEntries) {
                        const _mc = MetaProgression.getMasteryCost(className, _me.id);
                        if (_mc !== null && _avail >= _mc) {
                            _nextUpMsg = `\u25B6 Next Up: ${_me.name} mastery rank ${MetaProgression.getMasteryRank(className, _me.id) + 1} — ${_mc} elixir`;
                            break;
                        }
                    }
                }
                // 2. Next class unlock within reach
                if (!_nextUpMsg) {
                    const _nextLocked = ALL_CLASS_IDS.find(id => !MetaProgression.isClassUnlocked(id));
                    if (_nextLocked) {
                        const _nlCost = MetaProgression.getUnlockCost();
                        const _nlName = (CLASS_DEFS && CLASS_DEFS[_nextLocked]?.className) || _nextLocked;
                        _nextUpMsg = `\u25B6 Next Up: Unlock ${_nlName} — ${_nlCost} elixir (${_avail} available)`;
                    }
                }
                // 3. Nearest win path milestone
                if (!_nextUpMsg) {
                    if (_bossCount < 6) _nextUpMsg = `\u25B6 Next Up: Boss Conquest — ${6 - _bossCount} more boss${6 - _bossCount !== 1 ? 'es' : ''} to defeat`;
                    else if (_loreCount < _loreTotal) _nextUpMsg = `\u25B6 Next Up: Lore Master — ${_loreTotal - _loreCount} scrolls remaining`;
                }
                if (_nextUpMsg) {
                    _t(width / 2, height * 0.932, _nextUpMsg, { fontSize: '10px', color: '#FFCC44', fontStyle: 'italic' });
                }
            }
        }

        // W6: Mastery quick-spend (non-daily runs)
        let _masterySpendShown = false;
        if (!runStats || !runStats.isDaily) {
            const _mEntries = CLASS_MASTERIES && CLASS_MASTERIES[className];
            const _avail = MetaProgression.getAvailableElixir();
            if (_mEntries) {
                const _affordable = _mEntries.filter(m => {
                    const c = MetaProgression.getMasteryCost(className, m.id);
                    return c !== null && _avail >= c;
                }).slice(0, 2);
                if (_affordable.length > 0) {
                    _masterySpendShown = true;
                    _t(width / 2, height * 0.944, '\u2500\u2500 UPGRADE MASTERY \u2500\u2500', { fontSize: '9px', color: '#445566' });
                    const _mTexts = [];
                    for (let _mi = 0; _mi < _affordable.length; _mi++) {
                        const _m = _affordable[_mi];
                        const _mc = MetaProgression.getMasteryCost(className, _m.id);
                        const _curRank = MetaProgression.getMasteryRank(className, _m.id);
                        const _mt = _t(width / 2, height * (0.956 + _mi * 0.011),
                            `[${_mi + 1}] ${_m.name}  \u25B8 Rank ${_curRank + 1}  (${_mc} elixir)`, {
                            fontSize: '10px', color: '#BB88FF'
                        });
                        _mTexts.push({ text: _mt, mastery: _m });
                    }
                    const _masteryHandler = (e) => {
                        if (e.key !== '1' && e.key !== '2') return;
                        const _ki = parseInt(e.key) - 1;
                        if (_ki < 0 || _ki >= _mTexts.length) return;
                        const { text: _mt, mastery: _m } = _mTexts[_ki];
                        const success = MetaProgression.upgradeMastery(className, _m.id);
                        if (success && _mt.active) {
                            _mt.setText(`\u2713 ${_m.name}  \u2192 Rank ${MetaProgression.getMasteryRank(className, _m.id)} upgraded!`);
                            _mt.setColor('#44FF88');
                        }
                    };
                    scene.input.keyboard.on('keydown', _masteryHandler);
                }
            }
        }

        // Restart prompt (shifted down when mastery quick-spend is visible)
        const restart = _t(width / 2, _masterySpendShown ? height * 0.977 : height * 0.945, 'Press SPACE to awaken again', {
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
            this._classGroup.labelEl.textContent = `[Q] - ${cls.attackName}`;
        } else {
            this._classGroup.el.style.display = 'none';
        }

        // Update S and E ability labels
        this._sAbilityGroup.labelEl.textContent = `[S] - ${this._getSAbilityName()}`;
        this._burstGroup.labelEl.textContent = '[E] - ' + this._getEAbilityName();
    }

    popElixir() {
        if (this.scene.audio?.initialized) { this.scene.audio.playWispCollect(); }
        this.elixirCounter.pop();
    }

    updateRelics(relicManager) {
        if (!this._relicRow || !relicManager) return;
        this._relicRow.innerHTML = '';
        const hasSynergy = relicManager.activeSynergies && relicManager.activeSynergies.size > 0;
        this._relicRow.style.boxShadow = hasSynergy ? '0 0 8px 2px #FFD700' : '';
        this._relicRow.style.borderRadius = hasSynergy ? '4px' : '';

        const allSynergyDefs = relicManager.getSynergyDefs ? relicManager.getSynergyDefs() : [];
        for (const relic of relicManager.active) {
            const span = document.createElement('span');
            span.textContent = relic.icon;
            span.style.cssText = 'font-size:21px;cursor:default;';

            // Tooltip on hover
            span.addEventListener('mouseenter', (e) => {
                let html = `<b style="color:#FFD700">${relic.name}</b><br>${relic.desc}`;
                if (relic.drawback) html += `<br><span style="color:#FF6644">\u2193 ${relic.drawback}</span>`;
                const relicSyns = allSynergyDefs.filter(s => s.requires && s.requires.includes(relic.id));
                for (const syn of relicSyns) {
                    html += `<br><span style="color:#FFD700">\u2726 ${syn.name}: ${syn.desc}</span>`;
                }
                this._relicTooltip.innerHTML = html;
                this._relicTooltip.style.display = 'block';
                this._relicTooltip.style.left = (e.clientX + 12) + 'px';
                this._relicTooltip.style.top = (e.clientY - 10) + 'px';
            });
            span.addEventListener('mousemove', (e) => {
                this._relicTooltip.style.left = (e.clientX + 12) + 'px';
                this._relicTooltip.style.top = (e.clientY - 10) + 'px';
            });
            span.addEventListener('mouseleave', () => {
                this._relicTooltip.style.display = 'none';
            });

            this._relicRow.appendChild(span);
        }
    }

    updateCorruption(c) {
        if (c <= 0) {
            this._corruptBarWrap.style.display = 'none';
            return;
        }
        this._corruptBarWrap.style.display = 'flex';
        const pct = Math.min(100, c);
        this._corruptFill.style.width = `${pct.toFixed(1)}%`;
        // Brighter at high corruption
        const r = Math.floor(0x99 + (0xFF - 0x99) * (pct / 100));
        this._corruptFill.style.background = `rgb(${r}, 51, 255)`;
    }

    // ─── Progress bar drawing ───

    _drawProgressBar(pct) {
        const gfx = this._progressGfx;
        if (!gfx) return;
        gfx.clear();

        const { width } = this.scene.scale;
        const z = this.scene.cameras.main.zoom;
        const barW = width / z;
        const barH = PROGRESSION_BAR.HEIGHT;

        // Position at top of visible area
        const topLeft = this._uiXY(0, 0);

        // Draw biome color segments
        const totalDist = WORLD.WIDTH;
        for (let i = 0; i < BIOMES.length; i++) {
            const start = BIOMES[i].startDistance / totalDist;
            const end = (i + 1 < BIOMES.length ? BIOMES[i + 1].startDistance : totalDist) / totalDist;
            const color = PROGRESSION_BAR.BIOME_COLORS[i] || 0x444444;

            const segX = topLeft.x + start * barW;
            const segW = (end - start) * barW;
            const fillW = Math.min(segW, Math.max(0, pct * barW - start * barW));

            if (fillW > 0) {
                gfx.fillStyle(color, 0.8);
                gfx.fillRect(segX, topLeft.y, fillW, barH);
            }

            // Biome tick mark
            if (i > 0) {
                gfx.fillStyle(0xFFFFFF, 0.5);
                gfx.fillRect(topLeft.x + start * barW, topLeft.y, 1, barH);
            }
        }

        // Background for unfilled portion
        const filledW = pct * barW;
        if (filledW < barW) {
            gfx.fillStyle(0x222222, 0.4);
            gfx.fillRect(topLeft.x + filledW, topLeft.y, barW - filledW, barH);
        }
    }

    updateShroudProximity(dist) {
        if (dist < PROGRESSION_BAR.SHROUD_WARN_DISTANCE) {
            const intensity = 1 - (dist / PROGRESSION_BAR.SHROUD_WARN_DISTANCE);
            const targetAlpha = intensity * PROGRESSION_BAR.SHROUD_WARN_MAX_ALPHA;

            if (!this._shroudWarnTween) {
                this.shroudWarnRect.setAlpha(0);
                this._shroudWarnTween = this.scene.tweens.add({
                    targets: this.shroudWarnRect,
                    alpha: { from: 0, to: targetAlpha },
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else {
                // Update pulse intensity
                this._shroudWarnTween.data[0].end = targetAlpha;
            }
        } else {
            if (this._shroudWarnTween) {
                this._shroudWarnTween.destroy();
                this._shroudWarnTween = null;
                this.shroudWarnRect.setAlpha(0);
            }
        }
    }

    // ─── Sprint 9e: Combo visual effects ───

    updateCombo(count) {
        if (!this._comboGlowRect) return;

        if (count >= 5) {
            // Start pulsing red glow border if not already active
            if (!this._comboGlowTween) {
                this._comboGlowTween = this.scene.tweens.add({
                    targets: this._comboGlowRect,
                    alpha: { from: 0, to: 0.12 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        } else {
            if (this._comboGlowTween) {
                this._comboGlowTween.destroy();
                this._comboGlowTween = null;
                this._comboGlowRect.setAlpha(0);
            }
        }

        if (count >= 10 && this._comboVignette) {
            // Screen edge vignette flash at x10+
            this._comboVignette.setAlpha(0.2);
            this.scene.tweens.add({
                targets: this._comboVignette,
                alpha: 0,
                duration: 400,
                ease: 'Power2'
            });
        }

        // S1c: Update persistent combo badge
        if (this._comboBadgeEl) {
            if (count >= 2) {
                this._comboBadgeEl.textContent = `COMBO ×${count}`;
                this._comboBadgeEl.style.display = 'inline';
            } else {
                this._comboBadgeEl.style.display = 'none';
            }
        }
    }

    // ─── Endless loop indicator ───

    updateLoop(n) {
        if (!this._loopText) return;
        if (n <= 0) {
            this._loopText.style.display = 'none';
        } else {
            this._loopText.textContent = `\u27F3 LOOP ${n}`;
            this._loopText.style.display = '';
        }
    }

    // ─── Flame drain rate label ───

    updateDrainRate(rate) {
        if (!this._drainRateLabel) return;
        this._drainRateLabel.textContent = `\u2212${Math.abs(rate).toFixed(1)}/s`;
        const color = rate > 3.5 ? '#FF2244' : rate > 2.0 ? '#FF6644' : '#99AA77';
        this._drainRateLabel.style.color = color;
    }

    // ─── Biome progress label ───

    updateBiome(biome, playerDistPx) {
        if (!this._biomeLabel || !biome) return;
        const shortName = biome.name.replace(/^The /, '');
        const idx = BIOMES.findIndex(b => b.id === biome.id);
        const next = BIOMES[idx + 1];
        if (next) {
            const distToNextM = Math.max(0, Math.round((next.startDistance - playerDistPx) / 10));
            this._biomeLabel.textContent = `${shortName} \u2192 ${distToNextM}m`;
        } else {
            this._biomeLabel.textContent = shortName;
        }
    }

    updatePassiveTag(passive) {
        if (!this._passiveTag) return;
        if (passive) {
            this._passiveTag.textContent = `\u25B6 ${passive.description}`;
            this._passiveTag.style.display = '';
        }
    }

    // ─── Relic acquisition toast ───

    showRelicToast(relic) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:60px;right:16px;background:#141428;border:1px solid #FFCC44;padding:8px 12px;color:#FFCC44;font-family:monospace;font-size:12px;z-index:999;border-radius:4px;opacity:0;transform:translateY(10px);transition:opacity 0.25s,transform 0.25s;pointer-events:none;';
        toast.innerHTML = `<span style="font-size:20px;vertical-align:middle">${relic.icon}</span>&nbsp;<b>${relic.name}</b><br><span style="font-size:10px;color:#888888">Relic Acquired</span>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 2500);
    }

    // ─── Run info banner (shown briefly at start of run) ───

    showRunInfoBanner(lines) {
        this.showRunInfoBannerInteractive(lines);
    }

    /** Like showRunInfoBanner but returns the banner object and dismisses on any keydown */
    showRunInfoBannerInteractive(lines) {
        if (!lines || lines.length === 0) return null;
        const scene = this.scene;
        const { width, height } = scene.scale;
        const zoom = scene.cameras.main.zoom;
        const s = 1 / zoom;
        const cx = width / 2;
        const cy = height / 2;
        const _ui = (sx, sy) => ({ x: (sx - cx) / zoom + cx, y: (sy - cy) / zoom + cy });
        const p = _ui(width / 2, Math.round(height * 0.18));

        const banner = scene.add.text(p.x, p.y, lines.join('\n'), {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#AABBCC',
            align: 'center',
            lineSpacing: 5,
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#00000066',
            padding: { x: 10, y: 6 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(120).setScale(s).setAlpha(0);

        const _dismiss = () => {
            if (!banner.active) return;
            scene.tweens.add({
                targets: banner, alpha: 0, duration: 300,
                onComplete: () => { if (banner.active) banner.destroy(); }
            });
        };

        scene.tweens.add({
            targets: banner, alpha: 0.9, duration: 400, ease: 'Power2',
            onComplete: () => {
                // Dismiss on any key (except [R], handled by Level1)
                const _keyHandler = (e) => {
                    if (e.key === 'r' || e.key === 'R') return;
                    scene.input.keyboard.off('keydown', _keyHandler);
                    _dismiss();
                };
                scene.input.keyboard.on('keydown', _keyHandler);
                // Auto-dismiss after 2.6s
                scene.time.delayedCall(2600, () => {
                    scene.input.keyboard.off('keydown', _keyHandler);
                    _dismiss();
                });
            }
        });

        return banner;
    }

    // ─── World modifier badge ───

    showModifier(mod) {
        if (!this._modifierBadge) return;
        if (!mod) {
            this._modifierBadge.style.display = 'none';
            return;
        }
        const tierColors = { hard: '#FF4444', medium: '#FFAA00', easy: '#44FF44' };
        const color = tierColors[mod.tier] || '#AAAAAA';
        this._modifierBadge.textContent = `${mod.icon} ${mod.name}`;
        this._modifierBadge.style.color = color;
        this._modifierBadge.style.border = `1px solid ${color}`;
        this._modifierBadge.style.display = '';
    }

    // ─── Shroud minimap update ───

    _updateMinimap(player) {
        if (!this._mmFill || !this._mmLabel || !player) return;
        const gapPx = player.x - GlobalState.shroudX;
        const gapM = Math.round(gapPx / 10);
        const mmRange = 150; // meters the full bar represents

        // Fill fraction: 0 = shroud far away, 1 = shroud at player
        const fillPct = 1 - Math.min(1, Math.max(0, gapM) / mmRange);
        this._mmFill.width = fillPct * this._mmW;

        // Colour: purple → orange → red as danger rises
        const fillColor = gapM < 20 ? 0xFF2200 : gapM < 50 ? 0xFF7700 : 0x8833AA;
        this._mmFill.setFillStyle(fillColor, 0.9);

        // Label
        const text = gapM <= 0 ? 'IN SHROUD' : `Shroud: ${gapM}m`;
        const labelColor = gapM < 20 ? '#FF4444' : gapM < 50 ? '#FFAA00' : '#AA66CC';
        this._mmLabel.setText(text).setColor(labelColor);
    }

    // ─── Cooldown-ready label flash ───

    _pingLabel(el) {
        el.classList.remove('cd-ready-ping');
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add('cd-ready-ping');
        setTimeout(() => el.classList.remove('cd-ready-ping'), 600);
        if (this.scene.audio?.initialized) { this.scene.audio.playComboMilestone?.(); }
    }

    // ─── Shroud gap escalation ───

    updateShroudGap(gap) {
        if (!this._shroudDangerVignette) {
            const { width, height } = this.scene.scale;
            const cv = this._uiXY(width / 2, height / 2);
            this._shroudDangerVignette = this.scene.add.rectangle(cv.x, cv.y, width, height, 0xFF0000, 0)
                .setScrollFactor(0).setDepth(97);
            this._shroudPingCooldown = 0;
        }
        if (gap < 80) {
            const intensity = Math.min(0.18, (80 - gap) / 80 * 0.18);
            this._shroudDangerVignette.setAlpha(intensity);
            // Speed up warning text pulse at close range
            if (this.warningText?.visible && this._warningTween) {
                this._warningTween.timeScale = gap < 40 ? 2.5 : 1.6;
            }
            // Close-call ping at < 40px (2s cooldown)
            this._shroudPingCooldown = (this._shroudPingCooldown || 0) - (this.scene.game.loop.delta || 16);
            if (gap < 40 && this._shroudPingCooldown <= 0) {
                this.scene.audio?.playCloseCallPing?.();
                this._shroudPingCooldown = 2000;
            }
        } else {
            this._shroudDangerVignette.setAlpha(0);
            if (this._warningTween) this._warningTween.timeScale = 1;
        }
    }

    // ─── Primed Q glow + COMBO label ───

    setQPrimed(active) {
        if (!this._classGroup) return;
        this._classGroup.el.style.boxShadow = active ? '0 0 6px 2px #FFD700' : '';
        this._classGroup.el.style.borderRadius = active ? '3px' : '';
    }

    /** Cyan glow on Q bar — enemy telegraphed, charged shot window open */
    setQCharged(active) {
        if (!this._classGroup) return;
        this._classGroup.el.style.boxShadow = active ? '0 0 8px 3px #00FFFF' : '';
        this._classGroup.el.style.borderRadius = active ? '3px' : '';
    }

    /** Full-screen cyan flash + center text when charged Q fires */
    showQChargedFire() {
        const scene = this.scene;
        const { width, height } = scene.scale;
        // Cyan screen flash
        const flash = scene.add.rectangle(width / 2, height / 2, width, height, 0x00FFFF, 0.18)
            .setScrollFactor(0).setDepth(304);
        scene.tweens.add({ targets: flash, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => flash.destroy() });
        // "CHARGED SHOT" text
        const p = this._uiXY(width / 2, Math.round(height * 0.45));
        const txt = scene.add.text(p.x, p.y, '⚡ CHARGED', {
            fontSize: '24px', color: '#00FFFF', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#003344', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(305);
        scene.tweens.add({
            targets: txt,
            scaleX: { from: 1.5, to: 0.9 }, scaleY: { from: 1.5, to: 0.9 },
            alpha: { from: 1, to: 0 }, duration: 550, ease: 'Power2',
            onComplete: () => { if (txt.active) txt.destroy(); }
        });
    }

    showComboLabel() {
        const scene = this.scene;
        const { width, height } = scene.scale;
        const p = this._uiXY(width / 2, Math.round(height * 0.42));
        const txt = scene.add.text(p.x, p.y, '\u26A1 COMBO', {
            fontSize: '28px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(305);
        scene.tweens.add({
            targets: txt,
            scaleX: { from: 1.4, to: 0.85 },
            scaleY: { from: 1.4, to: 0.85 },
            alpha: { from: 1, to: 0 },
            duration: 600,
            ease: 'Power2',
            onComplete: () => { if (txt.active) txt.destroy(); }
        });
    }

    // ─── Kill streak stamp ───

    showComboStamp(count) {
        const colors = { 3: '#FFCC00', 5: '#FF8800', 7: '#FF4400', 10: '#FF0000' };
        const color = colors[count] || '#FF4400';
        const { width, height } = this.scene.scale;
        const z = this.scene.cameras.main.zoom;
        const zs = 1 / z;
        const p = this._uiXY(width / 2, Math.round(height * 0.38));
        const txt = this.scene.add.text(p.x, p.y, `\xD7${count}`, {
            fontSize: '56px', color, fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302).setAlpha(0.92);
        if (count >= 10) this.scene.cameras.main.shake(180, 0.006);
        this.scene.tweens.add({
            targets: txt,
            scaleX: { from: zs * 1.5, to: zs * 0.85 },
            scaleY: { from: zs * 1.5, to: zs * 0.85 },
            alpha: { from: 0.92, to: 0 },
            duration: 550,
            ease: 'Power2',
            onComplete: () => { if (txt.active) txt.destroy(); }
        });
    }

    // ─── Cleanup DOM on scene shutdown/restart ───

    destroy() {
        if (this._bar && this._bar.parentNode) {
            this._bar.parentNode.removeChild(this._bar);
        }
        if (this._relicTooltip && this._relicTooltip.parentNode) {
            this._relicTooltip.parentNode.removeChild(this._relicTooltip);
        }
        if (this._abilityTooltip && this._abilityTooltip.parentNode) {
            this._abilityTooltip.parentNode.removeChild(this._abilityTooltip);
        }
    }
}
