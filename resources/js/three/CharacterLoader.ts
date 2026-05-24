import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneManager } from './SceneManager';

export class CharacterLoader {
    private loader = new GLTFLoader();
    private currentModel: THREE.Object3D | null = null;
    private sceneManager: SceneManager;
    private loadRequestId = 0;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
    }

    getMeshes(): THREE.Mesh[] {
        if (!this.currentModel) return [];
        const meshes: THREE.Mesh[] = [];
        this.currentModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
        });
        return meshes;
    }

    getCurrentModel(): THREE.Object3D | null {
        return this.currentModel;
    }

    getModelMetrics(): { center: THREE.Vector3; size: THREE.Vector3; maxDim: number } | null {
        if (!this.currentModel) return null;

        const box = new THREE.Box3().setFromObject(this.currentModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        return { center, size, maxDim };
    }

    getSuggestedTattooSize(): number {
        const metrics = this.getModelMetrics();
        if (!metrics) return 0.5;

        return THREE.MathUtils.clamp(metrics.maxDim * 0.16, 0.28, 2.2);
    }

    load(glbUrl: string, onProgress: (pct: number) => void): Promise<THREE.Object3D> {
        const requestId = ++this.loadRequestId;

        return new Promise((resolve, reject) => {
            if (this.currentModel) {
                this.removeCurrentModel();
            }

            this.loader.load(
                glbUrl,
                (gltf) => {
                    const model = gltf.scene;

                    if (requestId !== this.loadRequestId) {
                        this.disposeObject(model);
                        reject(new Error('Stale character load'));
                        return;
                    }

                    // Centrar modelo
                    const box    = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size   = box.getSize(new THREE.Vector3());
                    model.position.sub(center);
                    model.position.y += size.y / 2;

                    this.sceneManager.scene.add(model);
                    this.sceneManager.fitCameraToModel(model);
                    this.currentModel = model;
                    resolve(model);
                },
                (xhr) => {
                    if (xhr.total > 0) onProgress(Math.round((xhr.loaded / xhr.total) * 100));
                },
                reject,
            );
        });
    }

    dispose() {
        this.loadRequestId++;
        this.removeCurrentModel();
    }

    private removeCurrentModel() {
        if (!this.currentModel) return;
        this.sceneManager.scene.remove(this.currentModel);
        this.disposeObject(this.currentModel);
        this.currentModel = null;
    }

    private disposeObject(object: THREE.Object3D) {
        object.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;

            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();

            const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

            materials.forEach((material) => material.dispose());
        });
    }
}
