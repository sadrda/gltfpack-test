import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";

type ModelProps = {
  src: string;
  position?: [number, number, number];
  loadStart: number;
  onLoaded: (ms: number) => void;
};

function Model({ src, onLoaded, loadStart, ...props }: ModelProps) {
  const { scene } = useGLTF(src);

  useEffect(() => {
    onLoaded(performance.now() - loadStart);
  }, [loadStart, onLoaded]);

  return <primitive object={scene} {...props} />;
}

type RowProps = { label: string; color: string; time: number | null };

function Row({ label, color, time }: RowProps) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.65)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: 6,
        borderLeft: `3px solid ${color}`,
        display: "flex",
        gap: 10,
      }}
    >
      <span style={{ opacity: 0.5, minWidth: 70 }}>{label}</span>
      <span>{time === null ? "loading…" : `${time.toFixed(0)} ms`}</span>
    </div>
  );
}

function App() {
  const [rawTime, setRawTime] = useState<number | null>(null);
  const [packedTime, setPackedTime] = useState<number | null>(null);
  const rawStart = useRef<number>(0);
  const packedStart = useRef<number>(0);

  return (
    <>
      <Canvas style={{ width: "100vw", height: "100vh" }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <Suspense fallback={null}>
          <Model
            src="/model.glb"
            position={[0, -160, 0]}
            loadStart={(rawStart.current ||= performance.now())}
            onLoaded={setRawTime}
          />
        </Suspense>
        <Suspense fallback={null}>
          <Model
            src="/model-packed.glb"
            position={[0, -160, 0]}
            loadStart={(packedStart.current ||= performance.now())}
            onLoaded={setPackedTime}
          />
        </Suspense>
        <OrbitControls />
      </Canvas>

      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <Row label="raw (117 MB)" color="#f97316" time={rawTime} />
        <Row label="packed (87 MB)" color="#22c55e" time={packedTime} />
        {rawTime !== null && packedTime !== null && (
          <div
            style={{
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              borderLeft: "3px solid #818cf8",
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ opacity: 0.5, minWidth: 70 }}>delta</span>
            <span>
              {rawTime > packedTime ? "packed faster by " : "raw faster by "}
              {Math.abs(rawTime - packedTime).toFixed(0)} ms
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
