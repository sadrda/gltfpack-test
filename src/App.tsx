import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useLayoutEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

const RAW_SRC = `${BASE}model.glb`;

const LODS = [
  { src: `${BASE}model-lod0.glb`, label: "2%",   size: "0.32 MB", color: "#ef4444" },
  { src: `${BASE}model-lod1.glb`, label: "10%",  size: "0.57 MB", color: "#f97316" },
  { src: `${BASE}model-lod2.glb`, label: "25%",  size: "1.82 MB", color: "#eab308" },
  { src: `${BASE}model-lod3.glb`, label: "50%",  size: "5.25 MB", color: "#22c55e" },
  { src: `${BASE}model-lod4.glb`, label: "100%", size: "28.3 MB", color: "#3b82f6" },
];

useGLTF.preload(RAW_SRC);
LODS.forEach((lod) => useGLTF.preload(lod.src));

function Model({
  src,
  position,
  onLoaded,
}: {
  src: string;
  position?: [number, number, number];
  onLoaded: (ms: number) => void;
}) {
  const { scene } = useGLTF(src);
  useLayoutEffect(() => {
    onLoaded(performance.now());
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

function ProgressiveLODs({
  position,
  onLoaded,
}: {
  position: [number, number, number];
  onLoaded: (index: number, ms: number) => void;
}) {
  const [best, setBest] = useState(-1);

  return (
    <group position={position}>
      {LODS.map((lod, i) => (
        <Suspense key={lod.src} fallback={null}>
          <group visible={i === best}>
            <Model
              src={lod.src}
              onLoaded={(ms) => {
                setBest((prev) => Math.max(prev, i));
                onLoaded(i, ms);
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
  const [bestLod, setBestLod] = useState(-1);

  return (
    <>
      <Canvas
        onCreated={() => setGlReadyMs(performance.now())}
        camera={{ position: [0, 2, 9], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={3} />
        <directionalLight position={[-5, 5, -5]} intensity={1} />
        <Suspense fallback={null}>
          <Model src={RAW_SRC} position={[2, 0, 0]} onLoaded={setRawTime} />
        </Suspense>
        <ProgressiveLODs
          position={[-2, 0, 0]}
          onLoaded={(i, ms) => {
            setLodTimes((prev) => {
              const n = [...prev];
              n[i] = ms;
              return n;
            });
            setBestLod((prev) => Math.max(prev, i));
          }}
        />
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
            active={i === bestLod}
          />
        ))}

      </div>
    </>
  );
}
