import { SHROUD_MUTATION } from '../constants.js';

export class ShroudMutationManager {
    constructor(scene) {
        this.scene = scene;
        this.timer = 0;
        this.warningActive = false;
        this.warningTimer = 0;
        this.mutationIndex = 0;
        this.surgeTimer = 0;
        this.surgeActive = false;
    }

    update(delta) {
        // Manage active speed surge
        if (this.surgeActive) {
            this.surgeTimer -= delta;
            if (this.surgeTimer <= 0) {
                this.surgeActive = false;
                this.scene.events.emit('shroudMutationSurgeEnd');
            }
        }

        // Warning countdown
        if (this.warningActive) {
            this.warningTimer -= delta;
            if (this.warningTimer <= 0) {
                this.warningActive = false;
                this._executeMutation();
            }
            return;
        }

        // Main timer
        this.timer += delta;
        if (this.timer >= SHROUD_MUTATION.INTERVAL) {
            this.timer -= SHROUD_MUTATION.INTERVAL;
            this._startWarning();
        }
    }

    _startWarning() {
        this.warningActive = true;
        this.warningTimer = SHROUD_MUTATION.WARNING_LEAD;

        const mutation = SHROUD_MUTATION.TYPES[this.mutationIndex % SHROUD_MUTATION.TYPES.length];
        this.scene.events.emit('shroudMutationWarning', mutation);
    }

    _executeMutation() {
        const mutation = SHROUD_MUTATION.TYPES[this.mutationIndex % SHROUD_MUTATION.TYPES.length];
        this.mutationIndex++;
        this.scene.events.emit('shroudMutation', mutation);

        if (mutation.id === 'speed_surge') {
            this.surgeActive = true;
            this.surgeTimer = 5000;
        }
    }
}
