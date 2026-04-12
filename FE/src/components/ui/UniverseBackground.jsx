import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

// 1. Primary Core Particles
const ParticleCore = ({ count = 2000 }) => {
  const points = useRef();
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color('#60a5fa'), // blue
      new THREE.Color('#8b5cf6'), // violet
      new THREE.Color('#22d3ee'), // cyan
      new THREE.Color('#ffffff'), // white sparks
      new THREE.Color('#fbbf24'), // gold luxury
    ];

    for (let i = 0; i < count; i++) {
        // Spiral formation
        const distance = Math.pow(Math.random(), 2) * 8;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        pos[i * 3] = distance * Math.sin(phi) * Math.cos(theta) + 4; // Shifted right
        pos[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = distance * Math.cos(phi);

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        cols[i * 3] = color.r;
        cols[i * 3 + 1] = color.g;
        cols[i * 3 + 2] = color.b;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    points.current.rotation.y = time * 0.05;
    points.current.rotation.z = time * 0.02;
    // Breathing pulse
    const scale = 1 + Math.sin(time * 0.5) * 0.05;
    points.current.scale.set(scale, scale, scale);
  });

  return (
    <Points ref={points} positions={positions} colors={colors} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

// 2. Outer Orbit Rings
const OrbitRings = () => {
    const group = useRef();
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        group.current.children.forEach((ring, i) => {
            ring.rotation.z = time * (0.1 + i * 0.05);
            ring.rotation.x = time * (0.05);
        });
    });

    return (
        <group ref={group}>
            {[8, 12, 16].map((radius, i) => (
                <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                    <ringGeometry args={[radius, radius + 0.02, 128]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "#60a5fa" : "#8b5cf6"} transparent opacity={0.15} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
};

// 3. Ambient Floating Dust
const AmbientDust = ({ count = 1000 }) => {
    const points = useRef();
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        return pos;
    }, [count]);

    useFrame((state) => {
        points.current.rotation.y -= 0.001;
    });

    return (
        <Points ref={points} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#94a3b8"
                size={0.01}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.3}
            />
        </Points>
    );
};

// Interactive Scene Controller
const SceneContent = ({ mouse, gyro }) => {
    const { camera } = useThree();
    const targetVector = new THREE.Vector3();

    useFrame((state) => {
        // PC: Mouse parallax & Camera drift
        if (window.innerWidth > 1024) {
            targetVector.set(mouse.x * 2, mouse.y * 2, camera.position.z);
            camera.position.lerp(targetVector, 0.02);
            camera.lookAt(4, 0, 0); // Focus on the core slightly to the right
        } else {
            // Android: Gyro parallax
            targetVector.set(gyro.x * 5, -gyro.y * 5, camera.position.z);
            camera.position.lerp(targetVector, 0.05);
            camera.lookAt(0, 0, 0);
        }
    });

    return (
        <>
            <ParticleCore />
            <OrbitRings />
            <AmbientDust />
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.4} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </>
    );
};

export const UniverseBackground = ({ gyro }) => {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMouse({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: -(e.clientY / window.innerHeight) * 2 + 1
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] bg-black pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 20], fov: 45 }}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 2]} // High quality
            >
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 20, 50]} />
                <SceneContent mouse={mouse} gyro={gyro} />
            </Canvas>
        </div>
    );
};
