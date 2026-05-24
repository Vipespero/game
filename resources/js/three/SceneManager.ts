import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    private animFrameId: number | null = null;
    private container: HTMLDivElement;
    private ambientLight: THREE.AmbientLight;
    private keyLight: THREE.DirectionalLight;
    private rimLight: THREE.DirectionalLight;
    private accentLight: THREE.PointLight;
    private baseTarget = new THREE.Vector3();
    private baseFov = 45;
    private showcaseEnabled = false;
    private showcaseStartedAt = 0;
    private showcaseObjects: THREE.Object3D[] = [];
    private objectBases = new Map<string, {
        position: THREE.Vector3;
        rotation: THREE.Euler;
    }>();

    constructor(container: HTMLDivElement) {
        this.container = container;

        const w = container.clientWidth  || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.style.width   = '100%';
        this.renderer.domElement.style.height  = '100%';
        this.renderer.domElement.style.display = 'block';
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d0d0d);

        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        // Luces
        this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.8);
        this.scene.add(this.ambientLight);

        this.keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.keyLight.position.set(5, 10, 7);
        this.scene.add(this.keyLight);

        this.rimLight = new THREE.DirectionalLight(0xc9a96e, 0.3);
        this.rimLight.position.set(-5, 2, -5);
        this.scene.add(this.rimLight);

        this.accentLight = new THREE.PointLight(0x48c7b8, 0, 8);
        this.accentLight.position.set(0, 2, 3);
        this.scene.add(this.accentLight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 20;

        window.addEventListener('resize', this.onResize);
    }

    fitCameraToModel(model: THREE.Object3D) {
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.set(center.x, center.y + size.y * 0.3, maxDim * 2.2);
        this.controls.target.copy(center);
        this.baseTarget.copy(center);
        this.controls.update();
    }

    startLoop() {
        const loop = () => {
            this.animFrameId = requestAnimationFrame(loop);
            this.applyShowcaseMotion();
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    setShowcaseMode(enabled: boolean, objects: THREE.Object3D[] = []) {
        if (this.showcaseEnabled && !enabled) {
            this.restoreShowcaseObjects();
        }

        this.showcaseEnabled = enabled;
        this.controls.autoRotate = enabled;
        this.controls.autoRotateSpeed = 0.85;
        this.controls.enablePan = !enabled;

        if (enabled) {
            this.showcaseStartedAt = performance.now();
            this.baseTarget.copy(this.controls.target);
            this.baseFov = this.camera.fov;
            this.captureShowcaseObjects(objects);
            return;
        }

        this.controls.target.copy(this.baseTarget);
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
        this.ambientLight.intensity = 0.8;
        this.keyLight.intensity = 1.0;
        this.rimLight.intensity = 0.3;
        this.accentLight.intensity = 0;
        this.scene.background = new THREE.Color(0x0d0d0d);
    }

    private applyShowcaseMotion() {
        if (!this.showcaseEnabled) return;

        const t = (performance.now() - this.showcaseStartedAt) / 1000;
        const slowPulse = Math.sin(t * 1.2);
        const fastPulse = Math.sin(t * 2.4);
        const walkStep = Math.sin(t * 6.2);
        const walkSway = Math.sin(t * 3.1);

        this.controls.target.copy(this.baseTarget);
        this.controls.target.y += slowPulse * 0.08;

        this.camera.fov = this.baseFov + slowPulse * 1.6;
        this.camera.updateProjectionMatrix();

        this.ambientLight.intensity = 0.72 + fastPulse * 0.06;
        this.keyLight.intensity = 0.95 + Math.sin(t * 1.6) * 0.12;
        this.rimLight.intensity = 0.48 + fastPulse * 0.18;
        this.accentLight.intensity = 0.65 + Math.sin(t * 1.8) * 0.28;
        this.accentLight.position.set(
            Math.sin(t * 0.72) * 3.6,
            this.baseTarget.y + 1.5 + Math.sin(t * 1.4) * 0.35,
            Math.cos(t * 0.72) * 3.6,
        );

        const warmth = 0.04 + (slowPulse + 1) * 0.012;
        this.scene.background = new THREE.Color(warmth, 0.035, 0.045);

        this.showcaseObjects.forEach((object) => {
            const base = this.objectBases.get(object.uuid);
            if (!base) return;

            object.position.copy(base.position);
            object.position.y += Math.abs(walkStep) * 0.035;
            object.rotation.copy(base.rotation);

            if (!(object as THREE.Mesh).isMesh) {
                object.rotation.z += walkSway * 0.018;
            }
        });
    }

    private captureShowcaseObjects(objects: THREE.Object3D[]) {
        this.restoreShowcaseObjects();
        this.showcaseObjects = objects;

        this.showcaseObjects.forEach((object) => {
            this.objectBases.set(object.uuid, {
                position: object.position.clone(),
                rotation: object.rotation.clone(),
            });
        });
    }

    private restoreShowcaseObjects() {
        this.showcaseObjects.forEach((object) => {
            const base = this.objectBases.get(object.uuid);
            if (!base) return;

            object.position.copy(base.position);
            object.rotation.copy(base.rotation);
        });

        this.showcaseObjects = [];
        this.objectBases.clear();
    }

    stopLoop() {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    private onResize = () => {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };

    dispose() {
        this.stopLoop();
        this.controls.dispose();
        this.scene.traverse((object) => {
            if (!(object as THREE.Mesh).isMesh) return;

            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();

            const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

            materials.forEach((material) => material.dispose());
        });
        this.renderer.dispose();
        this.renderer.domElement.remove();
        window.removeEventListener('resize', this.onResize);
    }
}
