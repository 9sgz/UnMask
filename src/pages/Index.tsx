import { SecurityScanner } from '@/components/SecurityScanner';
import LightPillar from '@/components/LightPillar';

const Index = () => {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1}
          rotationSpeed={0.3}
          glowAmount={0.002}
          pillarWidth={3}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={25}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>
      <div className="relative z-10">
        <SecurityScanner />
      </div>
    </>
  );
};

export default Index;
