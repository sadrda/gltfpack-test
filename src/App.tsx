import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

type RoadProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
};

function Road(props: RoadProps) {
  const { scene } = useGLTF("/road.glb");
  return <primitive object={scene} {...props} />;
}

function App() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }}>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 10, 5]} intensity={2} />
      <Road position={[0, -160, 0]} />
      <OrbitControls />
    </Canvas>
  );
}

export default App;
