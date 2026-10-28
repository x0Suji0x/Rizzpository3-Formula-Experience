import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './FormulaExperience.css';

// Original CC0 formula-car models from the 3DAssets.dev Formula Race Cars pack.
// They are used as third-party assets; this interface and interaction code is original.
const CARS = [
  {
    id: 'formula-2-high-poly',
    title: 'FORMULA 2',
    era: 'HIGH-POLY SPEC',
    number: '01',
    url: '/models/formula-2-car-high-poly.glb',
    length: '5.42 M',
    mass: 'OPEN-WHEEL',
    modelYaw: -Math.PI / 2,
    modelScale: 0.585,
  },
  {
    id: 'formula-2-scarlet-ivory',
    title: 'SCARLET GP',
    era: 'SCARLET / IVORY LIVERY',
    number: '02',
    url: '/models/formula-2-scarlet-ivory.glb',
    length: '5.42 M',
    mass: 'OPEN-WHEEL',
    modelYaw: -Math.PI / 2,
    modelScale: 0.585,
  },
  {
    id: 'formula-2-ocean-cyan',
    title: 'OCEAN GP',
    era: 'OCEAN / CYAN LIVERY',
    number: '03',
    url: '/models/formula-2-ocean-cyan.glb',
    length: '5.42 M',
    mass: 'OPEN-WHEEL',
    modelYaw: -Math.PI / 2,
    modelScale: 0.585,
  },
];

const MODES = [
  { id: 'kit', label: 'Kit', number: '01', caption: 'Inspect the machine' },
  { id: 'drive', label: 'Drive', number: '02', caption: 'Take the racing line' },
  { id: 'studio', label: 'Studio', number: '03', caption: 'Orbit the form' },
];

function makeOvalTrackGeometry(outerX = 26, outerZ = 18, innerX = 18, innerZ = 10, segments = 256) {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * outerX, 0, Math.sin(angle) * outerZ);
    positions.push(Math.cos(angle) * innerX, 0, Math.sin(angle) * innerZ);
  }
  for (let i = 0; i < segments; i += 1) {
    const outerA = i * 2;
    const innerA = outerA + 1;
    const outerB = outerA + 2;
    const innerB = outerA + 3;
    indices.push(outerA, innerA, outerB, innerA, innerB, outerB);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function ellipsePoints(rx, rz, count = 256, y = 0.055) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * rx, y, Math.sin(a) * rz);
  });
}

function CurbBand({ rx, rz, count = 240 }) {
  const instances = useRef(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.92, 0.085, 0.42), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const red = useMemo(() => new THREE.Color('#d93a32'), []);
  const white = useMemo(() => new THREE.Color('#e9e9e5'), []);

  useLayoutEffect(() => {
    if (!instances.current) return;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const x = Math.cos(a) * rx;
      const z = Math.sin(a) * rz;
      const dx = -rx * Math.sin(a);
      const dz = rz * Math.cos(a);
      dummy.position.set(x, 0.055, z);
      dummy.rotation.set(0, Math.atan2(-dz, dx), 0);
      dummy.updateMatrix();
      instances.current.setMatrixAt(i, dummy.matrix);
      instances.current.setColorAt(i, i % 2 === 0 ? red : white);
    }
    instances.current.instanceMatrix.needsUpdate = true;
    if (instances.current.instanceColor) instances.current.instanceColor.needsUpdate = true;
  }, [count, dummy, rx, rz, red, white]);

  return <instancedMesh ref={instances} args={[geometry, material, count]} castShadow receiveShadow />;
}

function DriveTrack() {
  const roadGeometry = useMemo(() => makeOvalTrackGeometry(), []);
  const outer = useMemo(() => ellipsePoints(26, 18), []);
  const inner = useMemo(() => ellipsePoints(18, 10), []);
  const center = useMemo(() => ellipsePoints(22, 14, 256, 0.045), []);
  const centerLineRef = useRef(null);

  useEffect(() => () => roadGeometry.dispose(), [roadGeometry]);
  useEffect(() => { centerLineRef.current?.computeLineDistances(); }, [center]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#27332f" roughness={0.97} />
      </mesh>
      <mesh geometry={roadGeometry} position={[0, 0.015, 0]} receiveShadow>
        <meshStandardMaterial color="#25282b" roughness={0.92} side={THREE.DoubleSide} />
      </mesh>
      <CurbBand rx={25.45} rz={17.45} />
      <CurbBand rx={18.55} rz={10.55} count={180} />
      <line ref={centerLineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(center.flatMap((p) => [p.x, p.y, p.z])), 3]} count={center.length} />
        </bufferGeometry>
        <lineDashedMaterial color="#d9d9d4" transparent opacity={0.45} dashSize={1.2} gapSize={0.8} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(outer.flatMap((p) => [p.x, p.y, p.z])), 3]} count={outer.length} />
        </bufferGeometry>
        <lineBasicMaterial color="#f3f1e9" transparent opacity={0.6} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(inner.flatMap((p) => [p.x, p.y, p.z])), 3]} count={inner.length} />
        </bufferGeometry>
        <lineBasicMaterial color="#f3f1e9" transparent opacity={0.6} />
      </line>
      <group position={[0, 0, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 22, 0.16, 0]} castShadow>
            <boxGeometry args={[0.1, 0.3, 24]} />
            <meshStandardMaterial color="#62686a" metalness={0.45} roughness={0.6} />
          </mesh>
        ))}
      </group>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.02, 14]}>
          <boxGeometry args={[0.16, 0.012, 2.8]} />
          <meshBasicMaterial color="#efede4" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-1.25 + i * 0.5, 0.03, 15.5]}>
            <boxGeometry args={[0.3, 0.025, 0.65]} />
            <meshStandardMaterial color={i % 2 ? '#f3f1e9' : '#db4237'} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StudioStage({ mode }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#101316" roughness={0.88} metalness={0.12} />
      </mesh>
      <mesh position={[0, -0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[5.1, 5.2, 0.18, 112]} />
        <meshStandardMaterial color="#24282c" roughness={0.5} metalness={0.52} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <torusGeometry args={[4.86, 0.018, 8, 112]} />
        <meshBasicMaterial color={mode === 'kit' ? '#e44735' : '#9ea4a5'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.168, 0]}>
        <circleGeometry args={[5.2, 112]} />
        <meshBasicMaterial color="#181b1e" />
      </mesh>
    </group>
  );
}

function SceneLighting({ mode }) {
  return (
    <>
      <ambientLight intensity={mode === 'drive' ? 0.95 : 0.58} />
      <hemisphereLight args={['#e4eaf1', '#17191b', mode === 'drive' ? 1.05 : 0.7]} />
      <directionalLight
        position={[7, 11, 7]}
        intensity={mode === 'drive' ? 2.3 : 3.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-8, 5, -6]} intensity={1.6} color="#86a7c7" />
      <pointLight position={[-2, 3, 5]} intensity={mode === 'drive' ? 0.8 : 1.5} color="#e34834" distance={22} />
      <pointLight position={[4, 2, -4]} intensity={1.1} color="#d5e2f5" distance={24} />
    </>
  );
}

function Vehicle({ car, mode, driveState, inputRef, onSpeed }) {
  const { scene, animations } = useGLTF(car.url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.rotation.y = car.modelYaw || 0;
    clone.scale.setScalar(car.modelScale || 1);
    return clone;
  }, [scene, car.id]);
  const { actions, names } = useAnimations(animations, model);
  const root = useRef(null);
  const wheelAction = names.map((name) => actions[name]).find((action) => action && /wheel|roll/i.test(action.getClip().name)) || actions[names[0]];
  const lastSpeedPush = useRef(0);

  useEffect(() => {
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    if (!wheelAction) return undefined;
    if (mode === 'drive') {
      wheelAction.reset();
      wheelAction.play();
    } else {
      wheelAction.stop();
    }
    return () => wheelAction.stop();
  }, [mode, wheelAction]);

  useFrame((state, delta) => {
    if (!root.current) return;
    const dt = Math.min(delta, 0.045);

    if (mode === 'drive') {
      const drive = driveState.current;
      const keys = inputRef.current;
      const throttle = keys.forward ? 1 : 0;
      const brake = keys.brake ? 1 : 0;
      const steering = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

      if (throttle) drive.speed += 15.5 * dt;
      else drive.speed -= Math.sign(drive.speed) * Math.min(Math.abs(drive.speed), (2.3 + Math.abs(drive.speed) * 0.18) * dt);
      if (brake) drive.speed -= Math.sign(drive.speed || 1) * Math.min(Math.abs(drive.speed), 24 * dt);
      drive.speed = THREE.MathUtils.clamp(drive.speed, -5, 34);

      const steeringGrip = 0.22 + Math.min(1, Math.abs(drive.speed) / 10) * 1.08;
      drive.heading += steering * steeringGrip * dt * (drive.speed >= 0 ? 1 : -1);
      drive.x += Math.sin(drive.heading) * drive.speed * dt;
      drive.z += Math.cos(drive.heading) * drive.speed * dt;

      // Soft track limits keep the first-pass arcade driving contained to the circuit.
      const normalizedRadius = Math.sqrt((drive.x / 22) ** 2 + (drive.z / 14) ** 2);
      if (normalizedRadius > 1.21 || normalizedRadius < 0.79) {
        drive.speed *= Math.exp(-2.2 * dt);
        const bounded = THREE.MathUtils.clamp(normalizedRadius, 0.8, 1.2);
        if (normalizedRadius > 0.001) {
          drive.x = (drive.x / normalizedRadius) * bounded;
          drive.z = (drive.z / normalizedRadius) * bounded;
        }
      }

      root.current.position.set(drive.x, 0.035, drive.z);
      root.current.rotation.set(0, drive.heading, 0);
      root.current.rotation.z = -steering * Math.min(0.09, Math.abs(drive.speed) * 0.0035);
      if (wheelAction) wheelAction.timeScale = Math.max(0.05, Math.abs(drive.speed) * 0.14);

      if (state.clock.elapsedTime - lastSpeedPush.current > 0.12) {
        onSpeed(drive.speed);
        lastSpeedPush.current = state.clock.elapsedTime;
      }
    } else {
      root.current.position.set(0, 0.025, 0);
      root.current.rotation.set(0, 0, 0);
      if (wheelAction) wheelAction.timeScale = 0.1;
    }
  });

  return (
    <group ref={root}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

function CameraRig({ mode, driveState, carId }) {
  const { camera } = useThree();
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.fov = mode === 'drive' ? 51 : mode === 'studio' ? 37 : 39;
    camera.position.set(...(mode === 'drive' ? [-8, 4.3, 14] : mode === 'studio' ? [7.8, 3.4, 7.4] : [7.5, 3.0, 8.2]));
    camera.lookAt(0, 0.55, 0);
    camera.updateProjectionMatrix();
  }, [camera, mode, carId]);

  useFrame((_, delta) => {
    if (mode !== 'drive') return;
    const drive = driveState.current;
    const backX = Math.sin(drive.heading) * -8.4;
    const backZ = Math.cos(drive.heading) * -8.4;
    desiredPosition.set(drive.x + backX, 3.15 + Math.min(1.4, Math.abs(drive.speed) * 0.035), drive.z + backZ);
    desiredTarget.set(drive.x + Math.sin(drive.heading) * 3.4, 0.55, drive.z + Math.cos(drive.heading) * 3.4);
    camera.position.lerp(desiredPosition, 1 - Math.exp(-2.8 * delta));
    lookTarget.lerp(desiredTarget, 1 - Math.exp(-4.2 * delta));
    camera.lookAt(lookTarget);
  });

  return null;
}

function LoadFallback() {
  return (
    <Html center>
      <div className="formula-load-card">
        <span className="formula-loader" />
        <span>LOADING VEHICLE</span>
      </div>
    </Html>
  );
}

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Formula scene failed to load:', error); }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export default function FormulaExperience() {
  const [mode, setMode] = useState('kit');
  const [carIndex, setCarIndex] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const driveState = useRef({ x: 0, z: 14, heading: Math.PI / 2, speed: 0 });
  const inputRef = useRef({ forward: false, brake: false, left: false, right: false });
  const car = CARS[carIndex];
  const currentMode = MODES.find((item) => item.id === mode) || MODES[0];

  const resetDrive = useCallback(() => {
    driveState.current = { x: 0, z: 14, heading: Math.PI / 2, speed: 0 };
    inputRef.current = { forward: false, brake: false, left: false, right: false };
    setSpeed(0);
  }, []);

  const chooseMode = useCallback((nextMode) => {
    if (nextMode === mode) return;
    resetDrive();
    setMode(nextMode);
  }, [mode, resetDrive]);

  const changeCar = useCallback((direction) => {
    resetDrive();
    setCarIndex((current) => (current + direction + CARS.length) % CARS.length);
  }, [resetDrive]);

  const setControl = useCallback((control, pressed) => {
    inputRef.current[control] = pressed;
  }, []);

  useEffect(() => {
    if (mode !== 'drive') return undefined;
    const keys = {
      w: 'forward', arrowup: 'forward',
      s: 'brake', arrowdown: 'brake',
      a: 'left', arrowleft: 'left',
      d: 'right', arrowright: 'right',
    };
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (keys[key]) {
        event.preventDefault();
        inputRef.current[keys[key]] = true;
      }
      if (key === 'escape') inputRef.current = { forward: false, brake: false, left: false, right: false };
    };
    const onKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (keys[key]) {
        event.preventDefault();
        inputRef.current[keys[key]] = false;
      }
    };
    const clear = () => { inputRef.current = { forward: false, brake: false, left: false, right: false }; };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clear);
      clear();
    };
  }, [mode]);

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.warn('Fullscreen is unavailable in this browser.', error);
    }
  }, []);

  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const gear = speedKmh < 4 ? 'N' : String(Math.min(8, Math.max(1, Math.ceil(speedKmh / 28))));

  return (
    <main className={`formula-app formula-mode-${mode}`}>
      <SceneErrorBoundary fallback={<div className="formula-error"><strong>3D VIEW UNAVAILABLE</strong><span>Refresh the page or try a browser with WebGL enabled.</span></div>}>
        <Canvas
          className="formula-canvas"
          camera={{ position: [7.5, 3, 8.2], fov: 39, near: 0.1, far: 180 }}
          dpr={[1, 1.65]}
          shadows
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor(mode === 'drive' ? '#aab8bd' : '#0b0d10', 1);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <color attach="background" args={[mode === 'drive' ? '#aab8bd' : '#0b0d10']} />
          {mode === 'drive' ? <fog attach="fog" args={['#aab8bd', 60, 135]} /> : <fog attach="fog" args={['#0b0d10', 28, 88]} />}
          <SceneLighting mode={mode} />
          {mode === 'drive' ? <DriveTrack /> : <StudioStage mode={mode} />}
          <Suspense fallback={<LoadFallback />}>
            <Vehicle key={car.id} car={car} mode={mode} driveState={driveState} inputRef={inputRef} onSpeed={setSpeed} />
          </Suspense>
          <CameraRig mode={mode} driveState={driveState} carId={car.id} />
          {mode !== 'drive' && (
            <OrbitControls
              key={`${mode}-${car.id}`}
              makeDefault
              target={[0, 0.56, 0]}
              enableDamping
              dampingFactor={0.065}
              enablePan={false}
              minDistance={5.1}
              maxDistance={15}
              maxPolarAngle={Math.PI * 0.49}
              minPolarAngle={Math.PI * 0.13}
              autoRotate={mode === 'kit'}
              autoRotateSpeed={0.34}
            />
          )}
        </Canvas>
      </SceneErrorBoundary>

      <div className="formula-vignette" aria-hidden="true" />

      <header className="formula-header">
        <a className="formula-brand" href="#top" onClick={(event) => event.preventDefault()} aria-label="Apex Lab home">
          <span className="formula-brand-mark">A</span>
          <span className="formula-brand-copy"><strong>APEX</strong><small>INTERACTIVE LAB</small></span>
        </a>
        <div className="formula-title-block">
          <span className="formula-kicker">03 / REALTIME VEHICLE STUDY</span>
          <h1>FORMULA<span className="formula-title-dot">.</span></h1>
        </div>
        <div className="formula-header-actions">
          <span className="formula-status"><i /> LIVE SCENE</span>
          <button className="formula-icon-button" type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={fullscreen ? 'M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5' : 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5'} /></svg>
          </button>
        </div>
      </header>

      <div className="formula-left-rail">
        <span className="formula-vertical-label">FORM / FUNCTION / MOTION</span>
        <span className="formula-rail-line" />
        <span className="formula-rail-index">{car.number} — {String(CARS.length).padStart(2, '0')}</span>
      </div>

      <section className="formula-car-info" aria-live="polite">
        <div className="formula-index-line"><span>VEHICLE {car.number}</span><span className="formula-line" /><span>{car.era}</span></div>
        <h2>{car.title}</h2>
        <p>{mode === 'drive' ? 'Throttle in. Find the line.' : mode === 'studio' ? 'Every surface. Every angle.' : 'A study in downforce and proportion.'}</p>
        <div className="formula-spec-grid">
          <div><span>CONFIGURATION</span><strong>{car.mass}</strong></div>
          <div><span>OVERALL LENGTH</span><strong>{car.length}</strong></div>
          <div><span>SCENE MODE</span><strong>{currentMode.label.toUpperCase()}</strong></div>
        </div>
      </section>

      <nav className="formula-car-nav" aria-label="Select formula car">
        <button type="button" onClick={() => changeCar(-1)}><span>←</span><span><small>PREVIOUS</small><strong>{CARS[(carIndex + CARS.length - 1) % CARS.length].title}</strong></span></button>
        <span className="formula-car-nav-divider" />
        <button type="button" onClick={() => changeCar(1)}><span><small>NEXT</small><strong>{CARS[(carIndex + 1) % CARS.length].title}</strong></span><span>→</span></button>
      </nav>

      {mode === 'drive' && (
        <div className="formula-telemetry" aria-live="polite">
          <div className="formula-speed"><strong>{String(speedKmh).padStart(3, '0')}</strong><span>KM/H</span></div>
          <div className="formula-telemetry-divider" />
          <div className="formula-gear"><small>GEAR</small><strong>{gear}</strong></div>
          <div className="formula-rpm"><div className="formula-rpm-top"><span>RPM</span><strong>{String(Math.round(Math.min(15000, speedKmh * 93 + 850))).padStart(5, '0')}</strong></div><div className="formula-rpm-bar"><i style={{ width: `${Math.max(4, Math.min(100, (speedKmh * 93 + 850) / 150))}%` }} /></div></div>
          <div className="formula-drive-hint"><span className="formula-key">W</span><span className="formula-key">A</span><span className="formula-key">S</span><span className="formula-key">D</span><small>OR ARROWS</small></div>
        </div>
      )}

      <footer className="formula-footer">
        <div className="formula-footer-note">
          <span className="formula-mode-number">{currentMode.number}</span>
          <div><strong>{currentMode.caption}</strong><small>{mode === 'drive' ? 'W / ↑ ACCELERATE · S / ↓ BRAKE · A D / ← → STEER' : mode === 'studio' ? 'DRAG TO ORBIT · SCROLL TO ZOOM' : 'DRAG TO INSPECT · PREV / NEXT TO CHANGE ERA'}</small></div>
        </div>
        <nav className="formula-mode-switch" aria-label="Experience mode">
          {MODES.map((item) => (
            <button key={item.id} type="button" className={mode === item.id ? 'active' : ''} onClick={() => chooseMode(item.id)} aria-pressed={mode === item.id}>
              <span>{item.number}</span>{item.label}{mode === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="formula-footer-right">
          <span className="formula-progress"><i style={{ width: `${((carIndex + 1) / CARS.length) * 100}%` }} /></span>
          <span>{String(carIndex + 1).padStart(2, '0')} <em>/</em> {String(CARS.length).padStart(2, '0')}</span>
          <button type="button" className="formula-reset-button" onClick={() => { resetDrive(); chooseMode('kit'); }} title="Reset experience">RESET ↺</button>
        </div>
      </footer>

      {mode === 'drive' && (
        <div className="formula-touch-controls" aria-label="Touch driving controls">
          <div className="formula-steering-pad">
            <button type="button" aria-label="Steer left" onPointerDown={() => setControl('left', true)} onPointerUp={() => setControl('left', false)} onPointerCancel={() => setControl('left', false)} onPointerLeave={() => setControl('left', false)}>←</button>
            <button type="button" aria-label="Steer right" onPointerDown={() => setControl('right', true)} onPointerUp={() => setControl('right', false)} onPointerCancel={() => setControl('right', false)} onPointerLeave={() => setControl('right', false)}>→</button>
          </div>
          <div className="formula-pedal-pad">
            <button type="button" onPointerDown={() => setControl('brake', true)} onPointerUp={() => setControl('brake', false)} onPointerCancel={() => setControl('brake', false)} onPointerLeave={() => setControl('brake', false)}>BRAKE</button>
            <button type="button" onPointerDown={() => setControl('forward', true)} onPointerUp={() => setControl('forward', false)} onPointerCancel={() => setControl('forward', false)} onPointerLeave={() => setControl('forward', false)}>THROTTLE ↑</button>
          </div>
        </div>
      )}

      <div className="formula-bottom-meta"><span>R&amp;D / OPEN-WHEEL</span><span>THREE.JS · WEBGL</span></div>
      <div className="formula-load-mark" aria-hidden="true"><span /> CC0 VEHICLE ASSETS</div>
    </main>
  );
}

CARS.forEach((item) => useGLTF.preload(item.url));
