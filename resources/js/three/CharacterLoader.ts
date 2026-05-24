import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneManager } from './SceneManager';

export class CharacterLoader {
    private loader = new GLTFLoader();
    private currentModel: THREE.Object3D | null = null;
    private sceneManager: SceneManager;

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

    load(glbUrl: string, onProgress: (pct: number) => void): Promise<THREE.Object3D> {
        return new Promise((resolve, reject) => {
            if (this.currentModel) {
                this.sceneManager.scene.remove(this.currentModel);
                this.currentModel = null;
            }

            this.loader.load(
                glbUrl,
                (gltf) => {
                    const model = gltf.scene;

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
}