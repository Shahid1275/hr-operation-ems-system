'use client';

import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

export function AmbientScene() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.2}>
          <Sphere args={[1.1, 64, 64]} position={[0, 0, 0]}>
            <MeshDistortMaterial color="#5b8def" distort={0.35} speed={1.4} roughness={0.25} />
          </Sphere>
        </Float>
      </Canvas>
    </div>
  );
}
