import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import type { SceneManager } from './SceneManager';
import type { DecalState } from '@/types/tattoo';

export class TattooManager {
    private sceneManager: SceneManager;
    private meshMap      = new Map<string, THREE.Mesh>();
    private textureCache = new Map<string, THREE.Texture>();
    private previewMesh: THREE.Mesh | null = null;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
    }

    private getTintedTexture(url: string, color: string): THREE.Texture {
        const key = `${url}:${color}`;
        if (this.textureCache.has(key)) return this.textureCache.get(key)!;

        const canvas = document.createElement('canvas');
        const textureSize = 512;
        canvas.width = textureSize;
        canvas.height = textureSize;

        const fallbackCtx = canvas.getContext('2d');
        if (fallbackCtx) {
            fallbackCtx.clearRect(0, 0, canvas.width, canvas.height);
            fallbackCtx.fillStyle = color;
            fallbackCtx.beginPath();
            fallbackCtx.arc(textureSize / 2, textureSize / 2, textureSize * 0.36, 0, Math.PI * 2);
            fallbackCtx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.textureCache.set(key, texture);

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const imageWidth = image.naturalWidth || image.width;
            const imageHeight = image.naturalHeight || image.height;
            const scale = Math.min(canvas.width / imageWidth, canvas.height / imageHeight);
            const width = imageWidth * scale;
            const height = imageHeight * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;

            ctx.drawImage(image, x, y, width, height);
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            texture.needsUpdate = true;
        };
        image.src = url;

        return texture;
    }

    private buildMesh(
        targetMesh: THREE.Mesh,
        point: THREE.Vector3,
        normal: THREE.Vector3,
        size: number,
        rotation: number,
        imageUrl: string,
        color: string,
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
                map:                 this.getTintedTexture(imageUrl, color),
                transparent:         true,
                blending:            THREE.NormalBlending,
                alphaTest:           0.03,
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
        color: string,
    ) {
        this.clearPreview();
        const mesh = this.buildMesh(targetMesh, point, normal, size, rotation, imageUrl, color, 0.8);
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
        const mesh   = this.buildMesh(targetMesh, point, normal, decal.size, decal.rotation, decal.imageUrl, decal.color);
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

    getDecalMeshes(): THREE.Mesh[] {
        return [...this.meshMap.values()];
    }

    clearAll() {
        this.clearPreview();
        [...this.meshMap.keys()].forEach((id) => this.removeDecalMesh(id));
    }

    dispose() {
        this.clearAll();
        this.textureCache.forEach((texture) => texture.dispose());
        this.textureCache.clear();
    }
}
