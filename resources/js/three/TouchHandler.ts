import * as THREE from 'three';

interface TapEvent { clientX: number; clientY: number }

export class TouchHandler {
    private el: HTMLElement;
    private onTap: (e: TapEvent) => void;
    private startX = 0;
    private startY = 0;
    private startTime = 0;
    private moved = false;

    private readonly MOVE_PX = 8;
    private readonly TAP_MS  = 600;

    constructor(el: HTMLElement, onTap: (e: TapEvent) => void) {
        this.el    = el;
        this.onTap = onTap;
        el.addEventListener('touchstart', this.onTouchStart, { passive: true });
        el.addEventListener('touchmove',  this.onTouchMove,  { passive: true });
        el.addEventListener('touchend',   this.onTouchEnd,   { passive: true });
        el.addEventListener('click',      this.onClick);
    }

    private onTouchStart = (e: TouchEvent) => {
        this.startX    = e.touches[0].clientX;
        this.startY    = e.touches[0].clientY;
        this.startTime = Date.now();
        this.moved     = false;
    };

    private onTouchMove = (e: TouchEvent) => {
        const dx = e.touches[0].clientX - this.startX;
        const dy = e.touches[0].clientY - this.startY;
        if (Math.hypot(dx, dy) > this.MOVE_PX) this.moved = true;
    };

    private onTouchEnd = (e: TouchEvent) => {
        if (this.moved || Date.now() - this.startTime > this.TAP_MS) return;
        const t = e.changedTouches[0];
        this.onTap({ clientX: t.clientX, clientY: t.clientY });
    };

    private onClick = (e: MouseEvent) => {
        if ('ontouchstart' in window) return;
        this.onTap({ clientX: e.clientX, clientY: e.clientY });
    };

    static toNDC(clientX: number, clientY: number, el: HTMLElement): THREE.Vector2 {
        const r = el.getBoundingClientRect();
        return new THREE.Vector2(
            ((clientX - r.left) / r.width)  *  2 - 1,
            ((clientY - r.top)  / r.height) * -2 + 1,
        );
    }

    dispose() {
        this.el.removeEventListener('touchstart', this.onTouchStart);
        this.el.removeEventListener('touchmove',  this.onTouchMove);
        this.el.removeEventListener('touchend',   this.onTouchEnd);
        this.el.removeEventListener('click',      this.onClick);
    }
}