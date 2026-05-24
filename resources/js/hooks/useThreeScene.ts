import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneManager }    from '@/three/SceneManager';
import { CharacterLoader } from '@/three/CharacterLoader';
import { TattooManager }   from '@/three/TattooManager';
import { TouchHandler }    from '@/three/TouchHandler';
import type { Character, TattooDesign, DecalState, PendingTattoo } from '@/types/tattoo';

// Module-level singletons so they survive React re-renders
let sceneManager:  SceneManager    | null = null;
let charLoader:    CharacterLoader | null = null;
let tattooManager: TattooManager   | null = null;
let touchHandler:  TouchHandler    | null = null;

function getShowcaseObjects(): THREE.Object3D[] {
    return [
        ...(charLoader?.getCurrentModel() ? [charLoader.getCurrentModel()!] : []),
        ...(tattooManager?.getDecalMeshes() ?? []),
    ];
}

interface Options {
    activeCharacter:    Character | null;
    activeDesign:       TattooDesign | null;
    decals:             DecalState[];
    pending:            PendingTattoo | null;
    selectedColor:      string;
    showcaseMode:       boolean;
    onTap:              (pending: PendingTattoo) => void;
    onLoadStart:        () => void;
    onLoadEnd:          () => void;
}

export function useThreeScene(
    containerRef: React.RefObject<HTMLDivElement | null>,
    opts: Options,
) {
    // Always-fresh refs so closures see latest values
    const activeDesignRef = useRef(opts.activeDesign);
    useEffect(() => { activeDesignRef.current = opts.activeDesign; }, [opts.activeDesign]);

    const onTapRef = useRef(opts.onTap);
    useEffect(() => { onTapRef.current = opts.onTap; }, [opts.onTap]);

    const selectedColorRef = useRef(opts.selectedColor);
    useEffect(() => { selectedColorRef.current = opts.selectedColor; }, [opts.selectedColor]);

    const showcaseModeRef = useRef(opts.showcaseMode);
    useEffect(() => {
        showcaseModeRef.current = opts.showcaseMode;
        sceneManager?.setShowcaseMode(opts.showcaseMode, getShowcaseObjects());
    }, [opts.showcaseMode]);

    const loadRequestRef = useRef(0);

    // ── Init Three.js once on mount ──
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        sceneManager  = new SceneManager(container);
        charLoader    = new CharacterLoader(sceneManager);
        tattooManager = new TattooManager(sceneManager);

        touchHandler = new TouchHandler(container, ({ clientX, clientY }) => {
            const design = activeDesignRef.current;
            if (showcaseModeRef.current || !charLoader || !tattooManager || !sceneManager || !design) return;

            const meshes = charLoader.getMeshes();
            if (meshes.length === 0) return;

            const ndc      = TouchHandler.toNDC(clientX, clientY, container);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(ndc, sceneManager.camera);

            const hits = raycaster.intersectObjects(meshes, true);
            if (hits.length === 0) return;

            const hit = hits[0];
            const hitMesh = hit.object as THREE.Mesh;
            const worldNormal = hit.face
                ? hit.face.normal.clone().transformDirection(hitMesh.matrixWorld)
                : sceneManager.camera.position.clone().sub(hit.point).normalize();

            const pending: PendingTattoo = {
                designId:           design.id,
                imageUrl:           design.image_url,
                color:              selectedColorRef.current,
                size:               0.5,
                rotation:           0,
                intersectionPoint:  { x: hit.point.x,    y: hit.point.y,    z: hit.point.z },
                intersectionNormal: { x: worldNormal.x,  y: worldNormal.y,  z: worldNormal.z },
                meshName:           hitMesh.name,
                meshUuid:           hitMesh.uuid,
            };

            onTapRef.current(pending);

            tattooManager.showPreview(
                hitMesh,
                hit.point,
                worldNormal,
                pending.size,
                pending.rotation,
                pending.imageUrl,
                pending.color,
            );
        });

        sceneManager.startLoop();

        return () => {
            touchHandler?.dispose();
            tattooManager?.dispose();
            charLoader?.dispose();
            sceneManager?.dispose();
            sceneManager  = null;
            charLoader    = null;
            tattooManager = null;
            touchHandler  = null;
        };
    }, []); // mount once

    // ── Load character when it changes ──
    useEffect(() => {
        if (!opts.activeCharacter) return;
        const char = opts.activeCharacter;
        const requestId = ++loadRequestRef.current;

        const doLoad = () => {
            if (!charLoader || !tattooManager) return;
            opts.onLoadStart();
            tattooManager.clearAll();
            charLoader
                .load(char.glb_url, (pct) => {
                    if (import.meta.env.DEV) console.debug(`${char.name}: ${pct}%`);
                })
                .catch((err) => {
                    if (requestId === loadRequestRef.current) {
                        console.error('Error GLB:', err);
                    }
                })
                .finally(() => {
                    if (requestId === loadRequestRef.current) {
                        sceneManager?.setShowcaseMode(showcaseModeRef.current, getShowcaseObjects());
                        opts.onLoadEnd();
                    }
                });
        };

        if (!charLoader) {
            const id = setTimeout(doLoad, 150);
            return () => clearTimeout(id);
        }
        doLoad();
    }, [opts.activeCharacter?.id]);

    // ── Update preview when sliders change ──
    useEffect(() => {
        if (!tattooManager || !opts.pending || !charLoader) return;
        const p      = opts.pending;
        const meshes = charLoader.getMeshes();
        const target = meshes.find((m) => m.uuid === p.meshUuid)
            ?? meshes.find((m) => m.name === p.meshName)
            ?? meshes[0];
        if (!target) return;

        tattooManager.showPreview(
            target,
            new THREE.Vector3(p.intersectionPoint.x,  p.intersectionPoint.y,  p.intersectionPoint.z),
            new THREE.Vector3(p.intersectionNormal.x, p.intersectionNormal.y, p.intersectionNormal.z),
            p.size,
            p.rotation,
            p.imageUrl,
            p.color,
        );
    }, [opts.pending]);

    // ── Sync confirmed decals → scene ──
    useEffect(() => {
        if (!tattooManager || !charLoader) return;
        const meshes = charLoader.getMeshes();
        opts.decals.forEach((decal) => {
            if (tattooManager!.getMeshForDecal(decal.id)) return;
            const target = meshes.find((m) => m.uuid === decal.meshUuid)
                ?? meshes.find((m) => m.name === decal.meshName)
                ?? meshes[0];
            if (!target) return;
            tattooManager!.applyDecal(decal, target);
        });

        if (showcaseModeRef.current) {
            sceneManager?.setShowcaseMode(true, getShowcaseObjects());
        }
    }, [opts.decals]);

    return {
        clearPreview:         () => tattooManager?.clearPreview(),
        clearDecalsFromScene: () => tattooManager?.clearAll(),
        removeDecalFromScene: (id: string) => tattooManager?.removeDecalMesh(id),
        setShowcaseMode:      (enabled: boolean) => sceneManager?.setShowcaseMode(enabled, getShowcaseObjects()),
    };
}
