import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    private animFrameId: number | null = null;
    private container: HTMLDivElement;

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
        this.scene.add(new THREE.AmbientLight(0xffeedd, 0.8));
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);
        const rim = new THREE.DirectionalLight(0xc9a96e, 0.3);
        rim.position.set(-5, 2, -5);
        this.scene.add(rim);

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
        this.controls.update();
    }

    startLoop() {
        const loop = () => {
            this.animFrameId = requestAnimationFrame(loop);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    setShowcaseMode(enabled: boolean) {
        this.controls.autoRotate = enabled;
        this.controls.autoRotateSpeed = 1.2;
        this.controls.enablePan = !enabled;
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
