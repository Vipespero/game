import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import type { SceneManager } from './SceneManager';
import type { DecalState } from '@/types/tattoo';

export class TattooManager {
    private sceneManager: SceneManager;
    private meshMap      = new Map<string, THREE.Mesh>();
    private textureCache = new Map<string, THREE.Texture>();
    private texLoader    = new THREE.TextureLoader();
    private previewMesh: THREE.Mesh | null = null;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
    }

    private getTexture(url: string): THREE.Texture {
        if (this.textureCache.has(url)) return this.textureCache.get(url)!;
        const tex = this.texLoader.load(url);
        this.textureCache.set(url, tex);
        return tex;
    }

    private buildMesh(
        targetMesh: THREE.Mesh,
        point: THREE.Vector3,
        normal: THREE.Vector3,
        size: number,
        rotation: number,
        imageUrl: string,
        opacity = 1.0,
    ): THREE.Mesh | null {
        try {
            const n = normal.clone().add(point);
            const m = new THREE.Matrix4();
            m.lookAt(point, n, new THREE.Vector3(0, 1, 0));
            const euler = new THREE.Euler().setFromRotationMatrix(m);
            euler.z += THREE.MathUtils.degToRad(rotation);

            const geo = new DecalGeometry(
                targetMesh, point, euler, new THREE.Vector3(size, size, size),
            );
            const mat = new THREE.MeshBasicMaterial({
                map:                 this.getTexture(imageUrl),
                transparent:         true,
                blending:            THREE.AdditiveBlending,
                depthTest:           true,
                depthWrite:          false,
                polygonOffset:       true,
                polygonOffsetFactor: -4,
                opacity,
            });
            return new THREE.Mesh(geo, mat);
        } catch {
            return null;
        }
    }

    // ── Preview ──
    showPreview(
        targetMesh: THREE.Mesh,
        point: THREE.Vector3,
        normal: THREE.Vector3,
        size: number,
        rotation: number,
        imageUrl: string,
    ) {
        this.clearPreview();
        const mesh = this.buildMesh(targetMesh, point, normal, size, rotation, imageUrl, 0.8);
        if (!mesh) return;
        this.previewMesh = mesh;
        this.sceneManager.scene.add(mesh);
    }

    clearPreview() {
        if (this.previewMesh) {
            this.sceneManager.scene.remove(this.previewMesh);
            this.previewMesh.geometry.dispose();
            (this.previewMesh.material as THREE.Material).dispose();
            this.previewMesh = null;
        }
    }

    // ── Confirmed decals ──
    applyDecal(decal: DecalState, targetMesh: THREE.Mesh) {
        this.removeDecalMesh(decal.id);
        const point  = new THREE.Vector3(decal.intersectionPoint.x,  decal.intersectionPoint.y,  decal.intersectionPoint.z);
        const normal = new THREE.Vector3(decal.intersectionNormal.x, decal.intersectionNormal.y, decal.intersectionNormal.z);
        const mesh   = this.buildMesh(targetMesh, point, normal, decal.size, decal.rotation, decal.imageUrl);
        if (!mesh) return;
        this.meshMap.set(decal.id, mesh);
        this.sceneManager.scene.add(mesh);
    }

    removeDecalMesh(id: string) {
        const mesh = this.meshMap.get(id);
        if (!mesh) return;
        this.sceneManager.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.meshMap.delete(id);
    }

    getMeshForDecal(id: string): THREE.Mesh | undefined {
        return this.meshMap.get(id);
    }

    clearAll() {
        this.clearPreview();
        [...this.meshMap.keys()].forEach((id) => this.removeDecalMesh(id));
    }
}