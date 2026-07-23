import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const CUBE_SIZE = 2;
const HALF = CUBE_SIZE / 2;
const MIN_RADIUS = 0.008;
const MAX_RADIUS = 0.025;
// Quantization step (0-255) used to bucket similar sampled colors together
// when estimating per-point frequency weight — the backend sends raw,
// unweighted pixel samples, so "common colors" are inferred client-side.
const WEIGHT_BUCKET = 16;

// Matches the R/G/B channel colors used in RGBHistogram (Tailwind red/green/blue-500).
const AXIS_COLORS = { r: "#ef4444", g: "#22c55e", b: "#3b82f6" };

interface ColorSpaceCloudProps {
  samples: number[][];
}

export function ColorSpaceCloud({ samples }: ColorSpaceCloudProps) {
  if (samples.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border pt-4">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Color space
      </span>
      <div className="mt-2 h-[420px] w-full">
        <Canvas camera={{ position: [2.2, 1.6, 2.2], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 4, 2]} intensity={0.8} />
          <PointCloud samples={samples} />
          <CubeFrame />
          <GridFloor />
          <AxisTicks />
          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate
            autoRotateSpeed={1.2}
            minDistance={2.5}
            maxDistance={7}
          />
        </Canvas>
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted">
        Drag to rotate — each point is a sampled pixel plotted by RGB value
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted">
        {samples.length} color samples · weighted by frequency
      </p>
    </div>
  );
}

/** Normalized [0,1] frequency weight per sample, bucketed by nearby RGB values. */
function computeWeights(samples: number[][]): number[] {
  const counts = new Map<string, number>();
  const keys = samples.map(([r, g, b]) => {
    const key = `${Math.round(r / WEIGHT_BUCKET)}-${Math.round(g / WEIGHT_BUCKET)}-${Math.round(b / WEIGHT_BUCKET)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return key;
  });
  const max = Math.max(...counts.values());
  return keys.map((k) => {
    const count = counts.get(k)!;
    return max > 1 ? (count - 1) / (max - 1) : 0;
  });
}

function PointCloud({ samples }: { samples: number[][] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const weights = useMemo(() => computeWeights(samples), [samples]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    samples.forEach(([r, g, b], i) => {
      dummy.position.set(
        (r / 255) * CUBE_SIZE - HALF,
        (g / 255) * CUBE_SIZE - HALF,
        (b / 255) * CUBE_SIZE - HALF,
      );
      const radius = MIN_RADIUS + weights[i] * (MAX_RADIUS - MIN_RADIUS);
      dummy.scale.setScalar(radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(r / 255, g / 255, b / 255);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [samples, weights]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, samples.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial roughness={0.5} />
    </instancedMesh>
  );
}

function CubeFrame() {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)),
    [],
  );
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#222222" />
    </lineSegments>
  );
}

/** Reference grid on the cube's bottom face (Y = -HALF), lines every 0.25 units. */
function GridFloor() {
  const segments = useMemo(() => {
    const step = 0.25;
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    for (let v = -HALF; v <= HALF + 1e-6; v += step) {
      lines.push([new THREE.Vector3(v, -HALF, -HALF), new THREE.Vector3(v, -HALF, HALF)]);
      lines.push([new THREE.Vector3(-HALF, -HALF, v), new THREE.Vector3(HALF, -HALF, v)]);
    }
    return lines;
  }, []);

  return (
    <>
      {segments.map((points, i) => (
        <Line key={i} points={points} color="#1a1a1a" lineWidth={0.5} />
      ))}
    </>
  );
}

function AxisTicks() {
  const origin: [number, number, number] = [-HALF, -HALF, -HALF];
  const labelOffset = 0.3;
  return (
    <>
      <Line points={[origin, [HALF, -HALF, -HALF]]} color={AXIS_COLORS.r} lineWidth={1.5} />
      <Line points={[origin, [-HALF, HALF, -HALF]]} color={AXIS_COLORS.g} lineWidth={1.5} />
      <Line points={[origin, [-HALF, -HALF, HALF]]} color={AXIS_COLORS.b} lineWidth={1.5} />
      <Html position={[HALF + labelOffset, -HALF, -HALF]} center distanceFactor={6}>
        <span className="font-mono text-sm font-semibold" style={{ color: AXIS_COLORS.r }}>
          R
        </span>
      </Html>
      <Html position={[-HALF, HALF + labelOffset, -HALF]} center distanceFactor={6}>
        <span className="font-mono text-sm font-semibold" style={{ color: AXIS_COLORS.g }}>
          G
        </span>
      </Html>
      <Html position={[-HALF, -HALF, HALF + labelOffset]} center distanceFactor={6}>
        <span className="font-mono text-sm font-semibold" style={{ color: AXIS_COLORS.b }}>
          B
        </span>
      </Html>
    </>
  );
}
