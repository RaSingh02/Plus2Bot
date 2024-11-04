import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

interface LeaderboardEntry {
  username: string;
  count: number;
}

interface LeaderboardPodiumProps {
  data: LeaderboardEntry[] | [string, number][];
  barColor: string;
  backgroundColor: string;
  onUsernameClick: (username: string) => void;
}

const Bar = ({ position, height, username, count, onUsernameClick }: { position: THREE.Vector3; height: number; username: string; count: number; onUsernameClick: (username: string) => void }) => {
  const mesh = useRef<Mesh>(null);
  const [animatedHeight, setAnimatedHeight] = React.useState(0);
  
  useEffect(() => {
    setAnimatedHeight(0); // Reset height when data changes
  }, [height]);

  useFrame(() => {
    if (animatedHeight < height) {
      setAnimatedHeight(prev => Math.min(prev + 0.05, height));
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh} position={[0, animatedHeight / 2, 0]}>
        <boxGeometry args={[0.5, animatedHeight, 0.5]} />
        <meshStandardMaterial color="#9147ff" />
      </mesh>
      <Text
        position={[0, -0.2, 0.3]}
        fontSize={0.15}
        color="#9147ff"
        anchorX="center"
        anchorY="middle"
        onClick={() => onUsernameClick(username)}
      >
        {username}
      </Text>
      <Text
        position={[0, -0.4, 0.3]}
        fontSize={0.12}
        color="gray"
        anchorX="center"
        anchorY="middle"
      >
        {count}
      </Text>
    </group>
  );
};

const CameraController = ({ initialY }: { initialY: number }) => {
  const { camera } = useThree();
  const mouseX = useRef(0);
  const targetRotationY = useRef(0);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    targetRotationY.current += (mouseX.current * 0.05 - targetRotationY.current) * 0.2;
    camera.position.x = Math.sin(targetRotationY.current) * 3;
    camera.position.z = Math.cos(targetRotationY.current) * 3;
    camera.position.y = initialY;
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({ data, barColor, backgroundColor, onUsernameClick }) => {
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  const getEntry = (index: number): [string, number] => {
    if (!data || !data[index]) return ['', 0];
    const entry = data[index];
    if (Array.isArray(entry)) return entry;
    return [entry.username, entry.count];
  };

  const maxCount = data ? Math.max(...podiumOrder.map(index => Math.abs(getEntry(index)[1]))) : 0;

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="w-full h-[300px] sm:h-[400px] mx-auto rounded-lg">
      <Canvas camera={{ position: [0, 0, 3], fov: 55 }}>
        
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <CameraController initialY={0.35} />
        <group scale={[0.8, 0.8, 0.8]}>
          {podiumOrder.map((index, position) => {
            const [username, count] = getEntry(index);
            const height = (Math.abs(count) / maxCount) * 2;
            const xPosition = position === 0 ? -1.5 : position === 1 ? 0 : 1.5;
            return (
              <Bar 
                key={`${username}-${count}`}
                position={new THREE.Vector3(xPosition, -1, 0)}
                height={height}
                username={username}
                count={count}
                onUsernameClick={onUsernameClick}
              />
            );
          })}
        </group>
      </Canvas>
    </div>
  );
};

export default LeaderboardPodium;