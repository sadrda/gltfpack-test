import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";

type RoadProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  loadStart: number;
  onLoaded: (ms: number) => void;
};

function Road({ onLoaded, loadStart, ...props }: RoadProps) {
  const { scene } = useGLTF("/road.glb");

  useEffect(() => {
    onLoaded(performance.now() - loadStart);
  }, []);

  return <primitive object={scene} {...props} />;
}

function App() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const loadStart = useRef<number>(0);

  return (
    <>
      <Canvas style={{ width: "100vw", height: "100vh" }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <Suspense fallback={null}>
          <Road
            position={[0, -160, 0]}
            loadStart={(loadStart.current ||= performance.now())}
            onLoaded={setLoadTime}
          />
        </Suspense>
        <OrbitControls />
      </Canvas>

      <div style={{
        position: "fixed",
        top: 16,
        left: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "monospace",
        fontSize: 13,
      }}>
        <div style={{
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 6,
          borderLeft: "3px solid #f97316",
        }}>
          <span style={{ opacity: 0.6, marginRight: 8 }}>raw</span>
          {loadTime === null ? "loading…" : `${loadTime.toFixed(0)} ms`}
        </div>
      </div>
    </>
  );
}

export default App;
