import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import manifestData from '../data/gallery_manifest.json';
import { 
  ArrowLeft, 
  RotateCw, 
  Sparkles, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Info, 
  X, 
  Check, 
  Loader2,
  Maximize2,
  Compass
} from 'lucide-react';

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

interface VietPhucGalleryProps {
  embedded?: boolean;
  initialGarmentId?: string;
  onBackToStudio?: () => void;
  onRemixGarment?: (galleryId: string) => void;
}

// -----------------------------------------------------------------------------
// MATH & GEOMETRY UTILITIES
// -----------------------------------------------------------------------------

/**
 * Normalizes garment pivot to pedestal base and clamps front yaw to [-PI/2, +PI/2]
 * to prevent 180-degree flipped models.
 */
function normalizePivotAndComputeFrontYaw(object: THREE.Object3D): {
  center: THREE.Vector3;
  baseOrigin: THREE.Vector3;
  frontYaw: number;
} {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const baseOrigin = new THREE.Vector3(center.x, box.min.y, center.z);

  // Derive default orientation from rotation modulo PI
  let rawYaw = object.rotation.y;
  // Reduce to [-PI/2, +PI/2] range
  let frontYaw = rawYaw % Math.PI;
  if (frontYaw > Math.PI / 2) frontYaw -= Math.PI;
  if (frontYaw < -Math.PI / 2) frontYaw += Math.PI;

  return { center, baseOrigin, frontYaw };
}

/**
 * Computes camera framing for a garment:
 * FOV ~48, distance 2.1m - 2.45m, and horizontal offset ~0.28m on desktop
 * to achieve 2/3 (model) - 1/3 (info panel) layout.
 */
function computeGarmentFraming(
  pedestalOrigin: [number, number, number],
  defaultCam: [number, number, number],
  defaultTarget: [number, number, number],
  isMobile: boolean
): {
  cameraPos: THREE.Vector3;
  targetPos: THREE.Vector3;
} {
  const target = new THREE.Vector3(...defaultTarget);
  const cam = new THREE.Vector3(...defaultCam);

  // Horizontal offset: on desktop, shift target slightly to the left so model sits in left 2/3
  if (!isMobile) {
    const forward = new THREE.Vector3().subVectors(target, cam).setY(0).normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    // Shift target right by 0.28m so garment appears to the left of center
    target.addScaledVector(right, -0.28);
    cam.addScaledVector(right, -0.28);
  }

  return { cameraPos: cam, targetPos: target };
}

// -----------------------------------------------------------------------------
// CAMERA CONTROLLER COMPONENT
// -----------------------------------------------------------------------------

function CameraRig({
  targetPos,
  targetLookAt,
  isOrbiting,
}: {
  targetPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  isOrbiting: boolean;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, -3.0));

  useFrame((_, delta) => {
    if (!isOrbiting) {
      const step = Math.min(delta * 3.8, 1);
      camera.position.lerp(targetPos, step);
      currentLookAt.current.lerp(targetLookAt, step);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}

// -----------------------------------------------------------------------------
// 3D MODEL & SCENE CONTENT
// -----------------------------------------------------------------------------

function SceneContent({
  glbUrl,
  selectedId,
  isStudio360,
  garmentRotation,
  garments,
  isMobile,
}: {
  glbUrl: string;
  selectedId: string;
  isStudio360: boolean;
  garmentRotation: number;
  garments: GarmentManifestItem[];
  isMobile: boolean;
}) {
  const { scene } = useGLTF(glbUrl);
  const activeGarment = useMemo(() => garments.find(g => g.id === selectedId), [garments, selectedId]);

  // Clone or configure scene nodes
  useEffect(() => {
    if (!scene) return;

    scene.traverse(node => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const mesh = node as THREE.Mesh;
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mat.forEach(m => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.envMapIntensity = 1.2;
              m.roughness = Math.max(0.35, m.roughness);
            }
          });
        }
      }

      // Hide other backdrops / meshes in isolated Studio 360 mode
      if (isStudio360 && activeGarment) {
        if (node.name.startsWith('ENV_Backdrop_')) {
          node.visible = node.name === activeGarment.backdropName;
        } else if (node.name.startsWith('GARMENT_')) {
          node.visible = node.name === activeGarment.meshName;
        }
      } else {
        node.visible = true;
      }
    });
  }, [scene, isStudio360, activeGarment]);

  // Apply user 360 rotation to the selected garment mesh
  useEffect(() => {
    if (!scene || !activeGarment) return;

    const garmentNode = scene.getObjectByName(activeGarment.meshName);
    if (garmentNode) {
      garmentNode.rotation.y = garmentRotation;
    }
  }, [scene, activeGarment, garmentRotation]);

  return (
    <primitive 
      object={scene} 
      position={[0, 0, 0]} 
    />
  );
}

// Fallback procedural showroom when GLB is not yet loaded
function ProceduralShowroomFallback({
  garments,
  selectedId,
  isStudio360,
  garmentRotation,
}: {
  garments: GarmentManifestItem[];
  selectedId: string;
  isStudio360: boolean;
  garmentRotation: number;
}) {
  return (
    <group>
      {/* Heritage Courtyard Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[24, 30]} />
        <meshStandardMaterial color="#211814" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Decorative Red Wooden Columns along the imperial hall */}
      {[-3.5, 3.5].map((x, colIdx) =>
        [-8, -4, 0, 4, 8].map((z, rowIdx) => (
          <mesh key={`col_${colIdx}_${rowIdx}`} position={[x, 2.5, z]} castShadow>
            <cylinderGeometry args={[0.22, 0.25, 5, 24]} />
            <meshStandardMaterial color="#8b1e1e" roughness={0.4} metalness={0.2} />
          </mesh>
        ))
      )}

      {/* 5 Garment Display Pedestals */}
      {garments.map((g) => {
        const isSelected = g.id === selectedId;
        if (isStudio360 && !isSelected) return null;

        const [px, py, pz] = g.pedestalOrigin;
        const rotY = isSelected ? garmentRotation : 0;

        return (
          <group key={g.id} position={[px, py, pz]}>
            {/* Wooden Base Plinth */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 0.98, 0.24, 32]} />
              <meshStandardMaterial color="#3e2723" roughness={0.5} />
            </mesh>
            {/* Gold Rim */}
            <mesh position={[0, 0.24, 0]}>
              <torusGeometry args={[0.88, 0.02, 16, 32]} />
              <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Stand Pole */}
            <mesh position={[0, 0.9, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.3, 16]} />
              <meshStandardMaterial color="#212121" metalness={0.7} />
            </mesh>

            {/* Garment Form Silhouette */}
            <group position={[0, 1.25, 0]} rotation={[0, rotY, 0]}>
              {/* Torso */}
              <mesh castShadow>
                <coneGeometry args={[0.42, 1.1, 24]} />
                <meshStandardMaterial 
                  color={
                    g.id === 'giao_linh' ? '#8b1e1e' :
                    g.id === 'tu_than' ? '#6b4226' :
                    g.id === 'ngu_than' ? '#1e3a8a' :
                    g.id === 'ao_dai' ? '#ec4899' :
                    '#b91c1c'
                  } 
                  roughness={0.45} 
                />
              </mesh>
              {/* Head / Collar */}
              <mesh position={[0, 0.65, 0]} castShadow>
                <sphereGeometry args={[0.16, 24, 24]} />
                <meshStandardMaterial color="#e5c06e" metalness={0.6} roughness={0.3} />
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
  initialGarmentId = 'overview',
  onBackToStudio,
  onRemixGarment,
}) => {
  const garments = manifestData.garments as GarmentManifestItem[];

  const [selectedId, setSelectedId] = useState<string>(initialGarmentId);
  const [isStudio360, setIsStudio360] = useState<boolean>(false);
  const [garmentRotation, setGarmentRotation] = useState<number>(0);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // GLB Model verification & dynamic upload state
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [glbStatus, setGlbStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync initialGarmentId if prop changes
  useEffect(() => {
    if (initialGarmentId) {
      setSelectedId(initialGarmentId);
    }
  }, [initialGarmentId]);

  // Check if GLB exists on server or needs client upload
  useEffect(() => {
    let isMounted = true;
    const checkGlb = async () => {
      try {
        const res = await fetch('/models/viet_phuc_gallery.glb', { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          if (isMounted) {
            setGlbUrl('/models/viet_phuc_gallery.glb');
            setGlbStatus('ready');
          }
        } else {
          if (isMounted) {
            setGlbStatus('missing');
          }
        }
      } catch {
        if (isMounted) {
          setGlbStatus('missing');
        }
      }
    };
    checkGlb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Instantly create object URL for zero-wait 3D preview
      const objectUrl = URL.createObjectURL(file);
      setGlbUrl(objectUrl);
      setGlbStatus('ready');

      // 2. Upload binary to backend server to persist permanently
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-glb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: arrayBuffer,
      });

      if (!res.ok) {
        console.warn('Backend failed to persist GLB permanently, fallback to memory URL');
      }
    } catch (err: any) {
      console.error('GLB upload failed:', err);
      setUploadError(err.message || 'Không thể nạp tệp mô hình 3D.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const currentGarment = useMemo(() => {
    return garments.find(g => g.id === selectedId) || null;
  }, [garments, selectedId]);

  // Compute camera positions
  const { targetCameraPos, targetLookAt } = useMemo(() => {
    if (selectedId === 'overview' || !currentGarment) {
      return {
        targetCameraPos: new THREE.Vector3(...manifestData.overview.cameraPosition),
        targetLookAt: new THREE.Vector3(...manifestData.overview.targetPosition),
      };
    }
    const framing = computeGarmentFraming(
      currentGarment.pedestalOrigin,
      currentGarment.cameraPosition,
      currentGarment.targetPosition,
      isMobile
    );
    return {
      targetCameraPos: framing.cameraPos,
      targetLookAt: framing.targetPos,
    };
  }, [selectedId, currentGarment, isMobile]);

  // Navigate between garments
  const handleSelectGarment = (id: string) => {
    setSelectedId(id);
    setGarmentRotation(0);
    setIsOrbiting(false);
    if (id !== 'overview') {
      setIsInfoOpen(true);
    }
  };

  const handleNextGarment = () => {
    if (selectedId === 'overview') {
      handleSelectGarment(garments[0].id);
      return;
    }
    const idx = garments.findIndex(g => g.id === selectedId);
    const nextIdx = (idx + 1) % garments.length;
    handleSelectGarment(garments[nextIdx].id);
  };

  const handlePrevGarment = () => {
    if (selectedId === 'overview') {
      handleSelectGarment(garments[garments.length - 1].id);
      return;
    }
    const idx = garments.findIndex(g => g.id === selectedId);
    const prevIdx = (idx - 1 + garments.length) % garments.length;
    handleSelectGarment(garments[prevIdx].id);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#120c09] text-stone-100 select-none flex flex-col font-sans">
      {/* --- TOP BAR CONTROLS --- */}
      <header className="absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        {/* Left: Back to Studio CTA */}
        <div className="pointer-events-auto">
          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-900/85 hover:bg-stone-800 backdrop-blur-md border border-amber-600/40 text-amber-200 text-xs font-medium shadow-xl transition-all hover:scale-105 active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Về Bàn Phối 2D</span>
            </button>
          )}
        </div>

        {/* Center: Tour Step Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-royal text-amber-300 font-semibold tracking-wide">
            {selectedId === 'overview' ? 'Toàn Cảnh Hành Lang' : currentGarment?.title}
          </span>
          <span className="text-stone-500">•</span>
          <span className="text-[11px] text-stone-400 font-serif italic">
            {selectedId === 'overview' ? '5 Tuyệt Tác' : `Bục ${currentGarment?.tourOrder}/5`}
          </span>
        </div>

        {/* Right: Studio 360 & View Mode Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {currentGarment && (
            <button
              onClick={() => setIsStudio360(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isStudio360
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg ring-1 ring-amber-400/50'
                  : 'bg-stone-900/80 border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Cô lập bục trưng bày và xoay 360 độ"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio 360°</span>
            </button>
          )}

          <button
            onClick={() => handleSelectGarment('overview')}
            className={`p-2 rounded-full border transition-all ${
              selectedId === 'overview'
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-900/80 border-stone-700 text-stone-400 hover:text-white'
            }`}
            title="Xem toàn cảnh 3D"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* --- MAIN 3D CANVAS VIEWPORT --- */}
      <div className="relative flex-1 w-full h-full">
        {glbStatus === 'missing' && !glbUrl ? (
          // Elegant dark heritage missing-model uploader
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#140e0b]">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#1c1410] border border-amber-900/50 shadow-2xl text-center space-y-4 text-stone-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-royal text-lg sm:text-xl font-semibold text-amber-200">
                  Hành Lang Di Sản 3D
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Chưa tìm thấy tệp mô hình không gian <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">viet_phuc_gallery.glb</code> trên máy chủ.
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
                    onChange={e => {
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
                  setGlbUrl('procedural_fallback');
                  setGlbStatus('ready');
                }}
                className="text-stone-400 hover:text-stone-200 text-xs underline underline-offset-4"
              >
                Hoặc trải nghiệm trước với Showroom Di Sản Thủ Công
              </button>
            </div>
          </div>
        ) : (
          <Canvas
            shadows
            camera={{ fov: 48, position: manifestData.overview.cameraPosition as [number, number, number] }}
            className="w-full h-full"
          >
            {/* Ambient & Imperial Lantern Lighting */}
            <ambientLight intensity={isStudio360 ? 0.7 : 0.85} color="#fff6e5" />
            
            {/* Main Hall Warm Directional Keylight */}
            <directionalLight
              position={[5, 9, 6]}
              intensity={1.4}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-near={0.5}
              shadow-camera-far={25}
              shadow-camera-left={-8}
              shadow-camera-right={8}
              shadow-camera-top={8}
              shadow-camera-bottom={-8}
              color="#ffeedd"
            />

            {/* Subtle Imperial Blue/Cold Backlight for Depth */}
            <directionalLight position={[-6, 7, -6]} intensity={0.4} color="#7dd3fc" />

            {/* Warm Lantern Accent Point Lights */}
            <pointLight position={[0, 3.2, 2]} intensity={0.8} color="#f59e0b" distance={8} />
            <pointLight position={[0, 3.2, -4]} intensity={0.8} color="#f59e0b" distance={8} />

            {/* Camera transition controller */}
            <CameraRig
              targetPos={targetCameraPos}
              targetLookAt={targetLookAt}
              isOrbiting={isOrbiting}
            />

            {/* OrbitControls when user wants to freely examine or rotate */}
            <OrbitControls
              enabled={isOrbiting || isStudio360}
              target={targetLookAt}
              maxPolarAngle={Math.PI / 2 + 0.05} // don't go below floor
              minDistance={1.2}
              maxDistance={12}
              enableDamping
              dampingFactor={0.06}
            />

            {/* 3D Scene Content with Suspense */}
            <Suspense fallback={null}>
              {glbUrl && glbUrl !== 'procedural_fallback' ? (
                <SceneContent
                  glbUrl={glbUrl}
                  selectedId={selectedId}
                  isStudio360={isStudio360}
                  garmentRotation={garmentRotation}
                  garments={garments}
                  isMobile={isMobile}
                />
              ) : (
                <ProceduralShowroomFallback
                  garments={garments}
                  selectedId={selectedId}
                  isStudio360={isStudio360}
                  garmentRotation={garmentRotation}
                />
              )}
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* --- GARMENT DETAILS CARD (2/3 - 1/3 COMPOSITION) --- */}
      {currentGarment && (
        <aside
          className={`absolute z-30 transition-all duration-500 ease-out ${
            isMobile
              ? `bottom-16 left-3 right-3 max-h-[48vh] overflow-y-auto ${isInfoOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`
              : `top-16 right-5 bottom-20 w-84 lg:w-96 ${isInfoOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`
          }`}
        >
          <div className="bg-[#1a120e]/95 backdrop-blur-xl border border-amber-900/60 rounded-3xl p-5 shadow-2xl text-stone-200 flex flex-col justify-between h-full ring-1 ring-stone-900/40">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-950/80 mb-3">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold font-royal">
                  Cổ Phục Triều Đại #{currentGarment.tourOrder}
                </span>
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-lg lg:text-xl font-royal font-semibold text-amber-100 tracking-wide mb-1">
                {currentGarment.title}
              </h2>
              <span className="inline-block text-[11px] font-serif italic text-amber-300/80 mb-3">
                {currentGarment.era}
              </span>

              {/* Highlights Front & Back */}
              <div className="space-y-2.5 text-xs text-stone-300 leading-relaxed max-h-[30vh] overflow-y-auto pr-1">
                <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-900/40">
                  <div className="font-semibold text-amber-300 text-[11px] mb-1 flex items-center gap-1">
                    <span>Mặt Trước:</span>
                  </div>
                  <p className="text-[11.5px] text-stone-300 font-light">
                    {currentGarment.highlightFront}
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-stone-900/50 border border-stone-800">
                  <div className="font-semibold text-stone-300 text-[11px] mb-1">
                    <span>Mặt Sau & Cấu Trúc:</span>
                  </div>
                  <p className="text-[11.5px] text-stone-400 font-light">
                    {currentGarment.highlightBack}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 360 Rotator & Two-Way Remix CTA */}
            <div className="pt-4 border-t border-amber-950/80 space-y-2.5 mt-3">
              {/* Rotation Quick Buttons */}
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[11px] text-stone-400 font-medium">Góc nhìn:</span>
                <div className="inline-flex rounded-xl bg-stone-900 p-0.5 border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setGarmentRotation(0)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all ${
                      garmentRotation === 0 ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Mặt trước (0°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGarmentRotation(Math.PI)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all ${
                      garmentRotation === Math.PI ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Mặt sau (180°)
                  </button>
                </div>
              </div>

              {/* PRIMARY TWO-WAY BRIDGE CTA: Phối Gen Z với mẫu này */}
              {onRemixGarment && (
                <button
                  type="button"
                  onClick={() => onRemixGarment(currentGarment.id)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-semibold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>✨ Phối Gen Z Với Mẫu Này →</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Mini Toggle info tab when panel is closed */}
      {!isInfoOpen && currentGarment && (
        <button
          onClick={() => setIsInfoOpen(true)}
          className="absolute z-30 right-4 top-16 px-3 py-1.5 rounded-full bg-stone-900/90 border border-amber-600/50 text-amber-300 text-xs font-medium shadow-xl flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Thuyết minh y phục</span>
        </button>
      )}

      {/* --- BOTTOM TOUR CAROUSEL DOCK --- */}
      <footer className="absolute bottom-3 left-0 right-0 z-30 flex items-center justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-stone-950/85 backdrop-blur-xl border border-stone-800 shadow-2xl text-xs max-w-full overflow-x-auto no-scrollbar">
          {/* Overview button */}
          <button
            onClick={() => handleSelectGarment('overview')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              selectedId === 'overview'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span className="text-[11px]">Toàn cảnh</span>
          </button>

          <span className="w-px h-3.5 bg-stone-800 shrink-0" />

          {/* 5 Garment Tour Pills */}
          {garments.map((g) => {
            const isSelected = g.id === selectedId;
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGarment(g.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-stone-950' : 'bg-amber-400'}`} />
                <span className="text-[11px] truncate max-w-[110px] sm:max-w-none">
                  {g.title.split('&')[0].trim()}
                </span>
              </button>
            );
          })}

          <span className="w-px h-3.5 bg-stone-800 shrink-0" />

          {/* Prev/Next arrows */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handlePrevGarment}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Mẫu trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextGarment}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
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
