import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import {
  useGLTF,
  CameraControls,
  CameraControlsImpl,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import manifestData from "../data/gallery_manifest.json";
import {
  ArrowLeft,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  Info,
  X,
  Loader2,
  Maximize2,
  Compass,
} from "lucide-react";

export interface GarmentManifestItem {
  id: string;
  meshName: string;
  backdropName: string;
  title: string;
  era: string;
  tourOrder: number;
  rotatable: boolean;
  studio360Enabled: boolean;
  highlightFront: string;
  highlightBack: string;
  pedestalOrigin: [number, number, number];
  cameraPosition: [number, number, number];
  targetPosition: [number, number, number];
}

export interface VietPhucGalleryProps {
  embedded?: boolean;
  initialGarmentId?: string;
  onBackToStudio?: () => void;
  onRemixGarment?: (galleryId: string) => void;
}

const STUDIO_THEMES = {
  warm: "#EAE4DC",
  dark: "#161412",
} as const;

const CORRIDOR_BG = "#1A120E";

// -----------------------------------------------------------------------------
// MATH & GEOMETRY UTILITIES (BATTLE-TESTED 3D CORRIDOR ENGINE)
// -----------------------------------------------------------------------------

function computeOverviewArc(yaw: number, isPortrait: boolean) {
  // Lùi về 7.55m (ngưỡng an toàn sát cửa hành lang, không bị lộ rìa sàn/mái)
  const baseZ = isPortrait ? 7.55 : 7.6;
  const camY = isPortrait ? 1.68 : 1.92;

  const camX = Math.sin(yaw) * 0.26;
  const camZ = baseZ + (1 - Math.cos(yaw)) * 0.15;

  const lookRadius = 8.5;
  const targetX = Math.sin(yaw) * lookRadius;
  const targetY = isPortrait ? 1.05 : 1.15;
  const targetZ = camZ - Math.cos(yaw) * lookRadius;

  return { camX, camY, camZ, targetX, targetY, targetZ };
}

function findGarmentRoot(
  root: THREE.Object3D,
  g: GarmentManifestItem,
): THREE.Object3D | null {
  const exact = root.getObjectByName(g.meshName);
  if (exact) {
    let hasMesh = false;
    exact.traverse((c) => {
      if (c instanceof THREE.Mesh) hasMesh = true;
    });
    if (hasMesh) return exact;
  }

  let matched: THREE.Object3D | null = null;
  const prefix = g.meshName.toLowerCase();
  root.traverse((obj) => {
    if (matched) return;
    const nameLower = obj.name.toLowerCase();
    const isIdMatch = obj.userData?.garment_id === g.id;
    const isPrefixMatch =
      nameLower === prefix ||
      nameLower.startsWith(prefix + "_") ||
      nameLower.startsWith(prefix + ".");

    if (isIdMatch || isPrefixMatch) {
      let hasMesh = false;
      obj.traverse((c) => {
        if (c instanceof THREE.Mesh) hasMesh = true;
      });
      if (hasMesh) {
        matched = obj;
      }
    }
  });

  return matched;
}

/**
 * Normalizes garment geometry pivot to the true pedestal center and computes
 * PCA shoulder-axis alignment yaw clamped to [-PI/2, +PI/2] to prevent 180° flips.
 */
function normalizePivotAndComputeFrontYaw(obj: THREE.Object3D): {
  pedestalPos: THREE.Vector3;
  frontAlignYaw: number;
} {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const pedPos = new THREE.Vector3(center.x, Math.max(0, box.min.y), center.z);

  // Recenter geometry vertices if object origin is offset from pedestal center
  const objWorldPos = new THREE.Vector3();
  obj.getWorldPosition(objWorldPos);
  if (Math.hypot(objWorldPos.x - pedPos.x, objWorldPos.z - pedPos.z) > 0.05) {
    const localTarget = obj.worldToLocal(pedPos.clone());
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry = child.geometry.clone();
        child.geometry.translate(
          -localTarget.x,
          -localTarget.y,
          -localTarget.z,
        );
      }
    });
    if (obj.parent) {
      obj.position.copy(obj.parent.worldToLocal(pedPos.clone()));
    } else {
      obj.position.copy(pedPos);
    }
    obj.updateWorldMatrix(true, true);
  }

  // 2D PCA on outer sleeve/shoulder vertices to find true shoulder axis
  let sXX = 0;
  let sZZ = 0;
  let sXZ = 0;
  let count = 0;
  const vWorld = new THREE.Vector3();
  const minY = box.min.y;

  obj.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const posAttr = child.geometry.attributes.position;
      if (!posAttr) return;
      for (let i = 0; i < posAttr.count; i++) {
        vWorld.fromBufferAttribute(posAttr, i).applyMatrix4(child.matrixWorld);
        const relY = vWorld.y - minY;
        if (relY >= 0.88 && relY <= 1.48) {
          const dx = vWorld.x - pedPos.x;
          const dz = vWorld.z - pedPos.z;
          if (dx * dx + dz * dz > 0.068) {
            sXX += dx * dx;
            sZZ += dz * dz;
            sXZ += dx * dz;
            count++;
          }
        }
      }
    }
  });

  if (count < 6) {
    return { pedestalPos: pedPos, frontAlignYaw: 0 };
  }

  const shoulderAngle = 0.5 * Math.atan2(2 * sXZ, sXX - sZZ);
  const normalAngle = shoulderAngle + Math.PI * 0.5;
  const nx = Math.cos(normalAngle);
  const nz = Math.sin(normalAngle);

  const toCamX = pedPos.x < -0.5 ? 1.0 : pedPos.x > 0.5 ? -1.0 : 0.0;
  const toCamZ = Math.abs(pedPos.x) <= 0.5 ? 1.0 : 0.0;

  const currentFrontAzimuth = Math.atan2(nx, nz);
  const desiredCamAzimuth = Math.atan2(toCamX, toCamZ);

  let deltaYaw = desiredCamAzimuth - currentFrontAzimuth;
  while (deltaYaw > Math.PI * 0.5) deltaYaw -= Math.PI;
  while (deltaYaw < -Math.PI * 0.5) deltaYaw += Math.PI;

  return { pedestalPos: pedPos, frontAlignYaw: deltaYaw };
}

/**
 * Adaptive framing for Desktop (2/3 model - 1/3 info card) and Mobile Portrait
 * (shifts target downward when bottom drawer is open so model sits in upper viewport).
 */
function computeGarmentFraming(
  pedestalPos: THREE.Vector3,
  isPortrait: boolean,
  isInfoOpen: boolean,
  inStudio: boolean,
) {
  const targetY = pedestalPos.y + 0.98;
  const camY = pedestalPos.y + 1.08;

  const dist = isPortrait
    ? isInfoOpen && !inStudio
      ? 2.85 // Cũ là 2.45 (khi mở bảng thuyết minh trên Mobile)
      : 2.65 // Cũ là 2.1 (khi thu gọn thuyết minh như trong ảnh của bạn)
    : inStudio
      ? 2.55 // Cũ là 2.1
      : 2.65; // Cũ là 2.15 (trên Desktop)

  const baseTarget = new THREE.Vector3(pedestalPos.x, targetY, pedestalPos.z);
  const baseCam = new THREE.Vector3();

  if (pedestalPos.x < -0.5) {
    baseCam.set(pedestalPos.x + dist, camY, pedestalPos.z);
  } else if (pedestalPos.x > 0.5) {
    baseCam.set(pedestalPos.x - dist, camY, pedestalPos.z);
  } else {
    baseCam.set(pedestalPos.x, camY + 0.04, pedestalPos.z + dist * 1.06);
  }

  const forward = new THREE.Vector3()
    .subVectors(baseTarget, baseCam)
    .normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const rightVec = new THREE.Vector3().crossVectors(forward, up).normalize();

  // Desktop 2/3 - 1/3 shift when info card is open
  const desktopThirdsShift =
    !isPortrait && isInfoOpen && !inStudio ? 0.28 : 0.0;

  baseCam.addScaledVector(rightVec, desktopThirdsShift);
  baseTarget.addScaledVector(rightVec, desktopThirdsShift);

  // Mobile Portrait: shift camera look-at downward so garment sits above bottom drawer
  if (isPortrait && !inStudio) {
    baseTarget.y += isInfoOpen ? -0.32 : -0.02;
  }

  return {
    cam: [baseCam.x, baseCam.y, baseCam.z] as [number, number, number],
    target: [baseTarget.x, baseTarget.y, baseTarget.z] as [
      number,
      number,
      number,
    ],
  };
}

// -----------------------------------------------------------------------------
// 3D SCENE CONTENT (GLB + CAMERA CONTROLS + STUDIO ISOLATION)
// -----------------------------------------------------------------------------

function SceneContent({
  glbUrl,
  activeId,
  isStudio360,
  isInfoOpen,
  studioTheme,
  garments,
  targetYawRef,
  overviewYawRef,
  dragDistanceRef,
  onSelectGarment,
}: {
  glbUrl: string;
  activeId: string;
  isStudio360: boolean;
  isInfoOpen: boolean;
  studioTheme: "warm" | "dark";
  garments: GarmentManifestItem[];
  targetYawRef: React.MutableRefObject<number>;
  overviewYawRef: React.MutableRefObject<number>;
  dragDistanceRef: React.MutableRefObject<number>;
  onSelectGarment: (id: string) => void;
}) {
  const { scene: gltfScene } = useGLTF(glbUrl);
  const { size } = useThree();
  const controlsRef = useRef<CameraControls>(null);
  const appliedOverviewYawRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  const isPortrait = size.width < size.height;
  const activeGarment = useMemo(
    () => garments.find((g) => g.id === activeId) || null,
    [garments, activeId],
  );

  const inStudio = isStudio360 && activeGarment !== null;
  const bgColor = inStudio ? STUDIO_THEMES[studioTheme] : CORRIDOR_BG;

  const garmentRootsRef = useRef<Record<string, THREE.Object3D>>({});
  const initialRotations = useRef<Record<string, number>>({});
  const frontAlignOffsets = useRef<Record<string, number>>({});
  const truePedestalPositions = useRef<Record<string, THREE.Vector3>>({});

  const [pedestalCoords, setPedestalCoords] = useState<
    Record<string, [number, number, number]>
  >({});

  const ensureGarmentMetrics = (g: GarmentManifestItem) => {
    if (!truePedestalPositions.current[g.meshName]) {
      const rootObj = findGarmentRoot(gltfScene, g);
      if (rootObj) {
        garmentRootsRef.current[g.meshName] = rootObj;
        initialRotations.current[g.meshName] = rootObj.rotation.y;
        const { pedestalPos, frontAlignYaw } =
          normalizePivotAndComputeFrontYaw(rootObj);
        truePedestalPositions.current[g.meshName] = pedestalPos;
        frontAlignOffsets.current[g.meshName] = frontAlignYaw;
      }
    }
    return (
      truePedestalPositions.current[g.meshName] ||
      new THREE.Vector3(...g.pedestalOrigin)
    );
  };

  useEffect(() => {
    gltfScene.updateMatrixWorld(true);
    const nextCoords: Record<string, [number, number, number]> = {};
    garments.forEach((g) => {
      const pos = ensureGarmentMetrics(g);
      nextCoords[g.meshName] = [pos.x, pos.y, pos.z];
    });
    setPedestalCoords(nextCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfScene, garments]);

  // Complete Hierarchy Isolation in Studio 360° Mode
  useEffect(() => {
    if (!inStudio || !activeGarment) {
      gltfScene.traverse((obj) => {
        obj.visible = true;
      });
      return;
    }

    const targetRoot =
      garmentRootsRef.current[activeGarment.meshName] ||
      findGarmentRoot(gltfScene, activeGarment);

    if (!targetRoot) return;

    const visibleSet = new Set<THREE.Object3D>();
    targetRoot.traverse((child) => {
      visibleSet.add(child);
    });
    let parent: THREE.Object3D | null = targetRoot.parent;
    while (parent) {
      visibleSet.add(parent);
      parent = parent.parent;
    }

    gltfScene.traverse((obj) => {
      obj.visible = visibleSet.has(obj);
    });
  }, [inStudio, activeGarment, gltfScene]);

  // Smooth Camera Transitions & Adaptive Framing
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    void controls.zoomTo(1, true);

    if (activeId === "overview" || !activeGarment) {
      overviewYawRef.current = 0;
      appliedOverviewYawRef.current = 0;
      const { camX, camY, camZ, targetX, targetY, targetZ } =
        computeOverviewArc(0, isPortrait);
      const shouldTransition = hasInitializedRef.current;
      hasInitializedRef.current = true;
      void controls.setLookAt(
        camX,
        camY,
        camZ,
        targetX,
        targetY,
        targetZ,
        shouldTransition,
      );
      targetYawRef.current = 0;
    } else {
      hasInitializedRef.current = true;
      const realPos = ensureGarmentMetrics(activeGarment);
      const { cam, target } = computeGarmentFraming(
        realPos,
        isPortrait,
        isInfoOpen,
        inStudio,
      );

      void controls.setLookAt(
        cam[0],
        cam[1],
        cam[2],
        target[0],
        target[1],
        target[2],
        true,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeId,
    activeGarment,
    inStudio,
    isPortrait,
    isInfoOpen,
    gltfScene,
    targetYawRef,
    overviewYawRef,
  ]);

  // Frame loop: damp overview look-around and damp individual pedestal rotations
  useFrame((_, delta) => {
    if (activeId === "overview" && !inStudio && controlsRef.current) {
      const diff = overviewYawRef.current - appliedOverviewYawRef.current;
      if (Math.abs(diff) > 0.0001) {
        appliedOverviewYawRef.current = THREE.MathUtils.damp(
          appliedOverviewYawRef.current,
          overviewYawRef.current,
          8,
          delta,
        );
        const { camX, camY, camZ, targetX, targetY, targetZ } =
          computeOverviewArc(appliedOverviewYawRef.current, isPortrait);
        void controlsRef.current.setLookAt(
          camX,
          camY,
          camZ,
          targetX,
          targetY,
          targetZ,
          false,
        );
      }
    }

    garments.forEach((g) => {
      const obj =
        garmentRootsRef.current[g.meshName] || findGarmentRoot(gltfScene, g);
      if (!obj) return;

      const baseRot = initialRotations.current[g.meshName] ?? obj.rotation.y;
      const alignOffset = frontAlignOffsets.current[g.meshName] ?? 0;

      const desiredRot =
        g.id === activeId
          ? baseRot + alignOffset + (isStudio360 ? 0 : targetYawRef.current)
          : baseRot;

      obj.rotation.y = THREE.MathUtils.damp(
        obj.rotation.y,
        desiredRot,
        6.5,
        delta,
      );
    });
  });

  // Click on any garment in 3D scene to fly directly to it
  const handleSceneClick = (e: ThreeEvent<MouseEvent>) => {
    if (isStudio360 || dragDistanceRef.current > 8) return;
    e.stopPropagation();

    let curr: THREE.Object3D | null = e.object;
    while (curr) {
      if (typeof curr.userData?.garment_id === "string") {
        onSelectGarment(curr.userData.garment_id);
        return;
      }
      const nameLower = curr.name.toLowerCase();
      const matched = garments.find((g) => {
        const prefix = g.meshName.toLowerCase();
        return (
          nameLower === prefix ||
          nameLower.startsWith(prefix + "_") ||
          nameLower.startsWith(prefix + ".")
        );
      });
      if (matched) {
        onSelectGarment(matched.id);
        return;
      }
      curr = curr.parent;
    }
  };

  const activeCoords = activeGarment
    ? pedestalCoords[activeGarment.meshName] || activeGarment.pedestalOrigin
    : null;

  return (
    <>
      <color attach="background" args={[bgColor]} />
      {!inStudio && <fogExp2 attach="fog" args={[CORRIDOR_BG, 0.045]} />}

      <CameraControls
        ref={controlsRef}
        smoothTime={0.55}
        mouseButtons={{
          left: inStudio
            ? CameraControlsImpl.ACTION.ROTATE
            : CameraControlsImpl.ACTION.NONE,
          middle: CameraControlsImpl.ACTION.ZOOM,
          right: CameraControlsImpl.ACTION.NONE,
          wheel: CameraControlsImpl.ACTION.ZOOM,
        }}
        touches={{
          one: inStudio
            ? CameraControlsImpl.ACTION.TOUCH_ROTATE
            : CameraControlsImpl.ACTION.NONE,
          two: CameraControlsImpl.ACTION.TOUCH_ZOOM,
          three: CameraControlsImpl.ACTION.NONE,
        }}
        minZoom={0.8}
        maxZoom={2.4}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.55}
      />

      <Environment
        preset={inStudio ? "studio" : "apartment"}
        environmentIntensity={inStudio ? 0.9 : 0.55}
      />
      <ambientLight intensity={inStudio ? 0.55 : 0.38} />

      {activeCoords && (
        <spotLight
          position={[
            activeCoords[0] + (activeCoords[0] < 0 ? 1.5 : -1.5),
            activeCoords[1] + 2.4,
            activeCoords[2] + 1.1,
          ]}
          intensity={inStudio ? 2.6 : 3.2}
          color={inStudio ? "#FFFDF8" : "#FFE0B2"}
          angle={0.65}
          penumbra={0.85}
        />
      )}

      {inStudio && activeCoords && (
        <ContactShadows
          position={[activeCoords[0], activeCoords[1] + 0.005, activeCoords[2]]}
          opacity={0.42}
          scale={4.5}
          blur={2.2}
          frames={1}
        />
      )}

      <primitive object={gltfScene} onClick={handleSceneClick} />
    </>
  );
}

// Fallback procedural showroom when GLB is not yet loaded
function ProceduralShowroomFallback({
  garments,
  selectedId,
  isStudio360,
  targetYawRef,
}: {
  garments: GarmentManifestItem[];
  selectedId: string;
  isStudio360: boolean;
  targetYawRef: React.MutableRefObject<number>;
}) {
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});

  useFrame((_, delta) => {
    garments.forEach((g) => {
      const grp = groupRefs.current[g.id];
      if (!grp) return;
      const desired =
        g.id === selectedId && !isStudio360 ? targetYawRef.current : 0;
      grp.rotation.y = THREE.MathUtils.damp(
        grp.rotation.y,
        desired,
        6.5,
        delta,
      );
    });
  });

  return (
    <group>
      <ambientLight intensity={0.85} color="#fff6e5" />
      <directionalLight position={[5, 9, 6]} intensity={1.4} color="#ffeedd" />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 30]} />
        <meshStandardMaterial color="#211814" roughness={0.7} metalness={0.1} />
      </mesh>

      {garments.map((g) => {
        const isSelected = g.id === selectedId;
        if (isStudio360 && !isSelected) return null;
        const [px, py, pz] = g.pedestalOrigin;

        return (
          <group
            key={g.id}
            position={[px, py, pz]}
            ref={(el) => {
              groupRefs.current[g.id] = el;
            }}
          >
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.9, 0.98, 0.24, 32]} />
              <meshStandardMaterial color="#3e2723" roughness={0.5} />
            </mesh>
            <group position={[0, 1.25, 0]}>
              <mesh>
                <coneGeometry args={[0.42, 1.1, 24]} />
                <meshStandardMaterial
                  color={
                    g.id === "giao_linh"
                      ? "#2A7B76"
                      : g.id === "tu_than"
                        ? "#6b4226"
                        : g.id === "ngu_than"
                          ? "#1e3a8a"
                          : g.id === "ao_dai"
                            ? "#ec4899"
                            : "#d97706"
                  }
                  roughness={0.45}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT: VIET PHUC GALLERY (3D SHOWROOM)
// -----------------------------------------------------------------------------

export const VietPhucGallery: React.FC<VietPhucGalleryProps> = ({
  embedded = false,
  initialGarmentId = "overview",
  onBackToStudio,
  onRemixGarment,
}) => {
  const garments = useMemo(
    () =>
      [...(manifestData.garments as GarmentManifestItem[])].sort(
        (a, b) => a.tourOrder - b.tourOrder,
      ),
    [],
  );

  const [selectedId, setSelectedId] = useState<string>(initialGarmentId);
  const [isStudio360, setIsStudio360] = useState<boolean>(false);
  const [studioTheme, setStudioTheme] = useState<"warm" | "dark">("warm");
  const [viewingSide, setViewingSide] = useState<"front" | "back">("front");
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Refs for smooth pointer drag rotation & overview arc
  const targetYawRef = useRef<number>(0);
  const overviewYawRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevXRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);

  // GLB Model verification & dynamic upload state
  const [glbUrl, setGlbUrl] = useState<string | null>(
    "/models/viet_phuc_gallery.glb",
  );
  const [glbStatus, setGlbStatus] = useState<"checking" | "ready" | "missing">(
    "ready",
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync initialGarmentId if prop changes
  useEffect(() => {
    if (initialGarmentId) {
      setSelectedId(initialGarmentId);
      setViewingSide("front");
      targetYawRef.current = 0;
      if (initialGarmentId === "overview") {
        setIsStudio360(false);
      }
    }
  }, [initialGarmentId]);

  // Verify GLB exists on server
  useEffect(() => {
    let isMounted = true;
    const checkGlb = async () => {
      try {
        const res = await fetch("/models/viet_phuc_gallery.glb", {
          method: "HEAD",
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && !contentType.includes("text/html")) {
          if (isMounted) {
            setGlbUrl("/models/viet_phuc_gallery.glb");
            setGlbStatus("ready");
          }
        } else {
          if (isMounted) {
            setGlbStatus("missing");
          }
        }
      } catch {
        if (isMounted) {
          setGlbStatus("missing");
        }
      }
    };
    checkGlb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle file upload fallback
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const objectUrl = URL.createObjectURL(file);
      setGlbUrl(objectUrl);
      setGlbStatus("ready");

      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-glb", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: arrayBuffer,
      });

      if (!res.ok) {
        console.warn(
          "Backend failed to persist GLB permanently, using memory URL",
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể nạp tệp mô hình 3D.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const currentGarment = useMemo(
    () => garments.find((g) => g.id === selectedId) || null,
    [garments, selectedId],
  );

  // Navigate between garments
  const handleSelectGarment = useCallback((id: string) => {
    setSelectedId(id);
    setViewingSide("front");
    targetYawRef.current = 0;
    if (id === "overview") {
      setIsStudio360(false);
    }
  }, []);

  const rotateToSide = (side: "front" | "back") => {
    setViewingSide(side);
    targetYawRef.current = side === "front" ? 0 : Math.PI;
  };

  const handleNextGarment = () => {
    if (selectedId === "overview") {
      handleSelectGarment(garments[0].id);
      return;
    }
    const idx = garments.findIndex((g) => g.id === selectedId);
    const nextIdx = (idx + 1) % garments.length;
    handleSelectGarment(garments[nextIdx].id);
  };

  const handlePrevGarment = () => {
    if (selectedId === "overview") {
      handleSelectGarment(garments[garments.length - 1].id);
      return;
    }
    const idx = garments.findIndex((g) => g.id === selectedId);
    const prevIdx = (idx - 1 + garments.length) % garments.length;
    handleSelectGarment(garments[prevIdx].id);
  };

  // Pointer drag handlers for rotating pedestal or panning overview
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isStudio360) return;
    isDraggingRef.current = true;
    prevXRef.current = e.clientX;
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isStudio360) return;
    const deltaX = e.clientX - prevXRef.current;
    prevXRef.current = e.clientX;
    dragDistanceRef.current += Math.abs(deltaX);

    if (selectedId === "overview") {
      const maxArc = isMobile ? 0.46 : 0.28;
      overviewYawRef.current = THREE.MathUtils.clamp(
        overviewYawRef.current - deltaX * 0.0035,
        -maxArc,
        maxArc,
      );
    } else {
      targetYawRef.current += deltaX * 0.012;
      const norm = Math.abs(targetYawRef.current % (Math.PI * 2));
      setViewingSide(
        norm > Math.PI * 0.5 && norm < Math.PI * 1.5 ? "back" : "front",
      );
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
      className={`relative min-h-0 w-full ${
        embedded ? "h-[min(620px,100dvh)] max-h-full" : "h-full max-h-full"
      } overflow-hidden bg-[#1A120E] text-stone-100 select-none flex flex-col font-sans isolate ${
        selectedId === "overview"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default"
      }`}
    >
      {/* --- TOP BAR CONTROLS (MOBILE-OPTIMIZED) --- */}
      <header
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 right-0 z-30 p-2.5 sm:p-4 flex items-center justify-between gap-2 pointer-events-none"
      >
        {/* Left: Back to Studio CTA */}
        <div className="pointer-events-auto shrink-0">
          {onBackToStudio && (
            <button
              type="button"
              onClick={onBackToStudio}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-stone-900/85 hover:bg-stone-800 backdrop-blur-md border border-amber-600/40 text-amber-200 text-[11px] sm:text-xs font-medium shadow-xl transition-all active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden xs:inline sm:inline">Về Bàn Phối 2D</span>
              <span className="xs:hidden sm:hidden">Phối 2D</span>
            </button>
          )}
        </div>

        {/* Center: Tour Step Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-900/85 backdrop-blur-md border border-stone-800 text-[11px] sm:text-xs max-w-[52vw] sm:max-w-none truncate">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-royal text-amber-300 font-semibold tracking-wide truncate">
            {selectedId === "overview"
              ? "Toàn Cảnh Hành Lang"
              : currentGarment?.title}
          </span>
          <span className="text-stone-500 hidden sm:inline">•</span>
          <span className="text-[10px] sm:text-[11px] text-stone-400 font-serif italic shrink-0 hidden sm:inline">
            {selectedId === "overview"
              ? "5 Tuyệt Tác"
              : `Bục ${currentGarment?.tourOrder}/5`}
          </span>
        </div>

        {/* Right: Studio 360 & View Mode Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentGarment && (
            <button
              type="button"
              onClick={() => setIsStudio360((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-all ${
                isStudio360
                  ? "bg-amber-500 text-stone-950 border-amber-400 font-semibold shadow-lg"
                  : "bg-stone-900/85 border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800"
              }`}
              title="Cô lập bục trưng bày và xoay 360 độ"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isStudio360 ? "← Hành Lang" : "Studio 360°"}
              </span>
              <span className="md:hidden">360°</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectGarment("overview")}
            className={`p-1.5 sm:p-2 rounded-full border transition-all ${
              selectedId === "overview"
                ? "bg-amber-500 text-stone-950 border-amber-400"
                : "bg-stone-900/85 border-stone-700 text-stone-400 hover:text-white"
            }`}
            title="Xem toàn cảnh 3D"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* --- MAIN 3D CANVAS VIEWPORT --- */}
      <div className="flex-1 min-h-0 relative overflow-hidden w-full">
        {glbStatus === "missing" && !glbUrl ? (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#140e0b]"
          >
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#1c1410] border border-amber-900/50 shadow-2xl text-center space-y-4 text-stone-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-royal text-lg sm:text-xl font-semibold text-amber-200">
                  Hành Lang Di Sản 3D
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Chưa tìm thấy tệp mô hình không gian{" "}
                  <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">
                    viet_phuc_gallery.glb
                  </code>{" "}
                  trên máy chủ.
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-dashed border-amber-800/60 hover:border-amber-500 bg-amber-950/20 transition-all">
                <label className="cursor-pointer block">
                  <span className="text-xs text-stone-300 block mb-2 font-medium">
                    Kéo thả hoặc tải tệp 3D từ máy của bạn:
                  </span>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md transition-all">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang nạp mô hình...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Chọn viet_phuc_gallery.glb</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {uploadError && (
                <p className="text-rose-400 text-xs">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setGlbUrl("procedural_fallback");
                  setGlbStatus("ready");
                }}
                className="text-stone-400 hover:text-stone-200 text-xs underline underline-offset-4"
              >
                Hoặc trải nghiệm trước với Showroom Di Sản Thủ Công
              </button>
            </div>
          </div>
        ) : (
          <Canvas
            camera={{
              fov: 48,
              position: manifestData.overview.cameraPosition as [
                number,
                number,
                number,
              ],
            }}
            dpr={[1, 1.5]}
            className="w-full h-full"
          >
            <Suspense
              fallback={
                <Html center>
                  <div className="px-4 py-2.5 rounded-xl bg-[#1A120E]/95 text-amber-100 text-xs sm:text-sm border border-amber-500/40 whitespace-nowrap shadow-xl">
                    Đang tải mô hình 3D Việt phục...
                  </div>
                </Html>
              }
            >
              {glbUrl && glbUrl !== "procedural_fallback" ? (
                <SceneContent
                  glbUrl={glbUrl}
                  activeId={selectedId}
                  isStudio360={isStudio360}
                  isInfoOpen={isInfoOpen}
                  studioTheme={studioTheme}
                  garments={garments}
                  targetYawRef={targetYawRef}
                  overviewYawRef={overviewYawRef}
                  dragDistanceRef={dragDistanceRef}
                  onSelectGarment={handleSelectGarment}
                />
              ) : (
                <ProceduralShowroomFallback
                  garments={garments}
                  selectedId={selectedId}
                  isStudio360={isStudio360}
                  targetYawRef={targetYawRef}
                />
              )}
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Overview swipe hint */}
      {selectedId === "overview" && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-[#1A120E]/80 backdrop-blur-md border border-amber-500/30 text-[10.5px] sm:text-xs text-stone-200 whitespace-nowrap pointer-events-none shadow-lg">
          ↔ Vuốt ngang để ngắm quanh hành lang · Chạm vào trang phục để khám phá
        </div>
      )}

      {/* --- GARMENT DETAILS CARD (2/3 - 1/3 DESKTOP & COMPACT MOBILE SHEET) --- */}
      {currentGarment && isInfoOpen && (
        <aside
          onPointerDown={(e) => e.stopPropagation()}
          className={
            isMobile
              ? "absolute z-30 bottom-14 left-2.5 right-2.5 max-h-[40vh] flex flex-col"
              : "absolute z-30 top-16 right-5 w-[350px] lg:w-[370px]"
          }
        >
          <div className="bg-[#1a120e]/92 backdrop-blur-xl border border-amber-600/35 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl text-stone-200 flex flex-col justify-between overflow-hidden">
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between gap-2 pb-1.5 sm:pb-2 border-b border-amber-950/80 mb-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-400 font-bold leading-snug">
                  {currentGarment.era}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-stone-400">
                    Điểm dừng {currentGarment.tourOrder}/{garments.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInfoOpen(false)}
                    className="px-2 py-0.5 rounded-full border border-amber-500/40 bg-white/5 hover:bg-white/15 text-[10px] text-stone-200 font-medium transition-colors"
                  >
                    Thu gọn ▾
                  </button>
                </div>
              </div>

              <h2 className="text-base sm:text-xl font-royal font-bold text-amber-100 tracking-wide mb-2">
                {currentGarment.title}
              </h2>

              {/* Active Side Highlight (Clean & Scroll-free on Mobile, Optional Dual on Desktop) */}
              <div className="space-y-2 text-xs text-stone-200 leading-relaxed max-h-[16vh] sm:max-h-[28vh] overflow-y-auto pr-1">
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.06] border border-amber-500/25">
                  <div className="font-bold text-amber-400 text-[11px] sm:text-xs mb-0.5">
                    {viewingSide === "front"
                      ? "Đặc trưng Mặt trước (0°):"
                      : "Đặc trưng Mặt sau (180°):"}
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-stone-200 leading-relaxed">
                    {viewingSide === "front"
                      ? currentGarment.highlightFront
                      : currentGarment.highlightBack}
                  </p>
                </div>

                {!isMobile && (
                  <div className="p-2.5 rounded-xl bg-stone-900/55 border border-stone-800/80">
                    <div className="font-semibold text-stone-400 text-[11px] mb-0.5">
                      {viewingSide === "front"
                        ? "Cấu trúc Mặt sau:"
                        : "Cấu trúc Mặt trước:"}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      {viewingSide === "front"
                        ? currentGarment.highlightBack
                        : currentGarment.highlightFront}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Footer inside Card */}
            <div className="pt-2.5 sm:pt-3.5 border-t border-amber-950/80 space-y-2 mt-2.5">
              {!isStudio360 ? (
                <div>
                  <div className="text-[10.5px] text-stone-400 mb-1.5 hidden sm:block">
                    Vuốt ngang trên mẫu để xoay hoặc chọn góc nhanh:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => rotateToSide("front")}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                        viewingSide === "front"
                          ? "bg-[#AE443A] text-white shadow-sm"
                          : "bg-white/10 text-stone-300 hover:text-white"
                      }`}
                    >
                      Mặt trước (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateToSide("back")}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                        viewingSide === "back"
                          ? "bg-[#AE443A] text-white shadow-sm"
                          : "bg-white/10 text-stone-300 hover:text-white"
                      }`}
                    >
                      Mặt sau (180°)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-300">
                    Phông nền Studio:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStudioTheme("warm")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        studioTheme === "warm"
                          ? "bg-[#EAE4DC] text-stone-950 font-semibold"
                          : "bg-white/10 text-stone-300"
                      }`}
                    >
                      Sáng ấm
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioTheme("dark")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        studioTheme === "dark"
                          ? "bg-amber-500 text-stone-950 font-semibold"
                          : "bg-white/10 text-stone-300"
                      }`}
                    >
                      Tối trầm
                    </button>
                  </div>
                </div>
              )}

              {/* Studio 360 Toggle + Prev/Next */}
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudio360((prev) => !prev)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#E09F3E] hover:bg-amber-400 text-[#1A120E] text-[11px] sm:text-xs font-bold transition-all"
                >
                  {isStudio360
                    ? "← Trở lại Hành lang"
                    : "Soi chi tiết 360° (Cô lập)"}
                </button>
                <button
                  type="button"
                  onClick={handlePrevGarment}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  title="Mẫu trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextGarment}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  title="Mẫu tiếp theo"
                >
                  ›
                </button>
              </div>

              {/* PRIMARY TWO-WAY BRIDGE CTA: Phối Gen Z với mẫu này */}
              {onRemixGarment && (
                <button
                  type="button"
                  onClick={() => onRemixGarment(currentGarment.id)}
                  className="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-[11px] sm:text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  <span>Phối Gen Z Với Mẫu Này →</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Mini Collapsed Pill Bar when Info Card is closed */}
      {!isInfoOpen && currentGarment && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={
            isMobile
              ? "absolute z-30 bottom-14 left-3 right-3 flex items-center justify-between gap-2 bg-[#1A120E]/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-amber-500/35 shadow-xl"
              : "absolute z-30 top-16 right-5 flex items-center gap-2 bg-[#1A120E]/90 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/35 shadow-xl"
          }
        >
          <span className="text-xs font-bold text-amber-100 truncate">
            {currentGarment.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsStudio360((prev) => !prev)}
              className="px-2.5 py-1 rounded-full bg-[#E09F3E] text-[#1A120E] text-[11px] font-bold"
            >
              {isStudio360 ? "← Hành lang" : "360°"}
            </button>
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-amber-500/40 text-amber-200 text-[11px] font-semibold flex items-center gap-1"
            >
              <Info className="w-3 h-3 text-amber-400" />
              <span>Thuyết minh ▴</span>
            </button>
          </div>
        </div>
      )}

      {/* --- BOTTOM TOUR CAROUSEL DOCK --- */}
      <footer
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-2.5 sm:bottom-4 left-0 right-0 z-30 flex items-center justify-center px-2.5 pointer-events-none"
      >
        <div className="pointer-events-auto inline-flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full bg-[#1A120E]/90 backdrop-blur-xl border border-amber-500/35 shadow-2xl text-xs max-w-full overflow-x-auto no-scrollbar">
          {/* Overview button */}
          <button
            type="button"
            onClick={() => handleSelectGarment("overview")}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              selectedId === "overview"
                ? "bg-[#AE443A] text-white font-semibold shadow-sm"
                : "text-stone-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">Toàn cảnh</span>
          </button>

          <span className="w-px h-3.5 bg-stone-700 shrink-0" />

          {/* 5 Garment Tour Pills */}
          {garments.map((g) => {
            const isSelected = g.id === selectedId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectGarment(g.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#AE443A] text-white font-semibold shadow-sm"
                    : "text-stone-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-[11px] sm:text-xs whitespace-nowrap">
                  {g.tourOrder}.{" "}
                  {g.title
                    .split("&")[0]
                    .replace(" Truyền Thống", "")
                    .replace(" Cung Đình", "")
                    .trim()}
                </span>
              </button>
            );
          })}

          <span className="w-px h-3.5 bg-stone-700 shrink-0 hidden sm:block" />

          {/* Prev/Next arrows */}
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={handlePrevGarment}
              className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Mẫu trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextGarment}
              className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Mẫu tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VietPhucGallery;

useGLTF.preload("/models/viet_phuc_gallery.glb");
