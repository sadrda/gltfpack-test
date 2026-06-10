import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useLayoutEffect, useState } from "react";

useGLTF.preload("/model.glb");
[
  "/model-lod0.glb",
  "/model-lod1.glb",
  "/model-lod2.glb",
  "/model-lod3.glb",
  "/model-lod4.glb",
].forEach((src) => useGLTF.preload(src));

const LODS = [
  { src: "/model-lod0.glb", label: "2%", size: "0.32 MB", color: "#ef4444" },
  { src: "/model-lod1.glb", label: "10%", size: "0.57 MB", color: "#f97316" },
  { src: "/model-lod2.glb", label: "25%", size: "1.82 MB", color: "#eab308" },
  { src: "/model-lod3.glb", label: "50%", size: "5.25 MB", color: "#22c55e" },
  { src: "/model-lod4.glb", label: "100%", size: "28.3 MB", color: "#3b82f6" },
];

const glReadyAt = { current: 0 };

function timeFromPageLoad(): number {
  return performance.now();
}

function RawModel({
  position,
  onLoaded,
}: {
  position: [number, number, number];
  onLoaded: (ms: number) => void;
}) {
  const { scene } = useGLTF("/model.glb");
  useLayoutEffect(() => {
    onLoaded(timeFromPageLoad());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <primitive
      object={scene}
      position={position}
      scale={2}
      rotation={[0, Math.PI, 0]}
    />
  );
}

function LodModel({
  src,
  onLoaded,
}: {
  src: string;
  onLoaded: (ms: number) => void;
}) {
  const { scene } = useGLTF(src);
  useLayoutEffect(() => {
    onLoaded(timeFromPageLoad());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <primitive object={scene} scale={2} rotation={[0, Math.PI, 0]} />;
}

// Manages its own visibility state so updates stay local and synchronous
function ProgressiveLODs({
  position,
  onLodLoaded,
}: {
  position: [number, number, number];
  onLodLoaded: (index: number, ms: number) => void;
}) {
  const [currentBest, setCurrentBest] = useState(-1);

  return (
    <group position={position}>
      {LODS.map((lod, i) => (
        <Suspense key={lod.src} fallback={null}>
          <group visible={i === currentBest}>
            <LodModel
              src={lod.src}
              onLoaded={(ms) => {
                setCurrentBest((prev) => Math.max(prev, i));
                onLodLoaded(i, ms);
              }}
            />
          </group>
        </Suspense>
      ))}
    </group>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div
      style={{
        color: "rgba(0,0,0,0.7)",
        fontSize: 11,
        letterSpacing: 1,
        marginTop: 4,
      }}
    >
      {title}
    </div>
  );
}

function Row({
  label,
  sub,
  color,
  time,
  active,
}: {
  label: string;
  sub: string;
  color: string;
  time: number | null;
  active?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.85)",
        color: "#000",
        padding: "6px 12px",
        borderRadius: 6,
        borderLeft: `3px solid ${active === false ? "rgba(0,0,0,0.1)" : color}`,
        display: "flex",
        gap: 10,
        alignItems: "center",
        transition: "border-color 0.3s",
      }}
    >
      <span style={{ minWidth: 36 }}>{label}</span>
      <span style={{ opacity: 0.4, minWidth: 52, fontSize: 11 }}>{sub}</span>
      <span style={{ marginLeft: "auto", opacity: time === null ? 0.4 : 1 }}>
        {time === null ? "…" : `${time.toFixed(0)} ms`}
      </span>
      {active && <span style={{ opacity: 0.5, fontSize: 11 }}>▶</span>}
    </div>
  );
}

export default function App() {
  const [glReadyMs, setGlReadyMs] = useState<number | null>(null);
  const [rawTime, setRawTime] = useState<number | null>(null);
  const [lodTimes, setLodTimes] = useState<(number | null)[]>(
    Array(LODS.length).fill(null),
  );
  const [currentBest, setCurrentBest] = useState(-1);

  const handleLodLoaded = (index: number, ms: number) => {
    setLodTimes((prev) => {
      const n = [...prev];
      n[index] = ms;
      return n;
    });
    setCurrentBest((prev) => Math.max(prev, index));
  };

  return (
    <>
      <Canvas
        onCreated={() => {
          glReadyAt.current = performance.now();
          setGlReadyMs(glReadyAt.current);
        }}
        camera={{ position: [0, 2, 9], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={3} />
        <directionalLight position={[-5, 5, -5]} intensity={1} />
        <Suspense fallback={null}>
          <RawModel position={[2, 0, 0]} onLoaded={setRawTime} />
        </Suspense>
        <ProgressiveLODs position={[-2, 0, 0]} onLodLoaded={handleLodLoaded} />
        <OrbitControls />
      </Canvas>

      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontFamily: "monospace",
          fontSize: 13,
          minWidth: 260,
          pointerEvents: "none",
        }}
      >
        <Row label="WebGL" sub="init" color="#818cf8" time={glReadyMs} />

        <Section title="RAW [right]" />
        <Row label="full" sub="75.6 MB" color="#f97316" time={rawTime} />

        <Section title="PACKED [left] — progressive LODs" />
        {LODS.map((lod, i) => (
          <Row
            key={lod.src}
            label={lod.label}
            sub={lod.size}
            color={lod.color}
            time={lodTimes[i]}
            active={i === currentBest}
          />
        ))}

        {rawTime !== null && currentBest === LODS.length - 1 && (
          <div
            style={{
              marginTop: 4,
              background: "rgba(255,255,255,0.85)",
              color: "#000",
              padding: "6px 12px",
              borderRadius: 6,
              borderLeft: "3px solid #818cf8",
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ opacity: 0.4 }}>raw vs full LOD</span>
            <span style={{ marginLeft: "auto" }}>
              {rawTime > lodTimes[LODS.length - 1]!
                ? `packed ${(rawTime - lodTimes[LODS.length - 1]!).toFixed(0)} ms faster`
                : `raw ${(lodTimes[LODS.length - 1]! - rawTime).toFixed(0)} ms faster`}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
